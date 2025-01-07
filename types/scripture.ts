import { FuseResultMatch } from "fuse.js";

export interface Verse {
  number: number;
  text: string;
}

export interface Chapter {
  title: string;
  chapter_title: string;
  chapter_heading: string;
  summary: string;
  verses: Verse[];
}

export type Book = {
  title: string,
  subtitle: string[]
  intro: string[]
}

export type Intro = {
  title: string,
  paragraphs: string[]
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

export interface ScriptureItem {
  id: string;
  type: "book" | "chapter" | "verse" | "intro";
  text: string;
  summary?: string;
  chapter_id: string;
  book_id: string;
  content: string;
  verse_number?: number;
  index?: number
  title?: string
}

export interface SearchResult extends ScriptureItem {
  matches: FuseResultMatch[]; // Matches metadata from Fuse.js
}

