import IntroReader from "@/components/intro-reader";
import { loadIntroMaterial } from "@/lib/scripture_utils/scriptureUtils";

interface ChapterPageProps {
    params: Promise<{
        introId: string;
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
    const { introId } = await params;
    return {
        title: `${toTitleCase(introId.replace(/-/g, " "))}`,
        description: `Read ${toTitleCase(introId.replace(/-/g, " "))} with annotations and highlights.`,
    };
}

export default async function Page({ params }: ChapterPageProps) {
    const finalParams = await params;
    const introId = decodeURIComponent(finalParams.introId)

    // Fetch data for the chapter and annotations
    const introData = loadIntroMaterial(introId);
    //const annotations = await getAnnotations(bookId, chapterId);

    if (!introData) {
        return <div>Introductary Material not found.</div>;
    }

    return (
        <IntroReader  
            intro={introData}
        />
    );
};