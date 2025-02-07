// pages/api/mobile/logout.ts
import { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'nextjs-cors'
import { prisma } from '@/lib/prisma'

export default async function logoutHandler(req: NextApiRequest, res: NextApiResponse) {
  await Cors(req, res, {
    methods: ['POST', 'OPTIONS'],
    origin: '*',
    optionsSuccessStatus: 200,
  })

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { refreshToken } = req.body
  if (!refreshToken) {
    return res.status(400).json({ message: 'No refreshToken provided' })
  }

  try {
    // Option A: revoke the token
    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { revoked: true },
    })

    // Option B: or you could delete it
    // await prisma.refreshToken.delete({ where: { token: refreshToken } })

    return res.status(200).json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    return res.status(500).json({ message: 'Internal server error.' })
  }
}
