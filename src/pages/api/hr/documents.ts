import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import busboy from "busboy";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { submittedBy } = req.query;

    try {
      const documents = await prisma.hrDocument.findMany({
        where: {
          submittedBy: String(submittedBy),
        },
        orderBy: {
          dateSubmitted: 'desc',
        },
      });

      return res.status(200).json(documents);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch documents' });
    }
  } else if (req.method === 'POST') {
    let submittedBy: string | undefined;
    let docData: Buffer[] = [];
    let filename: string | undefined;
    let fileSize = 0;
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    const bb = busboy({ 
      headers: req.headers,
      limits: {
        fileSize: MAX_FILE_SIZE
      }
    });

    bb.on("field", (name, val) => {
      if (name === "submittedBy") {
        submittedBy = val;
      }
    });

    bb.on("file", (name, file, info) => {
      const allowedFileTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xls', '.xlsx', '.txt', '.csv'];
      const fileExt = info.filename.split('.').pop()?.toLowerCase();

      if (!fileExt || !allowedFileTypes.includes(`.${fileExt}`)) {
        file.resume(); // Discard the file
        return res.status(400).json({ error: "Invalid file type" });
      }

      file.on("data", (data: Buffer) => {
        fileSize += data.length;
        
        if (fileSize > MAX_FILE_SIZE) {
          file.destroy(); // Stop file upload
          return res.status(413).json({ error: "File too large. Maximum 50MB allowed." });
        }

        docData.push(data);
        filename = info.filename;
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