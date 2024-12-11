import { useState } from "react";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from '../api/auth/[...nextauth]'; // Correct the path if needed
import prisma from "@/lib/prisma";
import Head from "next/head";

type HrDocument = {
  id: string;
  filename: string;
  submittedBy: string;
  submitterFullName: string;
  department: string;
  position: string;
  dateSubmitted: Date | string;
  status: "Pending" | "Rejected" | "Approved"; // Add status field with specific values
  rejectionReason?: string; // Optional field for rejection reason
};

type Props = {
  hrDocuments: HrDocument[];
};

export default function HrDocuments({ hrDocuments }: Props) {
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [fileData, setFileData] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const handleDownload = async (id: string, filename: string) => {
    try {
      const response = await fetch(`/api/hr/documents/retrieve?id=${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch document");
      }
      const blob = await response.blob();
      setFileData(blob);
      setFileName(filename);
    } catch (error) {
      console.error("Error downloading document:", error);
    }
  };

  const handleClose = () => {
    setFileData(null);
    setFileName(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        const response = await fetch(`/api/hr/documents/delete?id=${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete document");
        }
        window.location.reload(); // Refresh the page to see the changes
      } catch (error) {
        console.error("Error deleting document:", error);
      }
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/hr/documents/approve?id=${id}`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to approve document");
      }
      window.location.reload(); // Refresh the page to see the changes
    } catch (error) {
      console.error("Error approving document:", error);
    }
  };

  const handleReject = async () => {
    if (!selectedDocId) return;
    try {
      const response = await fetch(`/api/hr/documents/reject?id=${selectedDocId}`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectionReason }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to reject document");
      }
      setRejectionReason("");
      setSelectedDocId(null);
      window.location.reload(); // Refresh the page to see the changes
    } catch (error) {
      console.error("Error rejecting document:", error);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedDocId(expandedDocId === id ? null : id);
  };

  // Sort documents: pending first, then approved/rejected, and by date
  const sortedDocuments = hrDocuments.sort((a, b) => {
    const statusOrder = { Pending: 1, Rejected: 2, Approved: 3 };
    const statusComparison = statusOrder[a.status] - statusOrder[b.status];
    if (statusComparison !== 0) return statusComparison;
    return new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime();
  });

  // Group documents by department and user
  const groupedDocuments = sortedDocuments.reduce((acc, doc) => {
    const key = `${doc.department} - ${doc.submitterFullName}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(doc);
    return acc;
  }, {} as Record<string, HrDocument[]>);

  return (
    <div className=
    "min-h-screen bg-black bg-opacity-50 opacity-80 text-white p-8 rounded-2xl shadow-lg">
      <Head>
        <title>HR Documents</title>
      </Head>
      <h1 className="text-3xl font-bold mb-6">Verify Documents</h1>
      {Object.keys(groupedDocuments).length === 0 ? (
        <p className="text-gray-500">No documents submitted yet.</p>
      ) : (
        <div>
          {Object.entries(groupedDocuments).map(([group, docs]) => (
            <div key={group} className="mb-4">
              <h2 className="text-xl font-semibold text-gray-300">{group}</h2>
              {docs.map((doc) => (
                <div key={doc.id} className="bg-gray-800 rounded-2xl shadow-lg p-4 mb-2 transition-transform transform hover:scale-105">
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleExpand(doc.id)}>
                    <h3 className="text-lg font-semibold">{doc.filename}</h3>
                    <span className={`text-${doc.status === 'Approved' ? 'green' : doc.status === 'Rejected' ? 'red' : 'yellow'}-400`}>{doc.status}</span>
                  </div>
                  {expandedDocId === doc.id && (
                    <div className="mt-2">
                      <p className="text-gray-400">Submitted By: {doc.submitterFullName} ({doc.submittedBy})</p>
                      <p className="text-gray-400">Department: {doc.department}</p>
                      <p className="text-gray-400">Position: {doc.position}</p>
                      <p className="text-gray-400">
                        Submission Date: {typeof doc.dateSubmitted === 'string'
                          ? new Date(doc.dateSubmitted).toLocaleDateString()
                          : doc.dateSubmitted.toLocaleDateString()}
                      </p>
                      {doc.rejectionReason && (
                        <p className="text-red-400">Rejection Reason: {doc.rejectionReason}</p>
                      )}
                      <div className="mt-4 flex flex-wrap space-x-2">
                        <button
                          onClick={() => handleDownload(doc.id, doc.filename)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded transition duration-200"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleApprove(doc.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-2 rounded transition duration-200"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => { setSelectedDocId(doc.id); }}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-2 rounded transition duration-200"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-2 rounded transition duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {fileData && fileName && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold text-white">Document Download</h2>
            <p className="text-gray-300">Your document is ready to download: {fileName}</p>
            <a
              href={URL.createObjectURL(fileData)}
              download={fileName}
              className="text-blue-400 hover:underline"
            >
              Click here to download
            </a>
            <button
              onClick={handleClose}
              className="mt-4 bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700 transition duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {selectedDocId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-black bg-opacity-50 p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold text-white py-2">Reject Document</h2>
            <textarea
              value={ rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection"
              className="w-full p-2 border border-gray-600 rounded bg-black bg-opacity-20 text-white"
            />
            <button
              onClick={handleReject}
              className="mt-4 bg-red-600 text-white font-bold py-2 px-2 rounded-lg hover:bg-red-700 transition duration-200"
            >
              Submit Rejection
            </button>
            <button
              onClick={() => setSelectedDocId(null)}
              className="px-5 text-gray-400 hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  const page = parseInt((context.query.page as string) || '1', 10);
  const pageSize = 10; // Number of documents per page
  const skip = (page - 1) * pageSize;

  if (session && session.user.role === 'HR') {
    const [hrDocuments, totalDocuments] = await Promise.all([
      prisma.hrDocument.findMany({
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              department: true,
              position: true,
              username: true,
            },
          },
        },
        orderBy: {
          dateSubmitted: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.hrDocument.count(), // Get total count for pagination
    ]);

    const validStatuses = ["Approved", "Rejected", "Pending"] as const;

    const documents: HrDocument[] = hrDocuments.map(doc => ({
      id: doc.id,
      filename: doc.filename,
      submittedBy: doc.user.username,
      submitterFullName: `${doc.user.firstName} ${doc.user.lastName}`,
      department: doc.user.department || "N/A",
      position: doc.user.position || "N/A",
      dateSubmitted: doc.dateSubmitted.toISOString(),
      status: (validStatuses.includes(doc.status as typeof validStatuses[number]) ? doc.status : "Pending") as HrDocument['status'],
      rejectionReason: doc.rejectionReason || undefined,
    }));

    return { props: { hrDocuments: documents, totalDocuments } };
  } else {
    return {
      redirect: {
        destination: '/unauthorized',
        permanent: false,
      },
    };
  }
};