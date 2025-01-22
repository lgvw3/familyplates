import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toTitleCase(str: string): string {
  return str
    .split(' ') // Split the string into words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word and lowercase the rest
    .join(' '); // Join the words back into a single string
}

export function getInitials (name?: string): string {
  if (!name) {
    return ''
  }
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
};