// src/components/EditUserTabs/types.ts

export interface AuditLogEntry {
    id: string;
    action: string;
    performedBy: string;
    userUsername: string;
    targetUsername: string;
    datePerformed: string; // ISO string
    details: string; // JSON string
    user: {
      username: string;
      firstName: string;
      lastName: string;
    };
  }
  
  export interface ChangeHistoryEntry {
    old: any;
    new: any;
    datePerformed: string;
    performedBy: string;
  }
  