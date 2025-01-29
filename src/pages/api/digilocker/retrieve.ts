import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
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
    if (!id) {
      return res.status(400).json({ error: "ID must be provided" });
    }

    try {
      const file = await prisma.digilocker.findUnique({
        where: { id: String(id) },
      });

      if (!file || !file.filename || !file.data) {
        return res.status(404).json({ error: "File not found" });
      }

      const mimeType = getMimeType(file.filename);
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);

      let fileBuffer: Buffer;
      if (file.data instanceof Buffer) {
        fileBuffer = file.data;
      } else if (file.data instanceof Uint8Array) {
        fileBuffer = Buffer.from(file.data);
      } else if (typeof file.data === 'string') {
        fileBuffer = Buffer.from(file.data, 'base64');
      } else {
        return res.status(500).json({ error: "Unsupported file data type" });
      }

      return res.send(fileBuffer);
    } catch (error) {
      console.error("Error downloading file:", error);
      return res.status(500).json({ error: "Failed to download file" });
    }
  } else {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
}