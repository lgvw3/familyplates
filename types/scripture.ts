export interface Verse {
  number: number;
  text: string;
}

export interface Chapter {
  title: string;
  chapter_title: string;
  heading: string;
  summary: string;
  verses: Verse[];
}

export type Book = {
  title: string,
  subtitle: string[]
  intro: string[]
}

export type AnnotationType = 'note' | 'link' | 'photo' | 'combo';
export type HighlightColor = 'yellow' | 'green' | 'blue' | 'purple' | 'pink';
export type TextStyle = 'underline' | 'bold' | 'italic' | 'none';

export interface Annotation {
  id: string;
  verseNumber: number;
  text: string;
  highlightedText: string;
  type: AnnotationType;
  color: HighlightColor;
  style: TextStyle;
  createdAt: string;
  url?: string;
  photoUrl?: string;
}

