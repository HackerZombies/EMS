import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { id } = req.query;

    // If an ID is provided, handle the download
    if (id) {
      try {
        const document = await prisma.document.findUnique({
          where: { id: String(id) },
        });

        if (!document) {
          return res.status(404).json({ error: "Document not found" });
        }

        // Set the appropriate headers for file download
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"); // Adjust the MIME type as needed
        res.setHeader("Content-Disposition", `attachment; filename="${document.filename}"`);

        // Send the binary data
        return res.send(document.data); // Assuming document.data is a Buffer
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