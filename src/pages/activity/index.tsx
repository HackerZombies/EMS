// src/pages/activity/index.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  ChevronDown,
  ChevronUp,
  User,
  Edit,
  Trash,
  Undo,
  ArrowRight,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";

interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  datePerformed: string;
  details: string;
  targetUsername?: string;
  user?: {
    username: string;
    firstName: string;
    lastName: string;
  };
}

interface AuditLogDetails {
  [fieldName: string]: {
    old: unknown;
    new: unknown;
  };
}

interface ActivityPageProps {
  logs: AuditLog[];
}

const ITEMS_PER_PAGE = 5;

// Action icons by action type
const ActionIcons: Record<string, React.ReactNode> = {
  UPDATE_USER: <Edit className="h-5 w-5 text-blue-400" />,
  DELETE_USER: <Trash className="h-5 w-5 text-red-400" />,
  CREATE_USER: <User className="h-5 w-5 text-green-400" />,
  REVERT_CHANGES: <Undo className="h-5 w-5 text-yellow-400" />,
};

function humanizeFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export const getServerSideProps: GetServerSideProps<ActivityPageProps> = async (
  context: GetServerSidePropsContext
) => {
  const req = context.req as NextApiRequest;
  const res = context.res as NextApiResponse;

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || session.user.role !== "ADMIN") {
    return {
      redirect: {
        destination: "/unauthorized",
        permanent: false,
      },
    };
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { datePerformed: "desc" },
    include: {
      user: {
        select: { username: true, firstName: true, lastName: true },
      },
    },
  });

  return {
    props: {
      logs: JSON.parse(JSON.stringify(logs)),
    },
  };
};

/** A memoized component to render individual field changes. */
const FieldRenderer: React.FC<{
  log: AuditLog;
  fieldName: string;
  oldVal: unknown;
  newVal: unknown;
  isReverting: boolean;
  onRevert: (fieldName: string) => void;
}> = React.memo(({ log, fieldName, oldVal, newVal, isReverting, onRevert }) => {
  const isRevertLog = log.action === "REVERT_CHANGES";
  return (
    <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-sm mb-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-gray-100 capitalize">
          {humanizeFieldName(fieldName)}
        </h4>
        {log.action === "UPDATE_USER" && (
          <Button
            variant="ghost"
            size="sm"
            className="text-orange-400 hover:text-orange-500"
            onClick={() => onRevert(fieldName)}
            disabled={isReverting}
          >
            {isReverting ? "Reverting..." : "Revert Field"}
          </Button>
        )}
      </div>
      <hr className="my-2 border-gray-700" />
      <div className="mb-1">
        <span className="font-semibold text-purple-400">
          {isRevertLog ? "Restored Value" : "Original Value"}:
        </span>{" "}
        <span className="text-gray-200 font-medium">{String(oldVal ?? "None")}</span>
      </div>
      <div className="mb-1">
        <span className="font-semibold text-cyan-400">
          {isRevertLog ? "Discarded Value" : "Updated Value"}:
        </span>{" "}
        <span className="text-gray-200 font-medium">{String(newVal ?? "None")}</span>
      </div>
    </div>
  );
});

