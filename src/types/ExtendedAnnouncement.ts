// src/types/ExtendedAnnouncement.ts
import { Announcement } from "@prisma/client";

export interface ExtendedAnnouncement extends Omit<Announcement, "roleTargets" | "imageUrl"> {
  pinned: boolean;
  archived: boolean;
  imageUrl?: string | null; // Now allows string, null, or undefined
  roleTargets: string[];
}
