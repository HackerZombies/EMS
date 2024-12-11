// pages/api/hr/documents/reject.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

// Create a transporter object using Gmail service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_PASS, // Your Gmail password or App password
  },
});

// Function to send rejection email
const sendRejectionEmail = async (to: string, reason: string) => {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject: 'Document Rejection Notification',
    text: `Your document has been rejected for the following reason:\n\n${reason}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Rejection email sent successfully');
  } catch (error) {
    console.error('Error sending rejection email:', error);
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { id } = req.query;
    const { reason } = req.body;

    try {
      // Fetch the document to get the user's email
      const document = await prisma.hrDocument.findUnique({
        where: { id: String(id) },
        include: { user: true }, // Assuming there's a relation to the user
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Update the document status to 'Rejected'
      await prisma.hrDocument.update({
        where: { id: String(id) },
        data: { status: 'Rejected', rejectionReason: reason },
      });

      // Send rejection email to the user
      await sendRejectionEmail(document.user.email, reason); // Assuming the user has an email field

      return res.status(200).json({ message: 'Document rejected successfully' });
    } catch (error) {
      console.error('Error rejecting document:', error);
      return res.status(500).json({ error: 'Failed to reject document' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}