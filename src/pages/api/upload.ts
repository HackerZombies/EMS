import { NextApiRequest, NextApiResponse } from "next";
import busboy from "busboy";
import prisma from "@/lib/prisma"; // Default import for Prisma Client
import { DocumentCategory } from "@prisma/client"; // Import the enum directly

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    let username: string | undefined;
    let category: DocumentCategory = "others"; // Default to lowercase
    let docData: Buffer[] = [];
    let filename: string | undefined;
    let fileSize = 0;
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    const allowedFileTypes = [
      ".pdf",
      ".doc",
      ".docx",
      ".jpg",
      ".jpeg",
      ".png",
      ".xls",
      ".xlsx",
      ".txt",
      ".csv",
    ];

    const validCategories: DocumentCategory[] = [
      "resume",
      "education",
      "identity",
      "certifications",
      "skills",
      "others",
    ];

    const bb = busboy({
      headers: req.headers,
      limits: { fileSize: MAX_FILE_SIZE },
    });

    bb.on("field", (name, val) => {
      if (name === "username") {
        username = val;
      }
      if (name === "category") {
        const normalizedCategory = val.toLowerCase() as DocumentCategory; // Normalize to lowercase
        if (validCategories.includes(normalizedCategory)) {
          category = normalizedCategory;
        } else {
          console.warn(`Invalid category provided: ${val}. Defaulting to "others".`);
          category = "others"; // Default to "others"
        }
      }
    });

    bb.on("file", (name, file, info) => {
      const fileExt = info.filename.split(".").pop()?.toLowerCase();

      if (!fileExt || !allowedFileTypes.includes(`.${fileExt}`)) {
        console.error(`Invalid file type: ${info.filename}`);
        file.resume();
        return res.status(400).json({ error: "Invalid file type" });
      }

      const chunks: Buffer[] = [];
      file.on("data", (chunk) => {
        fileSize += chunk.length;

        if (fileSize > MAX_FILE_SIZE) {
          console.error(`File too large: ${info.filename}`);
          file.destroy();
          return res.status(413).json({ error: "File too large. Maximum 50MB allowed." });
        }

        chunks.push(chunk);
      });

      file.on("end", () => {
        filename = info.filename;
        docData = chunks;
      });

      file.on("error", (err) => {
        console.error("File upload error:", err);
        res.status(500).json({ error: "File upload failed" });
      });
    });

    bb.on("close", async () => {
      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }

      if (!docData.length || !filename) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const concatenatedBuffer = Buffer.concat(docData);

      try {
        const uploadedDocument = await prisma.employeeDocument.create({
          data: {
            filename,
            data: concatenatedBuffer,
            size: fileSize,
            userUsername: username,
            category, // Correctly typed as lowercase DocumentCategory
          },
          select: {
            id: true,
            filename: true,
            size: true,
            dateUploaded: true,
            userUsername: true,
            category: true,
          },
        });

        console.log(`File uploaded successfully: ${filename}`);
        return res.status(200).json(uploadedDocument);
      } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({ error: "Database error occurred" });
      }
    });

    req.pipe(bb);
  } catch (error) {
    console.error("Unexpected error in upload handler:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
