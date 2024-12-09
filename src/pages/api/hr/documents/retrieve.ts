import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import path from "path";

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.doc':
      return 'application/msword';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.xls':
      return 'application/vnd.ms-excel';
    case '.xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return 'application/octet-stream';
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { id } = req.query;

    if (id) {
      try {
        const hrDocument = await prisma.hrDocument.findUnique({
          where: { id: String(id) },
        });

        if (!hrDocument) {
          return res.status(404).json({ error: "Document not found" });
        }

        const mimeType = getMimeType(hrDocument.filename);
        res.setHeader("Content-Type", mimeType);
        res.setHeader("Content-Disposition", `attachment; filename="${hrDocument.filename}"`);

        // Ensure hrDocument.data is a Buffer
        if (!hrDocument.data) {
          return res.status(500).json({ error: "No file data available" });
        }

        const fileBuffer = Buffer.isBuffer(hrDocument.data) ? hrDocument.data : Buffer.from(hrDocument.data);

        return res.send(fileBuffer);
      } catch (error) {
        console.error("Error downloading document:", error);
        return res.status(500).json({ error: "Failed to download document" });
      }
    }

    return res.status(400).json({ error: "ID must be provided" });
  } else {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
}