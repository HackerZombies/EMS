import React, { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import type { NextApiRequest, NextApiResponse } from 'next';
import { ChevronDown, ChevronUp, User, Edit, Trash } from 'lucide-react';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  datePerformed: string;
  details: string;
  user?: {
    username: string;
    firstName: string;
    lastName: string;
  };
}

interface AuditLogDetails {
  [field: string]: {
    old: unknown;
    new: unknown;
  };
}

interface ActivityPageProps {
  logs: AuditLog[];
}

const ITEMS_PER_PAGE = 5;

const ActionIcons: Record<string, React.ReactNode> = {
  UPDATE_USER: <Edit className="h-5 w-5 text-blue-400" />,
  DELETE_USER: <Trash className="h-5 w-5 text-red-400" />,
  CREATE_USER: <User className="h-5 w-5 text-green-400" />,
};

function humanizeFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export const getServerSideProps: GetServerSideProps<ActivityPageProps> = async (
  context: GetServerSidePropsContext
) => {
  const req = context.req as NextApiRequest;
  const res = context.res as NextApiResponse;

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || session.user.role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/unauthorized',
        permanent: false,
      },
    };
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { datePerformed: 'desc' },
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

const ActivityPage: React.FC<ActivityPageProps> = ({ logs }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const renderComplexField = (
    fieldName: string,
    oldValue?: unknown[],
    newValue?: unknown[]
  ) => {
    const oldArray = oldValue || [];
    const newArray = newValue || [];

    return (
      <div>
        <h4 className="font-semibold text-gray-300 capitalize mb-2">
          {humanizeFieldName(fieldName)}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-red-400 font-medium">Old</h5>
            {oldArray.length === 0 ? (
              <p className="text-gray-500">No data</p>
            ) : (
              oldArray.map((item: any, index: number) => (
                <Card
                  key={index}
                  className="bg-gray-800 text-gray-300 p-4 shadow-sm dark:border-gray-700"
                >
                  {Object.entries(item).map(([key, value]) => (
                    <p key={key} className="text-sm text-gray-400">
                      <strong className="capitalize">{key}: </strong>
                      {String(value)}
                    </p>
                  ))}
                </Card>
              ))
            )}
          </div>
          <div>
            <h5 className="text-green-400 font-medium">New</h5>
            {newArray.length === 0 ? (
              <p className="text-gray-500">No data</p>
            ) : (
              newArray.map((item: any, index: number) => (
                <Card
                  key={index}
                  className="bg-gray-800 text-gray-300 p-4 shadow-sm dark:border-gray-700"
                >
                  {Object.entries(item).map(([key, value]) => (
                    <p key={key} className="text-sm text-gray-400">
                      <strong className="capitalize">{key}: </strong>
                      {String(value)}
                    </p>
                  ))}
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDetails = (jsonString: string) => {
    let parsed: AuditLogDetails;

    try {
      parsed = JSON.parse(jsonString);
    } catch (err) {
      console.error('Failed to parse details:', err, jsonString);
      return <p className="text-red-500">Invalid details format.</p>;
    }

    return (
      <div className="mt-4 space-y-6">
        {Object.entries(parsed).map(([fieldName, { old, new: newValue }]) => {
          if (Array.isArray(old) || Array.isArray(newValue)) {
            return renderComplexField(fieldName, old as unknown[], newValue as unknown[]);
          }

          return (
            <div
              key={fieldName}
              className="bg-gray-800 p-4 rounded border shadow-sm text-gray-300 dark:border-gray-700"
            >
              <h4 className="font-semibold text-gray-300 capitalize mb-2">
                {humanizeFieldName(fieldName)}
              </h4>
              <div className="mb-2">
                <span className="font-medium text-red-400">Old:</span>{' '}
                <span className="text-gray-400">{String(old ?? 'None')}</span>
              </div>
              <div>
                <span className="font-medium text-green-400">New:</span>{' '}
                <span className="text-gray-400">{String(newValue ?? 'None')}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = currentPage * ITEMS_PER_PAGE;
  const paginatedLogs = logs.slice(startIndex, endIndex);
  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto px-4 py-6 dark:bg-gray-900 dark:text-white">
      <Card className="shadow-lg mb-8 bg-gray-800 text-gray-300 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-3xl font-extrabold text-gray-200">
            Activity Logs
          </CardTitle>
          <CardDescription className="text-gray-400">
            A chronological list of all system changes.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>

      {logs.length === 0 ? (
        <p className="text-center text-gray-500">No activity logs available.</p>
      ) : (
        <div className="relative ml-4 border-l border-gray-700">
          {paginatedLogs.map((log) => {
            const expanded = expandedId === log.id;
            return (
              <div key={log.id} className="relative pl-8 mb-8">
                <span
                  className="absolute left-[-11px] top-2 inline-block w-5 h-5 bg-blue-500 rounded-full border-4 border-gray-900 shadow"
                  style={{ marginLeft: '-10px' }}
                />
                <div className="flex items-start justify-between">
                  <div className="mb-2">
                    <p className="text-sm text-gray-400">
                      {format(new Date(log.datePerformed), 'PPP p')}
                    </p>
                    <h3 className="text-lg font-bold text-gray-300 flex items-center gap-2">
                      {ActionIcons[log.action] || (
                        <User className="h-5 w-5 text-gray-400" />
                      )}
                      {log.action}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">
                      Performed by:{' '}
                      <span className="text-gray-300 font-medium">
                        {log.performedBy}
                      </span>{' '}
                      {log.user?.firstName && (
                        <>
                          ({log.user.firstName} {log.user.lastName})
                        </>
                      )}
                    </p>
                    <p className="text-sm text-gray-400">
                      On user:{' '}
                      <Link
                        href={`/manage/users/user/${log.user?.username ?? ''}`}
                        className="text-blue-400 underline"
                      >
                        {log.user?.username ?? 'N/A'}
                      </Link>
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    onClick={() => toggleExpand(log.id)}
                  >
                    {expanded ? <ChevronUp /> : <ChevronDown />}
                  </Button>
                </div>

                {expanded && (
                  <div className="mt-3 ml-2 border-l-2 border-dashed border-gray-700 pl-6 pb-2">
                    {renderDetails(log.details)}
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
          className="text-gray-400 hover:text-white"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Previous
        </Button>
        <p className="text-gray-400 text-sm">
          Page {currentPage} of {totalPages}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default ActivityPage;
