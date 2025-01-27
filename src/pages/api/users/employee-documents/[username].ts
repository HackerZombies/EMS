// src/pages/api/users/employee-documents/[username].ts

import type { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import prisma from '@/lib/prisma';
import { DocumentCategory } from '@prisma/client'; // Import DocumentCategory from Prisma
import path from 'path'; // Import the 'path' module
import { v4 as uuidv4 } from 'uuid'; // Import UUID for unique identifiers
import { fileTypeFromBuffer, FileTypeResult } from 'file-type'; // Import file-type for content validation

// Disable Next.js's default body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to run middleware
const runMiddleware = (
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve();
    });
  });
};

// Enhanced sanitizeFilename Function with UUID
const sanitizeFileName = (fileName: string): string => {
  const name = path.basename(fileName, path.extname(fileName)); // Extract name without extension
  const extension = path.extname(fileName).toLowerCase(); // Get and lowercase extension

  // Sanitize the base name
  const sanitizedBase = name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '_') // Replace invalid characters with '_'
    .replace(/_+/g, '_'); // Replace multiple '_' with single '_'

  // Generate a unique identifier
  const uniqueSuffix = uuidv4(); // Alternatively, use Date.now() for simpler uniqueness

  // Reconstruct the sanitized filename with unique suffix
  return `${sanitizedBase}_${uniqueSuffix}${extension}`;
};

// Configure multer storage (store files in memory for simplicity)
const storage = multer.memoryStorage();

// Initialize multer with the storage configuration
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Initial MIME type check
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new multer.MulterError(
          'LIMIT_UNEXPECTED_FILE',
          'Invalid file type. Only PDF, JPEG, and PNG are allowed.'
        )
      );
    }
  },
}).array('files'); // Expect 'files' field for uploads

// Extend NextApiRequest to include 'files'
interface NextApiRequestWithFiles extends NextApiRequest {
  files: Express.Multer.File[];
}

// Handler Function
const handler = async (
  req: NextApiRequestWithFiles,
  res: NextApiResponse
) => {
  const { username } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing username.' });
  }

  switch (req.method) {
    case 'GET':
      return handleGET(req, res, username);
    case 'POST':
      return handlePOST(req, res, username);
    case 'DELETE':
      return handleDELETE(req, res, username);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
};

// GET Handler: Fetch or Download Documents
const handleGET = async (
  req: NextApiRequest,
  res: NextApiResponse,
  username: string
) => {
  const { documentId } = req.query;

  try {
    if (documentId && typeof documentId === 'string') {
      const document = await prisma.employeeDocument.findUnique({
        where: { id: documentId },
        select: {
          filename: true,
          fileType: true,
          data: true,
          userUsername: true,
        },
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Ensure the document belongs to the user
      if (document.userUsername !== username) {
        return res.status(403).json({ error: 'Unauthorized access to document' });
      }

      // Set headers for file download
      res.setHeader(
        'Content-Type',
        document.fileType || 'application/octet-stream'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${document.filename}"`
      );

      // Send the binary data as the response
      return res.status(200).send(Buffer.from(document.data));
    }

    // If no documentId, fetch documents for the user
    const documents = await prisma.employeeDocument.findMany({
      where: { userUsername: username },
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
      downloadUrl: `/api/users/employee-documents/${username}?documentId=${doc.id}`,
      dateUploaded: doc.dateUploaded.toISOString().split('T')[0],
    }));

    // Return the documents as JSON
    return res.status(200).json(formattedDocs);
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

// POST Handler: Upload Documents
const handlePOST = async (
  req: NextApiRequestWithFiles,
  res: NextApiResponse,
  username: string
) => {
  // Run multer middleware
  try {
    await runMiddleware(req, res, upload);
  } catch (error: any) {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Multer Error:', error);
    return res.status(500).json({ error: 'Failed to process files' });
  }

  const files = req.files;

  // Extract 'category' from the body
  const category =
    typeof req.body.category === 'string'
      ? req.body.category
      : Array.isArray(req.body.category)
      ? req.body.category[0]
      : DocumentCategory.others; // Updated to match enum

  // Validate category
  if (!Object.values(DocumentCategory).includes(category as DocumentCategory)) {
    return res.status(400).json({ error: 'Invalid document category' });
  }

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  // Define allowed file types based on 'file-type' detection
  const allowedFileTypes: { mime: string; ext: string }[] = [
    { mime: 'application/pdf', ext: '.pdf' },
    { mime: 'image/jpeg', ext: '.jpg' },
    { mime: 'image/png', ext: '.png' },
  ];

  try {
    const uploadedDocs = await Promise.all(
      files.map(async (file) => {
        // Advanced File Type Validation using 'file-type'
        const fileTypeResult: FileTypeResult | undefined = await fileTypeFromBuffer(file.buffer);

        if (!fileTypeResult) {
          throw new Error(`Unable to determine the file type of ${file.originalname}`);
        }

        const isAllowed = allowedFileTypes.some(
          (type) => type.mime === fileTypeResult.mime && path.extname(file.originalname).toLowerCase() === type.ext
        );

        if (!isAllowed) {
          throw new Error(`Invalid file type for ${file.originalname}. Allowed types are PDF, JPEG, PNG.`);
        }

        // Sanitize the filename
        const sanitizedFilename = sanitizeFileName(file.originalname);

        // Create document entry in the database
        const document = await prisma.employeeDocument.create({
          data: {
            filename: sanitizedFilename, // Use sanitized filename
            fileType: fileTypeResult.mime, // Use detected MIME type
            size: file.size,
            data: file.buffer,
            category: category as DocumentCategory,
            userUsername: username,
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

    // Respond with the uploaded documents' details
    return res.status(200).json(uploadedDocs);
  } catch (error: any) {
    console.error('Error uploading documents:', error);
    return res.status(400).json({
      error: error.message || 'Failed to upload documents',
    });
  }
};

// DELETE Handler: Delete Document
const handleDELETE = async (
  req: NextApiRequest,
  res: NextApiResponse,
  username: string
) => {
  // Parse JSON body
  let body: { documentId?: string };
  try {
    const buffers: Uint8Array[] = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const data = Buffer.concat(buffers).toString();
    body = JSON.parse(data);
  } catch (error) {
    console.error('Error parsing JSON body:', error);
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { documentId } = body;

  if (!documentId || typeof documentId !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing document ID.' });
  }

  try {
    // Verify that the document belongs to the user
    const existingDocument = await prisma.employeeDocument.findUnique({
      where: { id: documentId },
      select: { userUsername: true },
    });

    if (!existingDocument || existingDocument.userUsername !== username) {
      return res.status(403).json({ error: 'Unauthorized to delete this document.' });
    }

    await prisma.employeeDocument.delete({
      where: { id: documentId },
    });

    return res.status(200).json({ message: 'Document deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return res.status(500).json({ error: 'Failed to delete document.' });
  }
};

export default handler;
