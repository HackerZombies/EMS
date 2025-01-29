// pages/api/digilocker/upload.ts
import { NextApiRequest, NextApiResponse } from "next";
import busboy from "busboy";
import { prisma } from "@/lib/prisma";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    let username: string | undefined;
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
      if (name === "username") {
        username = val;
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

    bb.on("filesLimit", () => {
      return res.status(400).json({ error: "Too many files" });
    });

    bb.on("close", async () => {
      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }

      if (docData.length === 0 || !filename) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const concatenatedBuffer = Buffer.concat(docData);

      try {
        const digilocker = await prisma.digilocker.create({
          data: {
            filename: filename,
            data: concatenatedBuffer,
            userUsername: username,
            size: fileSize, // Include the file size
          },
          select: {
            id: true,
            filename: true,
            userUsername: true,
            dateCreated: true,
            size: true, // Optional: include size in the response if needed
          },
        });

        res.status(200).json(digilocker);
      } catch (dbError) {
        console.error("Database error:", dbError);
        res.status(500).json({ error: "Database error occurred" });
      }
    });

    req.pipe(bb);
  } catch (error) {
    console.error("Error in upload handler:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}