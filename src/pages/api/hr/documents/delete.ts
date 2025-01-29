// pages/api/hr/documents/delete.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'DELETE') {
    const { id } = req.query;

    try {
      await prisma.hrDocument.delete({
        where: { id: String(id) },
      });
      return res.status(200).json({ message: 'Document deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete document' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}