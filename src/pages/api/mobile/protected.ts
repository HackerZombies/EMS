// src/pages/api/mobile/protected.ts
import { NextApiRequest, NextApiResponse } from "next";
import Cors from "nextjs-cors";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1) Run the CORS middleware
  await Cors(req, res, {
    methods: ["GET", "OPTIONS"],  // Allowed methods
    origin: "*",                  // Or specify ["http://localhost:8081", "https://mydomain.com"]
    optionsSuccessStatus: 200,    // Some old browsers choke on 204
  });

  // 2) Respond immediately to OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 3) Check if method is GET
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  // 4) Extract the token from the Authorization header
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({ message: "Missing Authorization header." });
  }

  const token = authorization.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Invalid Authorization header format." });
  }

  try {
    // 5) Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    // 6) (Optional) Fetch user from DB
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    // 7) Return protected data
    return res.status(200).json({
      message: "Protected route accessed",
      user,
    });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Invalid token." });
  }
}
