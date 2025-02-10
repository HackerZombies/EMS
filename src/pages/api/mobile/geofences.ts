// pages/api/mobile/geofences.ts

import { NextApiRequest, NextApiResponse } from 'next';
import Cors from 'nextjs-cors';
import { prisma } from '@/lib/prisma'; // Adjust the import path if needed

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1) Enable CORS
  await Cors(req, res, {
    methods: ['GET', 'OPTIONS'],
    origin: '*', // In production, restrict this to your allowed domains
    optionsSuccessStatus: 200,
  });

  // 2) Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3) Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 4) Fetch all geofences from the database
    const geofences = await prisma.geofence.findMany();
    return res.status(200).json(geofences);
  } catch (error) {
    console.error('Error fetching geofences:', error);
    return res.status(500).json({ message: 'Server error fetching geofences' });
  }
}
