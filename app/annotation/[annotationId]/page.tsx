import AnnotationViewerSolo from "@/components/feed/annotation-viewer-solo";
import { fetchAnnotationById } from "@/lib/annotations/data";
import { fetchUsersAsMap } from "@/lib/auth/accounts";
import { fetchCurrentUserId } from "@/lib/auth/data";
import { Metadata } from "next";
import { headers } from "next/headers";

export interface AnnotationPageProps {
    params: Promise<{
        annotationId: string;
    }>;
}

// Dynamic Metadata
export async function generateMetadata({ params }: AnnotationPageProps): Promise<Metadata> {
    const { annotationId } = await params;
    const decodedId = decodeURIComponent(annotationId);
    
    const annotationData = await fetchAnnotationById(decodedId, true);
    if (!annotationData) {
        return {
            title: 'Annotation Not Found',
            description: 'This annotation could not be found.',
        };
    }

    const userMap = fetchUsersAsMap();
    const author = userMap.get(annotationData.userId);

    if (!author) {
        return {
            title: 'Annotation Not Found',
            description: 'This annotation could not be found.',
        };
    }

    const title = author.name;
    
    // Create a rich description
    let description = '';
    if (!annotationData.unboundAnnotation && annotationData.highlightedText) {
        description = `"${annotationData.highlightedText}" - ${annotationData.bookId.replaceAll('-', ' ')} ${annotationData.chapterNumber}:${annotationData.verseNumbers[0]}${(annotationData.verseNumbers.length > 1 ? `-${annotationData.verseNumbers[annotationData.verseNumbers.length - 1]}` : '')}\n\n`;
    }
    description += annotationData.text

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';  // Fallback for local testing
    //const ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`;

    const metadata = {
        metadataBase: new URL(baseUrl),  // Ensure absolute URLs
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'article',
            authors: [author.name],
            siteName: 'Family Plates',
            url: `${baseUrl}/annotation/${annotationId}`,
            images: [
                {
                    url: `${baseUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`,
                    width: 1200,
                    height: 630,
                    alt: `Annotation by ${author.name}`
                }
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            creator: author.name,
            site: '@familyplates',
            images: [`${baseUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`],
        },
    };

    //console.log(metadata);
    return metadata;
}

export default async function Page({ params }: AnnotationPageProps) {
    const userAgent = (await headers()).get('user-agent') || '';
    const isBot = /bot|crawl|spider|slurp|facebook|twitter|discord|whatsapp|telegram|linkedin/i.test(userAgent);

    if (isBot) {
        console.log('Bot detected');
        return <div>Please share an og image for this annotation.</div>
    }

    const finalParams = await params;
    const annotationId = decodeURIComponent(finalParams.annotationId)

    const annotationData = await fetchAnnotationById(annotationId)
    if (!annotationData) {
        return <div>Annotation not found.</div>;
    }

    const currentUserId = await fetchCurrentUserId()

    if (!currentUserId) {
        return <div>No access</div>
    }

    const userMap = fetchUsersAsMap()
    const author = userMap.get(annotationData.userId)
    const user = userMap.get(currentUserId)
    if (!author || !user) {
        return <div>Annotation not found.</div>;
    }

    return (
        <AnnotationViewerSolo
            author={author} 
            initialAnnotation={annotationData} 
            currentUserId={currentUserId}
            userName={user?.name}
        />
    );
};
