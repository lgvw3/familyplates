import { attachDatabasePool } from '@vercel/functions';
import { MongoClient, MongoClientOptions } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {
  maxIdleTimeMS: 5000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient;
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClient = client;
    globalWithMongo._mongoClientPromise = client.connect();
  } else if (globalWithMongo._mongoClient) {
    client = globalWithMongo._mongoClient;
  } else {
    // Compatibility with a development process started before the client was
    // cached separately. HMR will replace this branch on the next reload.
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClient = client;
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);

  // Attach the client to ensure proper cleanup on function suspension
  attachDatabasePool(client);

  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export { client as mongoClient };
export default clientPromise;
