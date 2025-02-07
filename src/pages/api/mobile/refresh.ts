// pages/api/mobile/refresh.ts
import { NextApiRequest, NextApiResponse } from "next"
import Cors from "nextjs-cors"
import jwt from "jsonwebtoken"

/**
 * This example does NOT store or verify the refresh token in a DB.
 * It simply verifies the refresh token signature and re-issues a new access token.
 */

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret"

export default async function refreshHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1) Run CORS
  await Cors(req, res, {
    methods: ["POST", "OPTIONS"],
    origin: "*",
    optionsSuccessStatus: 200,
  })

  // 2) Handle OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  // 3) Only POST allowed
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  // 4) Parse refreshToken from body
  const { refreshToken } = req.body
  if (!refreshToken) {
    return res.status(400).json({ message: "No refreshToken provided" })
  }

  try {
    // 5) Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as {
      id: string
      username: string
      role?: string
      firstName?: string
      lastName?: string
      department?: string
      position?: string
      isFirstTime?: boolean
    }

    // If you wanted to confirm this refresh token is still valid in your DB, do so here.

    // 6) Create a new ACCESS TOKEN
    // Typically short-lived, e.g., 15m or 1h
    const newAccessToken = jwt.sign(
      {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        department: decoded.department,
        position: decoded.position,
        isFirstTime: decoded.isFirstTime,
      },
      JWT_SECRET,
      { expiresIn: "15m" } // or whatever short expiry
    )

    // 7) (Optional) Re-issue a new REFRESH token
    // or simply reuse the old one. We'll re-issue for example:
    const newRefreshToken = jwt.sign(
      {
        id: decoded.id,
        username: decoded.username,
        // maybe fewer claims in refresh token
      },
      JWT_SECRET,
      { expiresIn: "30d" } // or however long
    )

    // 8) Return new tokens
    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    })
  } catch (err) {
    console.error("Refresh token error:", err)
    return res.status(401).json({ message: "Invalid or expired refresh token" })
  }
}
