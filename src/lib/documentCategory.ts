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
  const upperCategory = category.toUpperCase();

  // Check if the uppercased category exists in the DocumentCategory enum
  if (Object.values(DocumentCategory).includes(upperCategory as DocumentCategory)) {
    return upperCategory as DocumentCategory;
  }

  console.warn(`Invalid DocumentCategory: ${category}`);
  return null;
}
