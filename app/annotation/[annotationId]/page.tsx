import AnnotationViewerSolo from "@/components/feed/annotation-viewer-solo";
import { fetchAnnotationById } from "@/lib/annotations/data";
import { fetchUsersAsMap } from "@/lib/auth/accounts";
import { fetchCurrentUserId } from "@/lib/auth/data";

export interface AnnotationPageProps {
    params: Promise<{
        annotationId: string;
    }>;
}

// Dynamic Metadata (Optional)
export async function generateMetadata({ params }: AnnotationPageProps) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { annotationId } = await params;
    return {
        title: `Annotation View`,
        description: `Read the details of this annotation`,
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
            annotation={annotationData} 
            currentUserId={currentUserId}
            userName={user?.name}
        />
    );
};
