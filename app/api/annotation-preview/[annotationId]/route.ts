import { NextResponse } from 'next/server';
import { fetchAnnotationById } from "@/lib/annotations/data";
import { fetchUsersAsMap } from "@/lib/auth/accounts";
import { toTitleCase } from "@/lib/utils";

export async function GET(
    request: Request,
    { params }: { params: { annotationId: string } }
) {
    const annotationId = params.annotationId;
    
    try {
        // Modify fetchAnnotationById to skip auth check for this preview
        const annotationData = await fetchAnnotationById(annotationId, true); // Add a skipAuth parameter
        
        if (!annotationData) {
            return NextResponse.json(
                { 
                    title: 'Annotation Not Found',
                    description: 'This annotation could not be found.'
                }
            );
        }

        const userMap = fetchUsersAsMap();
        const author = userMap.get(annotationData.userId);

        if (!author) {
            return NextResponse.json(
                {
                    title: 'Annotation Not Found',
                    description: 'This annotation could not be found.'
                }
            );
        }

        // Return only the public preview data
        return NextResponse.json({
            title: `Annotation by ${author.name}`,
            description: annotationData.unboundAnnotation
                ? `${author.name} shared a note`
                : `${author.name} annotated ${toTitleCase(annotationData.bookId.replaceAll('-', ' '))} ${annotationData.chapterNumber}:${annotationData.verseNumber}`,
            previewText: annotationData.unboundAnnotation 
                ? annotationData.text
                : `"${annotationData.highlightedText}" - ${toTitleCase(annotationData.bookId.replaceAll('-', ' '))} ${annotationData.chapterNumber}:${annotationData.verseNumber}`
        });
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            {
                title: 'Error',
                description: 'Could not load annotation preview'
            }
        );
    }
}
