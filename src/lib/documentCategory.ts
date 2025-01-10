// src/utils/documentCategory.ts

import { DocumentCategory } from '@prisma/client';

/**
 * Maps a string to the corresponding DocumentCategory enum value.
 * Returns null if the input does not match any enum value.
 *
 * @param category - The input category string.
 * @returns The corresponding DocumentCategory enum value or null.
 */
export function mapToDocumentCategory(category: string): DocumentCategory | null {
  // Directly check if the input matches any enum value without normalization
  if (Object.values(DocumentCategory).includes(category as DocumentCategory)) {
    return category as DocumentCategory;
  }

  console.warn(`Invalid DocumentCategory: ${category}`);
  return null;
}
