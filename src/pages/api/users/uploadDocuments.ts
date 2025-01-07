import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '@/lib/prisma'; // Assuming Prisma ORM is being used

// API to upload documents
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { username, documents } = req.body;

  if (!username || !documents || !Array.isArray(documents)) {
    return res.status(400).json({ message: 'Invalid request body. Ensure documents array is passed' });
  }

  // DocumentCategory enum values
  const validCategories = [
    'resume',
    'education',
    'identity',
    'certifications',
    'skills',
    'others'
  ];

  try {
    // Process each document and upload it to the database
    const uploadedDocuments = await Promise.all(
      documents.map(async (document: { fileData: string; fileName: string; fileType: string; category: string }) => {
        // Validate category
        if (!validCategories.includes(document.category)) {
          throw new Error(`Invalid category. Valid categories are: ${validCategories.join(', ')}`);
        }

        // Create document entry in the EmployeeDocument model
        const newDocument = await prisma.employeeDocument.create({
          data: {
            filename: document.fileName,
            fileType: document.fileType,
            data: Buffer.from(document.fileData, 'base64'), // Assuming base64 file data
            size: Buffer.byteLength(document.fileData, 'base64'),
            category: document.category as 'resume' | 'education' | 'identity' | 'certifications' | 'skills' | 'others', // Cast to DocumentCategory enum
            userUsername: username, // Assuming the username is passed in the request
          },
        });

        return {
          id: newDocument.id,
          displayName: newDocument.filename,
          uploadDate: new Date().toISOString(), // Use current date for upload date
          category: document.category,
          downloadUrl: `/api/users/document/${newDocument.id}`, // Assuming you have an endpoint to fetch the document
        };
      })
    );

    return res.status(200).json({ uploadedDocuments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Internal server error' });
  }
}