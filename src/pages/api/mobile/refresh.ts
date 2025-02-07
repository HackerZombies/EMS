// pages/api/mobile/refresh.ts
import { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'nextjs-cors'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export default async function refreshHandler(req: NextApiRequest, res: NextApiResponse) {
  // 1) Run CORS
  await Cors(req, res, {
    methods: ['POST', 'OPTIONS'],
    origin: '*',
    optionsSuccessStatus: 200,
  })

  // 2) OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 3) Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // 4) Parse refreshToken from body
  const { refreshToken } = req.body
  if (!refreshToken) {
    return res.status(400).json({ message: 'No refreshToken provided' })
  }

  try {
    // 5) Verify JWT signature
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as {
      id: string
      username: string
    }

    // 6) Look up the token in DB
    const existingToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    })

    if (!existingToken) {
      return res.status(401).json({ message: 'Refresh token not found.' })
    }
    if (existingToken.revoked) {
      return res.status(401).json({ message: 'Refresh token was revoked.' })
    }
    if (existingToken.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Refresh token has expired.' })
    }

    // 7) Issue a new Access Token
    const newAccessToken = jwt.sign(
      {
        id: decoded.id,
        username: decoded.username,
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    )

    // 8) Rotate the refresh token
    //    - Revoke the old token
    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { revoked: true },
    })

    //    - Create a new refresh token
    const newRefreshToken = jwt.sign(
      {
        id: decoded.id,
        username: decoded.username,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: decoded.id,
        expiresAt: newExpiresAt,
      },
    })

    // 9) Return new tokens
    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    })
  } catch (err) {
    console.error('Refresh token error:', err)
    return res.status(401).json({ message: 'Invalid or expired refresh token' })
  }
}
