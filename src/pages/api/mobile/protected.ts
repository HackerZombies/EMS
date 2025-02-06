import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({ message: "Missing Authorization header." });
  }

  // Expect "Bearer <token>"
  const token = authorization.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Invalid Authorization header format." });
  }

  try {
    // 1. Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    // 2. Optionally fetch data from DB
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    // 3. Return protected data
    return res.status(200).json({
      message: "Protected route accessed",
      user,
    });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Invalid token." });
  }
}
