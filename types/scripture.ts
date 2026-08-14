import type { FuseResultMatch } from "fuse.js";
import type { ObjectId } from "mongodb";

export interface Verse {
  number: number;
  text: string;
}

export interface Chapter {
  title: string;
  chapter_title: string;
  chapter_heading: string;
  summary: string;
  chapter_notes?: string;
  verses: Verse[];
}

export type Book = {
  title: string,
  subtitle: string[]
  intro: string[]
}

export type Intro = {
  title: string,
  header?: string,
  subtitle?: string,
  additional: string,
  paragraphs: string[]
}

export type AnnotationComment = {
  _id: ObjectId | string;
  userId: number,
  userName: string,
  timeStamp: Date,
  content: string
}

export type AnnotationLike = {
  _id: ObjectId | string;
  userId: number,
  userName: string,
  timeStamp: Date
}

export type AnnotationType = 'note' | 'link' | 'photo' | 'combo';
export type HighlightColor = 'yellow' | 'green' | 'blue' | 'purple' | 'pink';
export type TextStyle = 'underline' | 'bold' | 'italic' | 'none';

export interface TextRangePoint {
  unit: number;
  offset: number;
}

export interface TextQuote {
  exact: string;
  prefix?: string;
  suffix?: string;
}

export interface ScriptureRangeTarget {
  kind: 'scripture';
  sourceVersion: 'book-of-mormon-local-v1';
  bookId: string;
  chapterNumber: number;
  start: TextRangePoint;
  end: TextRangePoint;
  quote: TextQuote;
}

export interface IntroRangeTarget {
  kind: 'intro';
  sourceVersion: 'book-of-mormon-local-v1';
  introId: string;
  start: TextRangePoint;
  end: TextRangePoint;
  quote: TextQuote;
}

export type AnnotationTarget = ScriptureRangeTarget | IntroRangeTarget;

export interface Annotation {
  _id: ObjectId | string | null;
  schemaVersion: 2;
  target: AnnotationTarget | null;
  text: string;
  type: AnnotationType;
  color: HighlightColor;
  createdAt: Date;
  url?: string;
  photoUrl?: string;
  userId: number,
  userName: string,
  comments: AnnotationComment[]
  likes: AnnotationLike[]
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
