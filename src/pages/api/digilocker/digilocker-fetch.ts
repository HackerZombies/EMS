import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    console.log("Fetching documents request received");
    const { username } = req.query;

    if (!username || typeof username !== "string") {
      console.error("Invalid username");
      return res.status(400).json({ error: "Invalid username" });
    }

    const documents = await prisma.digilocker.findMany({
      where: { userUsername: username },
      select: {
        id: true,
        filename: true,
        dateCreated: true,
      },
    });

    if (!documents) {
      console.error("Documents not found");
      return res.status(404).json({ error: "Documents not found" });
    }

    console.log("Documents retrieved:", documents);
    res.status(200).json(documents);
  } catch (error) {
    console.error("Unexpected error occurred:", error);
    res.status(500).json({ error: "Unexpected error occurred" });
  }
}