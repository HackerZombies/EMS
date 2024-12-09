// pages/api/hr/documents/reject.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { id } = req.query;
    const { reason } = req.body;

    try {
      await prisma.hrDocument.update({
        where: { id: String(id) },
        data: { status: 'Rejected', rejectionReason: reason },
      });
      return res.status(200).json({ message: 'Document rejected successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to reject document' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}