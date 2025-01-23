// utils/processAuditLogs.ts

interface AuditLog {
    id: string;
    targetUsername: string;
    action: string;
    datePerformed: string;
    performedBy: string;
    details: string; // JSON string
    user: {
      username: string;
      firstName: string;
      lastName: string;
    };
  }
  
  interface ChangeHistoryEntry {
    old: any;
    new: any;
    datePerformed: string;
    performedBy: string;
  }
  
  interface PrimitiveChange {
    old: any;
    new: any;
  }
  
  interface ArrayChange {
    old: any[];
    new: any[];
  }
  
  export const processAuditLogs = (auditLogs: AuditLog[]): Record<string, ChangeHistoryEntry[]> => {
    const changeHistory: Record<string, ChangeHistoryEntry[]> = {};
  
    auditLogs.forEach((log) => {
      try {
        const details = JSON.parse(log.details);
  
        const traverse = (obj: any, path: string = '') => {
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              const currentPath = path ? `${path}.${key}` : key;
              const value = obj[key];
  
              // Check if value is an object with 'old' and 'new' properties
              if (
                typeof value === 'object' &&
                value !== null &&
                'old' in value &&
                'new' in value
              ) {
                // Handle array changes
                if (Array.isArray(value.old) && Array.isArray(value.new)) {
                  (value as ArrayChange).old.forEach((oldItem: any, index: number) => {
                    const newItem = (value as ArrayChange).new[index] || {};
                    for (const subKey in newItem) {
                      if (newItem.hasOwnProperty(subKey)) {
                        const fieldPath = `${currentPath}.${index}.${subKey}`;
                        if (oldItem[subKey] !== newItem[subKey]) {
                          if (!changeHistory[fieldPath]) {
                            changeHistory[fieldPath] = [];
                          }
                          changeHistory[fieldPath].push({
                            old: oldItem[subKey],
                            new: newItem[subKey],
                            datePerformed: log.datePerformed,
                            performedBy: log.performedBy,
                          });
                        }
                      }
                    }
                  });
                } else {
                  // Handle primitive field changes
                  if (value.old !== value.new) {
                    if (!changeHistory[currentPath]) {
                      changeHistory[currentPath] = [];
                    }
                    changeHistory[currentPath].push({
                      old: value.old,
                      new: value.new,
                      datePerformed: log.datePerformed,
                      performedBy: log.performedBy,
                    });
                  }
                }
              } else if (typeof value === 'object' && value !== null) {
                // Recursively traverse nested objects
                traverse(value, currentPath);
              }
              // If value is not an object, no action needed
            }
          }
        };
  
        traverse(details);
      } catch (error) {
        console.error('Error parsing audit log details:', error);
      }
    });
  
    return changeHistory;
  };
  