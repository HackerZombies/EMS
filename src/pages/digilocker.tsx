import { useState } from "react";
import type { Digilocker } from "@prisma/client";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { Icon } from "@iconify/react";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";

type DigilockerFile = Digilocker & {
  formattedDate?: string;
};

type Props = {
  digilockerFiles: DigilockerFile[];
  username?: string;
};

export default function Digilocker({ digilockerFiles, username }: Props) {
  const router = useRouter();
  const [fileList, setFileList] = useState<DigilockerFile[]>(
    digilockerFiles.map(file => ({
      ...file,
      formattedDate: new Date(file.dateCreated).toLocaleDateString()
    }))
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<DigilockerFile | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!username) {
      router.push('/login');
      return;
    }
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      // File size validation (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setUploadError("File size exceeds 5MB limit");
        return;
      }
      // File type validation
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setUploadError("Invalid file type. Only PDF, PNG, and JPG are allowed.");
        return;
      }
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("username", username);
      setLoading(true);
      setUploadError(null);
      try {
        const response = await fetch("/api/digilocker/upload", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Upload failed");
        }
        const newFile = await response.json();
        setFileList((prevFiles) => [
          {...newFile, formattedDate: new Date(newFile.dateCreated).toLocaleDateString()},
          ...prevFiles
        ]);
      } catch (error) {
        console.error("Error uploading file:", error);
        setUploadError(
          error instanceof Error
            ? error.message
            : "Failed to upload file. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownload = async (file: DigilockerFile) => {
    try {
      const response = await fetch(`/api/digilocker/retrieve?id=${file.id}`);
      if (!response.ok) {
        throw new Error("Failed to download file");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename ?? "file";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download file");
    }
  };

  const handleDelete = async (file: DigilockerFile) => {
    try {
      const response = await fetch(`/api/digilocker/delete?id=${file.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete file");
      }
      setFileList(fileList.filter((f) => f.id !== file.id));
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 px-4 py-8">
      <Head>
        <title>My Digilocker - Secure Document Storage</title>
        <meta name="description" content="Securely store and manage your personal documents" />
      </Head>
      <div className="max-w-4xl mx-auto bg-dark-800 shadow-2xl rounded-2xl overflow-hidden border border-dark-700">
        <div className="bg-gradient-to-r from-dark-600 to-dark-500 p-6">
          <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3 mb-2">
            <Icon icon="ph:file-text-light" className="w-10 h-10 text-primary-400" />
            My Digilocker
          </h1>
          <p className="text-sm text-gray-300 mb-4">
            Your private, secure digital document vault. Safely store, manage, and access important personal documents with ease.
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-300">Welcome, {username}</span>
          </div>
        </div>

        <div className="p-6">
          {/* File Upload Section */}
          <div className="mb-6">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dark-600 border-dashed rounded-lg cursor-pointer bg-dark-700 hover:bg-dark-600 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Icon icon="ph:cloud-arrow-up" className="w-10 h-10 text-primary-400 mb-2" />
                  <p className="mb-2 text-sm text-gray-400">
                    <span className="font-semibold text-primary-300">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX. 5MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.png,.jpg,.jpeg"
                />
              </label>
            </div>
            {loading && (
              <div className="mt-4 w-full bg-dark-600 rounded-full h-2.5">
                <div className="bg-primary-500 h-2.5 rounded-full animate-pulse" style={{ width: '45%' }}></div>
              </div>
            )}
            {uploadError && (
              <div className="mt-4 text-red-400 text-sm">{uploadError}</div>
            )}
          </div>

          {/* File List Section */}
          {fileList.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Icon icon="ph:file-light" className="w-20 h-20 mx-auto mb-4 text-primary-400" />
              <p className="text-xl">No files uploaded yet</p>
              <p className="text- sm">Upload your documents to get started.</p>
            </div>
          ) : (
            fileList.map((file) => (
              <motion.div
                key={file.id}
                className="flex justify-between items-center bg-dark-700 p-4 rounded-lg mb-4"
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">{file.filename}</h2>
                  <p className="text-sm text-gray-400">{file.formattedDate}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(file)}
                    className="bg-primary-500 text-gray-100 px-3 py-1.5 rounded-md hover:bg-primary-600 transition"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => setConfirmDelete(file)}
                    className="bg-red-500 text-gray-100 px-3 py-1.5 rounded-md hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
  {confirmDelete && (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" // Added backdrop-blur-sm
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-dark-800 rounded-xl p-6 max-w-md w-full shadow-lg" // Changed bg-dark-700 to bg-dark-800 for better contrast
      >
        <div className="flex items-center mb-4">
          <Icon icon="ph:warning" className="w-8 h-8 text-yellow-500 mr-3" />
          <h2 className="text-xl font-bold text-gray-100">Confirm Deletion</h2>
        </div>
        <p className="text-gray-300 mb-4">
          Are you sure you want to delete {confirmDelete.filename ?? "this file"}? 
          This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setConfirmDelete(null)}
            className="bg-dark-600 text-gray-300 px-4 py-2 rounded-md hover:bg-dark-500 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => handleDelete(confirmDelete)}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (session) {
    const digilockerFiles = await prisma.digilocker.findMany({
      where: {
        userUsername: session.user.username,
      },
      select: {
        id: true,
        filename: true,
        userUsername: true,
        dateCreated: true,
        size: true,
        mimetype: true
      },
    });
    return { props: { digilockerFiles, username: session.user.username } };
  } else {
    return { props: { digilockerFiles: [], username: null } };
  }
};