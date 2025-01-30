// src/hooks/useAuditLogs.ts

import { useCallback, useState } from "react";

/** Adjust this interface to match your actual audit log fields */
export interface AuditLogEntry {
  id: string;
  action: string;
  performedBy: string;
  userUsername: string;
  targetUsername: string;
  datePerformed: string;
  details: string;
  user: {
    username: string;
    firstName: string;
    lastName: string;
  };
}

interface UseAuditLogsReturn {
  /** Stored audit logs in local state */
  auditLogs: AuditLogEntry[];

  /** Whether logs are currently being fetched from the server */
  isLoading: boolean;

  /** Any error messages from the fetch operation */
  error: string | null;

  /** Function to fetch audit logs for a given username */
  fetchAuditLogs: (username: string) => Promise<void>;
}

/**
 * Custom hook to handle fetching audit logs for a particular user.
 * By default, it requests the first 100 logs from:
 *
 *    GET /api/users/user/{username}/auditLogs?page=1&limit=100
 *
 * Usage:
 *
 *   const { auditLogs, isLoading, error, fetchAuditLogs } = useAuditLogs();
 *
 *   useEffect(() => {
 *     fetchAuditLogs("johnDoe");
 *   }, []);
 */
export function useAuditLogs(): UseAuditLogsReturn {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchAuditLogs = useCallback(async (username: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/users/user/${username}/auditLogs?page=1&limit=100`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data = await response.json();
      // Adjust depending on how your API returns data.
      // If your API response is like { data: AuditLogEntry[] }, then do:
      // setAuditLogs(data.data)
      setAuditLogs(data.data || []);
    } catch (err: any) {
      setError(err.message || "Error fetching audit logs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    auditLogs,
    isLoading,
    error,
    fetchAuditLogs,
  };
}
