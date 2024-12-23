import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";
import * as dotenv from "dotenv";

dotenv.config();

// Create a transporter object using Gmail service
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_PASS, // Your Gmail password or App password
  },
});

// Function to send approval email
const sendApprovalEmail = async (to: string) => {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject: "Document Approval Notification",
    text: "Your document has been approved successfully.",
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Approval email sent successfully");
  } catch (error) {
    console.error("Error sending approval email:", error);
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid document ID" });
  }

  try {
    // Fetch the document along with the user relation
    const document = await prisma.hrDocument.findUnique({
      where: { id },
      include: { user: true }, // Ensure the user relation is fetched
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Check if the user exists and has an email
    if (!document.user || !document.user.email) {
      return res
        .status(400)
        .json({ error: "User associated with the document does not exist or has no email" });
    }

    // Update the document status to 'Approved'
    await prisma.hrDocument.update({
      where: { id },
      data: { status: "Approved" },
    });

    // Send approval email to the user
    await sendApprovalEmail(document.user.email);

    return res.status(200).json({ message: "Document approved successfully" });
  } catch (error) {
    console.error("Error approving document:", error);
    return res.status(500).json({ error: "Failed to approve document" });
  }
}
