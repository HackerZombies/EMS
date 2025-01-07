import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

// Enum for Document Categories (matching the prisma model)
enum DocumentCategory {
  resume = 'resume',
  education = 'education',
  identity = 'identity',
  certifications = 'certifications',
  skills = 'skills',
  others = 'others',
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb', // Adjust the size as needed
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username, documentId } = req.query;

  if (req.method === 'GET') {
    try {
      // If documentId is provided, handle file download
      if (documentId) {
        const document = await prisma.employeeDocument.findUnique({
          where: { id: documentId as string },
          select: {
            filename: true,
            fileType: true,
            data: true,
          },
        });

        if (!document) {
          return res.status(404).json({ error: 'Document not found' });
        }

        // Set headers for file download
        res.setHeader('Content-Type', document.fileType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);

        // Send the binary data as the response
        return res.status(200).send(Buffer.from(document.data));
      }

      // If no documentId, fetch documents for the user
      const documents = await prisma.employeeDocument.findMany({
        where: { userUsername: username as string },
        select: {
          id: true,
          filename: true,
          fileType: true,
          size: true,
          dateUploaded: true,
          category: true,
        },
      });

      const formattedDocs = documents.map((doc) => ({
        ...doc,
        downloadUrl: `/api/users/employee-documents/${username}?documentId=${doc.id}`, // Adjusted URL for downloading
        dateUploaded: doc.dateUploaded.toISOString().split('T')[0],
      }));

      // Return the documents as JSON
      return res.status(200).json(formattedDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  } else if (req.method === 'POST') {
    try {
      const files = req.body.files; // Expecting files as part of the request body

      const uploadedDocs = await Promise.all(
        files.map(async (file: any) => {
          const category: DocumentCategory = file.category && Object.values(DocumentCategory).includes(file.category)
            ? file.category
            : DocumentCategory.others;

          const document = await prisma.employeeDocument.create({
            data: {
              filename: file.filename,
              fileType: file.fileType,
              size: file.size,
              data: Buffer.from(file.fileData, 'base64'),
              category: category,
              userUsername: username as string,
            },
          });

          return {
            id: document.id,
            filename: document.filename,
            fileType: document.fileType,
            size: document.size,
            dateUploaded: document.dateUploaded.toISOString(),
            category: document.category,
            downloadUrl: `/api/users/employee-documents/${username}?documentId=${document.id}`,
          };
        })
      );

      res.status(200).json(uploadedDocs);
    } catch (error) {
      console.error('Error uploading documents:', error);
      res.status(500).json({ error: 'Failed to upload documents' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { documentId } = req.body;

      await prisma.employeeDocument.delete({
        where: { id: documentId },
      });

      res.status(200).json({ message: 'Document deleted successfully.' });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ error: 'Failed to delete document.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
