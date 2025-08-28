'use server'

import { Annotation } from "@/types/scripture";
import clientPromise from "../mongodb";
import { loadChapter } from "@/lib/scripture_utils/scriptureUtils";

export async function migrateAnnotations() {
    const client = await clientPromise;
    const db = client.db("main");
    const oldCollection = db.collection("annotations");
    const newCollection = db.collection("annotations_new_new");

    try {
        // Get all annotations
        const annotations = await oldCollection.find<Annotation>({}).toArray();
        let successCount = 0;
        let errorCount = 0;

        for (const annotation of annotations) {
            try {
                let newAnnotation: Annotation;

                if (annotation.unboundAnnotation) {
                    // For unbound annotations, we'll set startIndex and endIndex to 0
                    // and verseNumbers to an empty array since they're not tied to any verse
                    newAnnotation = {
                        _id: annotation._id,
                        startIndex: 0,
                        endIndex: 0,
                        verseNumbers: [],
                        chapterNumber: annotation.chapterNumber,
                        bookId: annotation.bookId,
                        text: annotation.text,
                        highlightedText: annotation.highlightedText,
                        type: annotation.type,
                        color: annotation.color,
                        createdAt: annotation.createdAt,
                        url: annotation.url,
                        photoUrl: annotation.photoUrl,
                        userId: annotation.userId,
                        userName: annotation.userName,
                        comments: annotation.comments || [],
                        likes: annotation.likes || [],
                        unboundAnnotation: true
                    };
                } else if (annotation.startIndex !== undefined && annotation.endIndex !== undefined) {
                    // For annotations that already have startIndex and endIndex,
                    // just copy them over with their existing values
                    newAnnotation = {
                        ...annotation,
                        verseNumbers: annotation.verseNumbers || [annotation.verseNumber]
                    };
                } else {
                    // For regular annotations, calculate the indices
                    const chapter = loadChapter(annotation.bookId, `chapter_${annotation.chapterNumber}`);
                    if (!chapter) {
                        console.error(`Could not load chapter for annotation ${annotation._id}`);
                        errorCount++;
                        continue;
                    }

                    // Combine all verses into one text, including verse numbers and proper spacing
                    const fullText = chapter.verses.map(verse => 
                        `${verse.number} ${verse.text}`
                    ).join('\n\n');

                    // Find the verse that contains our annotation
                    const targetVerse = chapter.verses.find(v => v.number === annotation.verseNumber);
                    if (!targetVerse) {
                        console.error(`Could not find verse ${annotation.verseNumber} for annotation ${annotation._id}`);
                        errorCount++;
                        continue;
                    }

                    // Calculate the start index by finding the position of the verse in the full text
                    const verseStartIndex = fullText.indexOf(`${targetVerse.number} ${targetVerse.text}`);
                    if (verseStartIndex === -1) {
                        console.error(`Could not find verse text for annotation ${annotation._id}`);
                        errorCount++;
                        continue;
                    }

                    // Find the highlighted text within the verse
                    const highlightedTextStart = targetVerse.text.indexOf(annotation.highlightedText);
                    if (highlightedTextStart === -1) {
                        console.error(`Could not find highlighted text for annotation ${annotation._id}`);
                        errorCount++;
                        continue;
                    }

                    // Calculate the final start and end indices
                    const startIndex = verseStartIndex + targetVerse.number.toString().length + 1 + highlightedTextStart;
                    const endIndex = startIndex + annotation.highlightedText.length;

                    newAnnotation = {
                        _id: annotation._id,
                        startIndex,
                        endIndex,
                        verseNumbers: [annotation.verseNumber],
                        chapterNumber: annotation.chapterNumber,
                        bookId: annotation.bookId,
                        text: annotation.text,
                        highlightedText: annotation.highlightedText,
                        type: annotation.type,
                        color: annotation.color,
                        createdAt: annotation.createdAt,
                        url: annotation.url,
                        photoUrl: annotation.photoUrl,
                        userId: annotation.userId,
                        userName: annotation.userName,
                        comments: annotation.comments || [],
                        likes: annotation.likes || []
                    };
                }

                // Save to new collection
                await newCollection.insertOne(newAnnotation);
                successCount++;

            } catch (error) {
                console.error(`Error processing annotation ${annotation._id}:`, error);
                errorCount++;
            }
        }

        return {
            message: 'Migration completed',
            stats: {
                total: annotations.length,
                success: successCount,
                error: errorCount
            }
        };

    } catch (error) {
        console.error('Migration failed:', error);
        return {
            message: 'Migration failed',
            error: error
        };
    }
}
