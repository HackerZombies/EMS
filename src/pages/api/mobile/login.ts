// src/pages/api/mobile/login.ts

import { NextApiRequest, NextApiResponse } from 'next';
import Cors from 'nextjs-cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1) Run the CORS middleware
  await Cors(req, res, {
    methods: ['POST', 'OPTIONS'],
    origin: '*', // or restrict origins as needed
    optionsSuccessStatus: 200,
  });

  // 2) Handle preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3) Only POST from here on
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 4) Extract credentials
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Missing username or password.' });
  }

  try {
    // 5) Find user in the DB
    const user = await prisma.user.findUnique({
      where: { username },
    });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 6) Compare password with bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 7) Generate an ACCESS TOKEN (short-lived)
    const accessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
        position: user.position,
        isFirstTime: user.isFirstTime ?? false,
      },
      JWT_SECRET,
      { expiresIn: '15m' } // e.g. 15 minutes
    );

    // 8) Generate a REFRESH TOKEN (longer-lived)
    const refreshToken = jwt.sign(
      {
        // Often fewer claims go in the refresh token
        id: user.id,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: '30d' } // e.g. 30 days
    );

    // 9) Return both tokens + user data
    return res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
        position: user.position,
        isFirstTime: user.isFirstTime ?? false,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
