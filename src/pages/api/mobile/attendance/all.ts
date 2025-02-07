// pages/api/mobile/attendance/all.ts
import { NextApiRequest, NextApiResponse } from "next"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

export default async function userAttendanceHistoryHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const token = req.headers.authorization?.split(" ")[1]
  if (!token) {
    return res.status(401).json({ message: "No token provided" })
  }

  const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret"
  let decoded: any
  try {
    decoded = jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" })
  }

  const username = decoded.username
  if (!username) {
    return res.status(400).json({ message: "Missing username in token" })
  }

  // Parse pagination params
  const page = parseInt((req.query.page as string) || "1", 10)
  const limit = parseInt((req.query.limit as string) || "10", 10)

  // If you want to guard against invalid params:
  if (page < 1 || limit < 1) {
    return res.status(400).json({ message: "Invalid pagination parameters" })
  }

  // Calculate skip/take for pagination
  const skip = (page - 1) * limit
  const take = limit

  try {
    const attendances = await prisma.attendance.findMany({
      where: {
        userUsername: username,
      },
      orderBy: {
        date: "desc",
      },
      skip,
      take,
    })

    // Optionally, if you want to return total records for client pagination:
    // const totalRecords = await prisma.attendance.count({
    //   where: { userUsername: username },
    // })

    // Return the list of attendances in JSON
    return res.status(200).json({
      attendances,
      // totalRecords,  // optional if needed in your hook
    })
  } catch (err) {
    console.error("Error fetching attendance records:", err)
    return res.status(500).json({ message: "Server error" })
  }
}
