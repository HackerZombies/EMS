// pages/api/mobile/protected.ts
import { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'nextjs-cors'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1) Run CORS
  await Cors(req, res, {
    methods: ['GET', 'OPTIONS'],
    origin: '*',
    optionsSuccessStatus: 200,
  })

  // 2) Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 3) Only GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // 4) Check authorization header
  const { authorization } = req.headers
  if (!authorization) {
    return res.status(401).json({ message: 'Missing Authorization header.' })
  }

  const token = authorization.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: 'Invalid Authorization header format.' })
  }

  try {
    // 5) Verify access token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }
    // 6) (Optional) fetch user from DB
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    // 7) Return protected data
    return res.status(200).json({
      message: 'Protected route accessed',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    })
  } catch (err) {
    console.error('Protected route error:', err)
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}
