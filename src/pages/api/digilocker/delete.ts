// pages/api/digilocker/delete.ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "ID must be provided" });
  }

  try {
    const deletedFile = await prisma.digilocker.delete({
      where: { id: String(id) },
    });

    return res.status(200).json({ message: "File deleted successfully", deletedFile });
  } catch (error) {
    console.error("Error deleting file:", error);
    return res.status(500).json({ error: "Failed to delete file" });
  }
}