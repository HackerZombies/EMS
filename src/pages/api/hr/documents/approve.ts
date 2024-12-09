// pages/api/hr/documents/approve.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { id } = req.query;

    try {
      await prisma.hrDocument.update({
        where: { id: String(id) },
        data: { status: 'Approved' },
      });
      return res.status(200).json({ message: 'Document approved successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to approve document' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}