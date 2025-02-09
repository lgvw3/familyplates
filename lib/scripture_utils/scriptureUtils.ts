import { Book, Chapter, Intro } from '@/types/scripture';
import fs from 'fs';
import path from 'path';

export function loadBook(bookName: string) : Book | undefined {
  try {
    const filePath = path.join(process.cwd(), 'lib', 'scripture_data', 'books', `${bookName}.json`);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  }
  catch(error) {
    console.error(`Error loading book ${bookName}: ${error}`);
  }
}

export function loadChapter(bookName: string, chapterNumber: string): Chapter | undefined {
  try {
    const filePath = path.join(
      process.cwd(),
      'lib',
      'scripture_data',
      'chapters',
      bookName,
      `${chapterNumber}.json`
    );
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents) as Chapter;

  } catch(error) {
    console.error(`Error loading chapter in book ${bookName}, chapter ${chapterNumber}: ${error}`);
  }
}

export function loadIntroMaterial(materialName: string): Intro | undefined {
  try {
    const filePath = path.join(process.cwd(), 'lib', 'scripture_data', 'intro_material', `${materialName}.json`);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents) as Intro;
  } catch(error) {
    console.error(`Error loading intro by name of ${materialName}: ${error}`);
  }
}

export function listChapters(bookName: string) {
  const dirPath = path.join(process.cwd(), 'lib', 'scripture_data', 'chapters', bookName);
  const files = fs.readdirSync(dirPath);
  return files.map((file) => path.basename(file, '.json').replace('chapter_', ''));
}

const BooksInTheBookOfMormon = [
  "The First Book of Nephi",
  "The Second Book of Nephi",
  "The Book of Jacob",
  "The Book of Jarom",
  "The Book of Omni",
  "The Words of Mormon",
  "The Book of Mosiah",
  "The Book of Alma",
  "The Book of Helaman",
  "Third Nephi The Book of Nephi",
  "Fourth Nephi The Book of Nephi",
  "The Book of Mormon",
  "The Book of Ether",
  "The Book of Moroni"
]

export function getBooksInTheBookOfMormon() {
  return [...BooksInTheBookOfMormon]
}