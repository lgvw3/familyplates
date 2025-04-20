import AnnotationViewerSolo from "@/components/feed/annotation-viewer-solo";
import { fetchAnnotationById } from "@/lib/annotations/data";
import { fetchUsersAsMap } from "@/lib/auth/accounts";
import { fetchCurrentUserId } from "@/lib/auth/data";
import { Metadata } from "next";

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
    
    // Create a rich description that includes both scripture and annotation when available
    let description = '';
    if (!annotationData.unboundAnnotation && annotationData.highlightedText) {
        description = `"${annotationData.highlightedText}" - ${annotationData.bookId.replaceAll('-', ' ')} ${annotationData.chapterNumber}:${annotationData.verseNumber}\n\n`;
    }
    // Add the annotation text
    description += annotationData.text.substring(0, 200) + (annotationData.text.length > 200 ? '...' : '');

    return {
        metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'article',
            authors: [author.name],
            siteName: 'Family Plates',
            url: `/annotation/${annotationId}`,
            images: [
                {
                    url: `/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`,
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
            images: [`/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`],
        },
        themeColor: 'hsl(220 60% 20%)',
    };
}

export default async function Page({ params }: AnnotationPageProps) {
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
