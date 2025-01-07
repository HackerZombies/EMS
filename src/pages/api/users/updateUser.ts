// src/pages/api/users/updateUser.ts

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import argon2 from "argon2";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { DocumentCategory } from '@prisma/client';
import sendUpdateEmail from '@/lib/sendUserUpdateEmail';

import { mapToDocumentCategory } from '@/lib/documentCategory';
import logger from '@/lib/logger'; // Assuming you have a logger set up
import crypto from 'crypto'; // To generate secure password

const ALLOWED_ROLES = [ "HR"]; // Roles allowed to update user data

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Validate session and user role
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user || !ALLOWED_ROLES.includes(session.user.role as string)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      username,
      firstName,
      lastName,
      email,
      phoneNumber,
      residentialAddress,
      role,
      password,
      dob,
      joiningDate,
      middleName,
      permanentAddress,
      department,
      position,
      gender,
      bloodGroup,
      employmentType,
      qualifications,
      experiences,
      certifications,
      documents,
      profileImageUrl,
      resetPassword, // Added flag
    } = req.body;

    // Basic validation for mandatory fields
    if (!username || !firstName || !lastName || !email || !role) {
      return res.status(400).json({ message: "Missing mandatory fields" });
    }

    // Prepare data to update
    const dataToUpdate: Record<string, any> = {
      firstName,
      lastName,
      email,
      phoneNumber,
      residentialAddress,
      role,
    };

    // Optional fields
    if (middleName) dataToUpdate.middleName = middleName;
    if (permanentAddress) dataToUpdate.permanentAddress = permanentAddress;
    if (department) dataToUpdate.department = department;
    if (position) dataToUpdate.position = position;
    if (gender) dataToUpdate.gender = gender;
    if (bloodGroup) dataToUpdate.bloodGroup = bloodGroup;
    if (employmentType) dataToUpdate.employmentType = employmentType;
    if (profileImageUrl) dataToUpdate.profileImageUrl = profileImageUrl;
    if (dob) dataToUpdate.dob = new Date(dob);
    if (joiningDate) dataToUpdate.joiningDate = new Date(joiningDate);

    // Handle password reset
    if (resetPassword) {
      // Generate a secure random password
      const newPassword = crypto.randomBytes(12).toString('hex'); // 24 characters

      // Hash the new password
      const hashedPassword = await argon2.hash(newPassword);

      dataToUpdate.password = hashedPassword;

      try {
        await sendUpdateEmail(email, username, newPassword);
        logger.info(`Password reset email sent to user ${username}.`);
      } catch (error) {
        logger.error(`Failed to send password reset email to ${username}:`, error);
        return res.status(500).json({ message: 'Failed to send password reset email' });
      }
    } else if (password) {
      dataToUpdate.password = await argon2.hash(password);
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare each key in dataToUpdate with the existingUser (cast to Record<string, any>)
    const isUnchanged = Object.keys(dataToUpdate).every(
      (key) => (existingUser as Record<string, any>)[key] === dataToUpdate[key]
    );
    if (isUnchanged && !resetPassword) {
      return res.status(200).json({ message: "No changes detected" });
    }

    // Update the user in the database
    const updatedUser = await prisma.user.update({
      where: { username },
      data: dataToUpdate,
    });

    // --- Optional Sections ---
    await handleQualifications(username, qualifications);
    await handleExperiences(username, experiences);
    await handleCertifications(username, certifications);
    await handleDocuments(username, documents);

    return res.status(200).json({ message: "User updated successfully", updatedUser });
  } catch (error: any) {
    logger.error("Error updating user:", error);
    return res.status(500).json({ message: "Failed to update user", error: error.message });
  }
}

// Handle Qualifications
async function handleQualifications(username: string, qualifications: any[]) {
  if (Array.isArray(qualifications)) {
    await prisma.qualification.deleteMany({ where: { username } });
    const qualificationsData = qualifications.map((qual) => ({
      name: qual.name,
      level: qual.level,
      specializations: qual.specializations || [],
      institution: qual.institution || null,
      username,
    }));
    if (qualificationsData.length > 0) {
      await prisma.qualification.createMany({ data: qualificationsData });
    }
  }
}

// Handle Experiences
async function handleExperiences(username: string, experiences: any[]) {
  if (Array.isArray(experiences)) {
    await prisma.experience.deleteMany({ where: { username } });
    const experiencesData = experiences.map((exp) => ({
      jobTitle: exp.jobTitle,
      company: exp.company,
      description: exp.description,
      username,
      startDate: new Date(exp.startDate),
      endDate: exp.endDate ? new Date(exp.endDate) : undefined,
    }));
    if (experiencesData.length > 0) {
      await prisma.experience.createMany({ data: experiencesData });
    }
  }
}

// Handle Certifications
async function handleCertifications(username: string, certifications: any[]) {
  if (Array.isArray(certifications)) {
    await prisma.certification.deleteMany({ where: { username } });
    const certificationsData = certifications.map((cert) => ({
      name: cert.name,
      issuingAuthority: cert.issuingAuthority,
      licenseNumber: cert.licenseNumber || null,
      username,
      issueDate: cert.issueDate ? new Date(cert.issueDate) : undefined,
      expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined,
    }));
    if (certificationsData.length > 0) {
      await prisma.certification.createMany({ data: certificationsData });
    }
  }
}

// Handle Documents
async function handleDocuments(username: string, documents: any) {
  if (documents && typeof documents === "object") {
    // Delete existing documents
    await prisma.employeeDocument.deleteMany({ where: { userUsername: username } });

    const allDocs = Object.keys(documents).flatMap((category) => {
      const docs = Array.isArray(documents[category]) ? documents[category] : [];
      return docs
        .map((doc: any) => {
          const mappedCategory = mapToDocumentCategory(category);
          if (!mappedCategory) {
            console.warn(`Invalid document category: ${category}`);
            return null; // Skip invalid categories or handle as needed
          }

          return {
            userUsername: username,
            filename: doc.displayName || "Untitled",
            fileType: doc.fileType || null,
            data: doc.fileData ? Buffer.from(doc.fileData, "base64") : Buffer.from([]),
            size: doc.size || 0,
            category: mappedCategory,
          };
        })
        .filter((doc) => doc !== null);
    });

    // Filter out null values and ensure allDocs is an array of valid document objects
    const validDocs = allDocs.filter((doc) => doc !== null) as Array<{
      userUsername: string;
      filename: string;
      fileType: string | null;
      data: Buffer;
      size: number;
      category: DocumentCategory;
    }>;

    if (validDocs.length > 0) {
      // Perform concurrent create operations
      await Promise.all(
        validDocs.map((doc) =>
          prisma.employeeDocument.create({
            data: doc,
          })
        )
      );
    }
  }
}

// API Body Size Limit
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
};