const ActivityPage: React.FC<ActivityPageProps> = ({ logs }) => {
  const router = useRouter();
  const highlightLogId = router.query.highlightLog as string | undefined;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Revert states
  const [isRevertingAll, setIsRevertingAll] = useState<Record<string, boolean>>({});
  const [isRevertingField, setIsRevertingField] = useState<Record<string, Record<string, boolean>>>({});

  // Auto-expand log if highlighted via URL query
  useEffect(() => {
    if (highlightLogId) {
      setExpandedId(highlightLogId);
    }
  }, [highlightLogId]);

  // Memoize pagination values so they’re recalculated only when logs or currentPage change.
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return logs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [logs, currentPage]);

  const totalPages = useMemo(() => Math.ceil(logs.length / ITEMS_PER_PAGE), [logs]);

  // useCallback ensures these functions have stable references.
  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleRevertAll = useCallback(async (logId: string) => {
    try {
      setIsRevertingAll((prev) => ({ ...prev, [logId]: true }));
      const response = await fetch("/api/users/revertChange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId }),
      });
      if (!response.ok) {
        const data = await response.json();
        alert(`Failed to revert: ${data.message || "Unknown error"}`);
      } else {
        alert("All changes reverted successfully!");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error reverting all changes:", error);
      alert("Error reverting all changes.");
    } finally {
      setIsRevertingAll((prev) => ({ ...prev, [logId]: false }));
    }
  }, []);

  const handleRevertField = useCallback(async (logId: string, fieldName: string) => {
    try {
      setIsRevertingField((prev) => ({
        ...prev,
        [logId]: {
          ...prev[logId],
          [fieldName]: true,
        },
      }));
      const response = await fetch("/api/users/revertChange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId, fields: [fieldName] }),
      });
      if (!response.ok) {
        const data = await response.json();
        alert(`Failed to revert ${fieldName}: ${data.message || "Unknown error"}`);
      } else {
        alert(`Field "${fieldName}" reverted successfully!`);
        window.location.reload();
      }
    } catch (error) {
      console.error(`Error reverting field ${fieldName}:`, error);
      alert(`Error reverting field ${fieldName}.`);
    } finally {
      setIsRevertingField((prev) => ({
        ...prev,
        [logId]: {
          ...prev[logId],
          [fieldName]: false,
        },
      }));
    }
  }, []);

  // Render details section with memoized parsed details.
  const renderDetails = useCallback(
    (log: AuditLog) => {
      let parsed: AuditLogDetails;
      try {
        parsed = JSON.parse(log.details);
      } catch (err) {
        console.error("Failed to parse details:", err, log.details);
        return <p className="text-red-500">Invalid details format.</p>;
      }
      const fieldEntries = Object.entries(parsed);
      if (fieldEntries.length === 0) {
        return <p className="text-gray-300 italic">No fields changed.</p>;
      }
      const canRevertAll = log.action === "UPDATE_USER";
      return (
        <div className="mt-4 space-y-2">
          {canRevertAll && (
            <div className="flex justify-end mb-3">
              <Button
                variant="outline"
                size="sm"
                className="border-red-700 text-red-400 hover:bg-red-700 hover:text-white font-semibold"
                onClick={() => handleRevertAll(log.id)}
                disabled={isRevertingAll[log.id]}
              >
                {isRevertingAll[log.id] ? "Reverting All..." : "Revert All Changes"}
              </Button>
            </div>
          )}
          {fieldEntries.map(([fieldName, { old, new: newVal }]) => {
            // Wrap each element in a fragment with a key to improve predictability.
            if (Array.isArray(old) || Array.isArray(newVal)) {
              return (
                <React.Fragment key={`${log.id}-${fieldName}`}>
                  {renderComplexField(log, fieldName, old as unknown[], newVal as unknown[])}
                </React.Fragment>
              );
            }
            if (
              typeof old === "object" &&
              old !== null &&
              typeof newVal === "object" &&
              newVal !== null
            ) {
              return (
                <React.Fragment key={`${log.id}-${fieldName}`}>
                  {renderObjectField(log, fieldName, old, newVal)}
                </React.Fragment>
              );
            }
            return (
              <React.Fragment key={`${log.id}-${fieldName}`}>
                <FieldRenderer
                  log={log}
                  fieldName={fieldName}
                  oldVal={old}
                  newVal={newVal}
                  isReverting={!!isRevertingField[log.id]?.[fieldName]}
                  onRevert={(fName) => handleRevertField(log.id, fName)}
                />
              </React.Fragment>
            );
          })}
        </div>
      );
    },
    [handleRevertAll, handleRevertField, isRevertingAll, isRevertingField]
  );

  // Reuse existing render functions for objects and complex fields.
  function renderObjectField(log: AuditLog, fieldName: string, oldObj: any, newObj: any) {
    const isFieldReverting = !!isRevertingField[log.id]?.[fieldName];
    const isRevertLog = log.action === "REVERT_CHANGES";
    return (
      <div className="mb-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-gray-100 capitalize mb-1">
            {humanizeFieldName(fieldName)}
          </h4>
          {log.action === "UPDATE_USER" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-orange-400 hover:text-orange-500"
              onClick={() => handleRevertField(log.id, fieldName)}
              disabled={isFieldReverting}
            >
              {isFieldReverting ? "Reverting..." : "Revert Field"}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
          <div>
            <h5 className="text-purple-400 font-semibold mb-2">
              {isRevertLog ? "Restored Object" : "Original Object"}
            </h5>
            {Object.keys(oldObj || {}).length === 0 ? (
              <p className="text-gray-300">No data</p>
            ) : (
              <Card className="bg-gray-800 bg-opacity-60 backdrop-blur p-3 rounded-md border border-white/10">
                {Object.entries(oldObj).map(([k, v]) => (
                  <p key={k} className="text-sm text-gray-200 font-medium mb-1">
                    <strong className="capitalize text-gray-100">{k}:</strong> {String(v ?? "None")}
                  </p>
                ))}
              </Card>
            )}
          </div>
          <div>
            <h5 className="text-cyan-400 font-semibold mb-2">
              {isRevertLog ? "Discarded Object" : "Updated Object"}
            </h5>
            {Object.keys(newObj || {}).length === 0 ? (
              <p className="text-gray-300">No data</p>
            ) : (
              <Card className="bg-gray-800 bg-opacity-60 backdrop-blur p-3 rounded-md border border-white/10">
                {Object.entries(newObj).map(([k, v]) => (
                  <p key={k} className="text-sm text-gray-200 font-medium mb-1">
                    <strong className="capitalize text-gray-100">{k}:</strong> {String(v ?? "None")}
                  </p>
                ))}
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderComplexField(
    log: AuditLog,
    fieldName: string,
    oldValue?: unknown[],
    newValue?: unknown[]
  ) {
    const oldArray = oldValue || [];
    const newArray = newValue || [];
    const isFieldReverting = !!isRevertingField[log.id]?.[fieldName];
    const isRevertLog = log.action === "REVERT_CHANGES";
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-gray-100 capitalize mb-1">
            {humanizeFieldName(fieldName)}
          </h4>
          {log.action === "UPDATE_USER" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-orange-400 hover:text-orange-500"
              onClick={() => handleRevertField(log.id, fieldName)}
              disabled={isFieldReverting}
            >
              {isFieldReverting ? "Reverting..." : "Revert Field"}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/10 backdrop-blur-md p-4 rounded-xl">
          <div>
            <h5 className="text-purple-400 font-semibold mb-2">
              {isRevertLog ? "Restored Collection" : "Original Collection"}
            </h5>
            {oldArray.length === 0 ? (
              <p className="text-gray-300">No data</p>
            ) : (
              oldArray.map((item: any, index: number) => (
                <Card
                  key={index}
                  className="bg-gray-800 bg-opacity-60 backdrop-blur p-3 mb-2 rounded-md shadow-sm border border-white/10"
                >
                  {Object.entries(item).map(([key, value]) => (
                    <p key={key} className="text-sm text-gray-200 font-medium">
                      <strong className="capitalize text-gray-100">{key}:</strong> {String(value)}
                    </p>
                  ))}
                </Card>
              ))
            )}
          </div>
          <div>
            <h5 className="text-cyan-400 font-semibold mb-2">
              {isRevertLog ? "Discarded Collection" : "Updated Collection"}
            </h5>
            {newArray.length === 0 ? (
              <p className="text-gray-300">No data</p>
            ) : (
              newArray.map((item: any, index: number) => (
                <Card
                  key={index}
                  className="bg-gray-800 bg-opacity-60 backdrop-blur p-3 mb-2 rounded-md shadow-sm border border-white/10"
                >
                  {Object.entries(item).map(([key, value]) => (
                    <p key={key} className="text-sm text-gray-200 font-medium">
                      <strong className="capitalize text-gray-100">{key}:</strong> {String(value)}
                    </p>
                  ))}
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4">
      <div className="max-w-5xl mx-auto backdrop-blur-md bg-white/10 p-6 rounded-xl border border-white/10 shadow-lg">
        <Card className="shadow-lg mb-8 bg-transparent">
          <CardHeader>
            <CardTitle className="text-3xl font-extrabold text-gray-100">
              Activity Logs
            </CardTitle>
            <CardDescription className="text-gray-300 font-medium">
              A chronological list of all system changes
            </CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
        {logs.length === 0 ? (
          <p className="text-center text-gray-300">No activity logs available.</p>
        ) : (
          <div className="relative ml-4 border-l border-gray-700">
            {paginatedLogs.map((log) => {
              const expanded = expandedId === log.id;
              const isHighlighted = highlightLogId === log.id;
              return (
                <div
                  key={log.id}
                  className={`relative pl-8 mb-8 ${
                    isHighlighted
                      ? "bg-green-800 bg-opacity-20 rounded-xl p-4 -ml-6 pr-2"
                      : ""
                  }`}
                >
                  <span
                    className="absolute left-[-11px] top-2 inline-block w-5 h-5 bg-blue-500 rounded-full border-4 border-gray-900 shadow"
                    style={{ marginLeft: "-10px" }}
                  />
                  <div className="flex items-start justify-between">
                    <div className="mb-2">
                      <p className="text-xs text-gray-400 font-medium">
                        {format(new Date(log.datePerformed), "PPP p")}
                      </p>
                      <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                        {ActionIcons[log.action] || (
                          <User className="h-5 w-5 text-gray-400" />
                        )}
                        {log.action}
                      </h3>
                      <p className="text-sm text-gray-300 mb-2 font-medium">
                        Performed by:{" "}
                        <span className="text-gray-100 font-semibold">
                          {log.performedBy}
                        </span>{" "}
                      </p>
                      {log.user?.username && (
                        <Link
                          href={`/manage/users/user/${log.user.username}`}
                          className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200 underline text-sm font-semibold"
                          title="Go to user update page"
                        >
                          <ArrowRight className="w-4 h-4" />
                          Visit {log.user.username}'s page
                        </Link>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-300 hover:text-white mt-2"
                      onClick={() => toggleExpand(log.id)}
                    >
                      {expanded ? <ChevronUp /> : <ChevronDown />}
                    </Button>
                  </div>
                  {expanded && (
                    <div className="mt-3 ml-2 border-l-2 border-dashed border-gray-700 pl-6 pb-2">
                      {renderDetails(log)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="flex justify-between items-center mt-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-300 hover:text-white font-semibold"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            Previous
          </Button>
          <p className="text-gray-300 text-sm font-medium">
            Page {currentPage} of {totalPages}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-300 hover:text-white font-semibold"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
