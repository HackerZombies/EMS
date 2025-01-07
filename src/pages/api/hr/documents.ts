// backend/pages/api/hr/documents.ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import busboy from "busboy";
import path from 'path';
import fs from 'fs';

// Set the config for bodyParser to false to handle file uploads
export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Destructure query parameters for pagination
    const { submittedBy, page = 1, perPage = 10 } = req.query;

    try {
      // Convert page and perPage to integers
      const pageNumber = parseInt(page as string, 10);
      const perPageNumber = parseInt(perPage as string, 10);

      // Validate pagination parameters
      if (isNaN(pageNumber) || isNaN(perPageNumber)) {
        return res.status(400).json({ error: "Invalid page or perPage parameter" });
      }

      // Calculate the pagination offset (skip) and limit (take)
      const skip = (pageNumber - 1) * perPageNumber;
      const take = perPageNumber;

      // Fetch only metadata (excluding file data) for the documents
      const documents = await prisma.hrDocument.findMany({
        where: {
          submittedBy: String(submittedBy),
        },
        skip: skip,
        take: take,
        orderBy: {
          dateSubmitted: 'desc',
        },
        select: {
          id: true,
          filename: true,
          submittedBy: true,
          dateSubmitted: true,
          fileSize: true,
          status: true,
          rejectionReason: true, // Optionally include rejection reason
        },
      });

      // Get total number of documents for pagination info
      const totalDocuments = await prisma.hrDocument.count({
        where: {
          submittedBy: String(submittedBy),
        },
      });

      // Calculate the total number of pages
      const totalPages = Math.ceil(totalDocuments / perPageNumber);

      // Send the response with metadata only and pagination info
      return res.status(200).json({ documents, totalPages });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch documents' });
    }
  } else if (req.method === 'POST') {
    let submittedBy: string | undefined;
    let docData: Buffer[] = [];
    let filename: string | undefined;
    let fileSize = 0;
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB file size limit

    const bb = busboy({
      headers: req.headers,
      limits: {
        fileSize: MAX_FILE_SIZE, // Setting the file size limit
      },
    });

    bb.on("field", (name, val) => {
      if (name === "submittedBy") {
        submittedBy = val;
      }
    });

    bb.on("file", (name, file, info) => {
      filename = info.filename; // Get the filename here
      const allowedFileTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xls', '.xlsx', '.txt', '.csv'];
      const fileExt = path.extname(info.filename).toLowerCase();

      // Validate the file type
      if (!allowedFileTypes.includes(fileExt)) {
        file.resume(); // Discard the file if not allowed
        return res.status(400).json({ error: "Invalid file type" });
      }

      file.on("data", (data: Buffer) => {
        fileSize += data.length;

        if (fileSize > MAX_FILE_SIZE) {
          file.destroy(); // Stop the file upload if it exceeds the max size
          return res.status(413).json({ error: "File too large. Maximum 50MB allowed." });
        }

        docData.push(data);
      });

      file.on("error", (err) => {
        console.error("File upload error:", err);
        res.status(500).json({ error: "File upload failed" });
      });
    });

    bb.on("close", async () => {
      if (!submittedBy) {
        return res.status(400).json({ error: "Submitted By is required" });
      }

      if (docData.length === 0 || !filename) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const concatenatedBuffer = Buffer.concat(docData);

      try {
        const hrDocument = await prisma.hrDocument.create({
          data: {
            filename: filename,
            submittedBy: submittedBy,
            submitterFullName: submittedBy, // Assuming submittedBy is the full name
            department: "HR", // You can modify this as needed
            position: "HR Manager", // You can modify this as needed
            dateSubmitted: new Date(),
            fileSize: fileSize,
            data: concatenatedBuffer, // Store the file data if needed
          },
          select: {
            id: true,
            filename: true,
            submittedBy: true,
            dateSubmitted: true,
            fileSize: true,
          },
        });

        res.status(200).json(hrDocument);
      } catch (dbError) {
        console.error("Database error:", dbError);
        res.status(500).json({ error: "Database error occurred" });
      }
    });

    req.pipe(bb);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}