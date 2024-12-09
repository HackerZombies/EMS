import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';

type SubmissionInput = {
  digilockerId: string;
};

type SubmissionResponse = {
  id: string;
  filename: string;
  submittedBy: string;
  submitterFullName: string;
  department: string;
  position: string;
  dateSubmitted: string;
};

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<SubmissionResponse | { message: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { digilockerId } = req.body as SubmissionInput;

  try {
    const originalFile = await prisma.digilocker.findUnique({
      where: { id: digilockerId },
      include: {
        User: true // Include user details
      }
    });

    if (!originalFile || originalFile.userUsername !== session.user.username) {
      return res.status(403).json({ message: 'Unauthorized to submit this document' });
    }

    const submittedDocument = await prisma.hrDocument.create({
      data: {
        filename: originalFile.filename,
        fileUrl: '', // Handle file storage separately if needed
        submittedBy: session.user.username,
        submitterFullName: `${session.user.firstName} ${session.user.lastName}`,
        department: session.user.department || '',
        position: session.user.position || '',
        dateSubmitted: new Date(),
      },
    });

    return res.status(200).json({
      ...submittedDocument,
      dateSubmitted: submittedDocument.dateSubmitted.toISOString()
    });
  } catch (error) {
    console.error("Error submitting document to HR:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}