import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import busboy from "busboy";
import path from 'path';

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { id } = req.query;
    let submittedBy: string | undefined;
    let docData: Buffer[] = [];
    let filename: string | undefined;
    let fileSize = 0;
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB file size limit

    const bb = busboy({
      headers: req.headers,
      limits: {
        fileSize: MAX_FILE_SIZE,
      },
    });

    bb.on("field", (name, val) => {
      if (name === "submittedBy") {
        submittedBy = val;
      }
    });

    bb.on("file", (name, file, info) => {
      filename = info.filename;
      const allowedFileTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xls', '.xlsx', '.txt', '.csv'];
      const fileExt = path.extname(info.filename).toLowerCase();

      if (!allowedFileTypes.includes(fileExt)) {
        file.resume();
        return res.status(400).json({ error: "Invalid file type" });
      }

      file.on("data", (data: Buffer) => {
        fileSize += data.length;
        if (fileSize > MAX_FILE_SIZE) {
          file.destroy();
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
        const updatedDocument = await prisma.hrDocument.update({
          where: { id: String(id) },
          data: {
            filename: filename,
            data: concatenatedBuffer,
            fileSize: fileSize,
            status: 'Pending', // Or whatever status is appropriate for resubmission
            rejectionReason: null, // Clear the rejection reason
            dateSubmitted: new Date(),
          },
          select: {
            id: true,
            filename: true,
            submittedBy: true,
            dateSubmitted: true,
            fileSize: true,
            status: true,
          },
        });
        res.status(200).json(updatedDocument);
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