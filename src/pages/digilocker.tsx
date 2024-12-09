import { useState } from "react";
import type { Digilocker } from "@prisma/client";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { Icon } from "@iconify/react";
import Head from "next/head";
import { motion } from "framer-motion";
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
      link.download = file.filename;
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
    if (window.confirm(`Are you sure you want to delete ${file.filename}?`)) {
      try {
        const response = await fetch(`/api/digilocker/delete?id=${file.id}`, {
          method: "DELETE",
        });
        
        if (!response.ok) {
          throw new Error("Failed to delete file");
        }
        
        setFileList(fileList.filter((f) => f.id !== file.id));
      } catch (error) {
        console.error("Error deleting file:", error);
        alert("Failed to delete file. Please try again.");
      }
    }
 };

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 px-4 py-8">
      <Head>
        <title>My Digilocker</title>
        <meta name="description" content="Personal document storage and management" />
      </Head>
      <div className="max-w-4xl mx-auto bg-dark-800 shadow-2xl rounded-2xl overflow-hidden border border-dark-700">
        <div className="bg-gradient-to-r from-dark-600 to-dark-500 p-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
            <Icon icon="ph:file-text-light" className="w-10 h-10 text-primary-400" />
            My Digilocker
          </h1>
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
              <p className=" text-xl">No files uploaded yet</p>
              <p className="text-sm">Start by uploading a file</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fileList.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-between bg-dark-700 p-4 rounded-lg hover:bg-dark-600 transition"
                >
                  <div className="flex items-center gap-4">
                    <Icon
                      icon={
                        file.filename.toLowerCase().endsWith('.pdf')
                          ? "ph:file-pdf"
                          : "ph:file-image"
                      }
                      className="w-10 h-10 text-red-400"
                    />
                    <div>
                      <p className="font-semibold">{file.filename}</p>
                      <p className="text-sm text-gray-400">
                        {file.formattedDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(file)}
                      className="bg-primary-500 text-gray-100 px-3 py-1.5 rounded-md hover:bg-primary-600 transition"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(file)}
                      className="bg-red-500 text-gray-100 px-3 py-1.5 rounded-md hover:bg-red-600 transition"
                    >
                      Delete
                    </ button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
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