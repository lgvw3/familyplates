import ScriptureReader from "@/components/scripture-reader";
import { loadBook, loadChapter } from "@/lib/scripture_utils/scriptureUtils";

interface ChapterPageProps {
    params: Promise<{
        bookId: string;
        chapterId: string;
    }>;
}

function toTitleCase(str: string): string {
    return str
      .split(' ') // Split the string into words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word and lowercase the rest
      .join(' '); // Join the words back into a single string
}

// Dynamic Metadata (Optional)
export async function generateMetadata({ params }: ChapterPageProps) {
    const { bookId, chapterId } = await params;
    return {
        title: `${toTitleCase(bookId.replace(/-/g, " "))} Chapter ${chapterId}`,
        description: `Read ${toTitleCase(bookId.replace(/-/g, " "))} Chapter ${chapterId} with annotations and highlights.`,
    };
}

export default async function Page({ params }: ChapterPageProps) {
    const finalParams = await params;
    const bookId = decodeURIComponent(finalParams.bookId)
    const chapterId = decodeURIComponent(finalParams.chapterId)

    // Fetch data for the chapter and annotations
    const chapterData = loadChapter(bookId, chapterId);
    const bookData = loadBook(bookId)
    //const annotations = await getAnnotations(bookId, chapterId);

    if (!chapterData) {
        return <div>Chapter not found.</div>;
    }

    return (
        <ScriptureReader  
            chapter={chapterData}
            book={bookData}
        />
    );
};
