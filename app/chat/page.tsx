import Chat from "@/components/chat/chat";
import { fetchCurrentUserId } from "@/lib/auth/data";
import { Metadata } from "next";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
    const title = 'Family Plates Chat';

    // Create a rich description
    const description = 'Talk with insights from the family.';

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';  // Fallback for local testing

    const metadata = {
        metadataBase: new URL(baseUrl),  // Ensure absolute URLs
        title,
        description,
    };

    //console.log(metadata);
    return metadata;
}

export default async function Page() {

    const userAgent = (await headers()).get('user-agent') || '';
    const isBot = /bot|crawl|spider|slurp|facebook|twitter|discord|whatsapp|telegram|linkedin/i.test(userAgent);

    if (isBot) {
        console.log('Bot detected');
        return <div>Please share an og image for this tool.</div>
    }

    const currentUserId = await fetchCurrentUserId()

    if (!currentUserId) {
        return <div>No access</div>
    }
    return <Chat />;
}
