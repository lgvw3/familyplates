import { MongoClient, MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI || "your-mongodb-connection-string";

if (!process.env.MONGODB_URI) {
    throw new Error("Please add your MongoDB URI to .env.local");
}

// Connection options optimized for Vercel serverless functions
const options: MongoClientOptions = {
    maxPoolSize: 1, // One connection per serverless function instance
    minPoolSize: 0, // Don't maintain connections when function is idle
    maxIdleTimeMS: 60000, // Close idle connections after 1 minute (function timeout is usually shorter)
    serverSelectionTimeoutMS: 5000, // Fast failure for server selection
    socketTimeoutMS: 30000, // Socket timeout
    connectTimeoutMS: 10000, // Connection timeout
    retryWrites: true,
    retryReads: true,
    // Critical for serverless: don't keep connections alive between function invocations
    //keepAlive: false,
    // Force new connections when needed
    forceServerObjectId: false,
    // Heartbeat to detect stale connections quickly
    heartbeatFrequencyMS: 10000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
    // In development, use a global variable to preserve the connection across hot reloads
    const globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>;
    };
    
    if (!globalWithMongo._mongoClientPromise) {
        client = new MongoClient(uri, options);
        globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    // In production, each serverless function gets a fresh connection
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

// Connection validation wrapper for serverless environments
export async function getValidatedClient(): Promise<MongoClient> {
    try {
        const client = await clientPromise;
        
        // Quick ping to verify connection is alive
        await client.db("admin").command({ ping: 1 });
        
        return client;
    } catch (error) {
        console.error("MongoDB connection validation failed, creating new connection:", error);
        
        // Create a completely new connection
        const newClient = new MongoClient(uri, options);
        const newClientPromise = newClient.connect();
        
        // Update the global promise in development
        if (process.env.NODE_ENV === "development") {
            const globalWithMongo = global as typeof globalThis & {
                _mongoClientPromise?: Promise<MongoClient>;
            };
            globalWithMongo._mongoClientPromise = newClientPromise;
        }
        
        return newClientPromise;
    }
}

// Legacy export for backward compatibility
export default clientPromise;
