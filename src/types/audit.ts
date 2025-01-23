// types/audit.ts

export interface ChangeHistoryEntry {
    old: any;
    new: any;
    datePerformed: string;
    performedBy: string;
  }
  