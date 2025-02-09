import ScriptureReader from "@/components/scripture-reader";
import { fetchAnnotationsByChapter } from "@/lib/annotations/data";
import { fetchCurrentUserId } from "@/lib/auth/data";
import { getBooksInTheBookOfMormon, listChapters, loadBook, loadChapter } from "@/lib/scripture_utils/scriptureUtils";

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
        title: `${toTitleCase(bookId.replace(/-/g, " "))} | ${toTitleCase(chapterId.replace('_', ' '))}`,
        description: `Read ${toTitleCase(bookId.replace(/-/g, " "))} ${toTitleCase(chapterId.replace('_', ' '))} with annotations and highlights.`,
    };
}

export default async function Page({ params }: ChapterPageProps) {
    const finalParams = await params;
    const bookId = decodeURIComponent(finalParams.bookId)
    const chapterId = decodeURIComponent(finalParams.chapterId)

    // Fetch data for the chapter and annotations
    const chapterData = loadChapter(bookId, chapterId);
    const bookData = loadBook(bookId)
    if (!chapterData || !bookData) {
        return <div>Chapter not found.</div>;
    }
    const chapters = listChapters(bookId)
    const annotations = await fetchAnnotationsByChapter(bookId, Number(chapterData.chapter_title.slice(8)));

    const currentUserId = await fetchCurrentUserId()
    if (currentUserId == null) {
        return <div>No go</div>
    }

    let nextBook: string | null = null
    let previousBook: string | null = null
    let previousBookLastChapter = 1
    const books = getBooksInTheBookOfMormon()
    books.map((bookTitle, index) => {
        if (bookData.title == bookTitle) {
            if (index < books.length - 1) {
                nextBook = books[index + 1]
            }
    
            if (index > 0) {
                previousBook = books[index - 1]
                previousBookLastChapter = listChapters(previousBook.replaceAll(' ', '-')).length
            }
        }
    })

    return (
        <ScriptureReader  
            chapter={chapterData}
            book={bookData}
            initialAnnotations={annotations ?? []}
            currentUserId={currentUserId}
            chapters={chapters}
            nextBook={nextBook}
            previousBook={previousBook}
            previousBookLastChapter={previousBookLastChapter}
        />
    );
};
