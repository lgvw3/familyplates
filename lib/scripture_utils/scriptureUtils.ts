import fs from 'fs';
import path from 'path';

export function loadBook(bookName: string) {
  const filePath = path.join(process.cwd(), 'lib', 'scripture_data', 'books', `${bookName}.json`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

export function loadChapter(bookName: string, chapterNumber: string) {
  const filePath = path.join(
    process.cwd(),
    'lib',
    'scripture_data',
    'chapters',
    bookName,
    `${chapterNumber}.json`
  );
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

export function loadIntroMaterial(materialName: string) {
  const filePath = path.join(process.cwd(), 'lib', 'scripture_data', 'intro_material', `${materialName}.json`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

export function listChapters(bookName: string) {
  const dirPath = path.join(process.cwd(), 'lib', 'scripture_data', 'chapters', bookName);
  const files = fs.readdirSync(dirPath);
  return files.map((file) => path.basename(file, '.json').replace('chapter_', ''));
}

