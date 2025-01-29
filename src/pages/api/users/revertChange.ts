// src/pages/api/users/revertChange.ts

import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function revertChange(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { logId, fields } = req.body; 
    // If fields is provided as an array of strings, we do partial revert, otherwise revert all changed fields.

    if (!logId) {
      return res.status(400).json({ message: "Missing logId" });
    }

    // 1) Fetch the auditLog
    const auditLog = await prisma.auditLog.findUnique({
      where: { id: logId },
    });
    if (!auditLog) {
      return res.status(404).json({ message: "Audit Log not found" });
    }

    // 2) We must have stored the targetUsername
    const targetUsername = auditLog.targetUsername;
    if (!targetUsername) {
      return res.status(400).json({ message: "Log has no targetUsername" });
    }

    // 3) Parse the details to see what changed
    let changes;
    try {
      changes = JSON.parse(auditLog.details);
    } catch (err) {
      return res.status(400).json({ message: "Invalid log details JSON" });
    }

    // 4) Re-fetch the current user to confirm existence
    const currentUser = await prisma.user.findUnique({
      where: { username: targetUsername },
      include: {
        qualifications: true,
        experiences: true,
        certifications: true,
        employeeDocuments: true,
        emergencyContacts: true,
      },
    });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // 5) The top-level fields from updateUser.ts that we can revert
    const topLevelFields = [
      "firstName",
      "middleName",
      "lastName",
      "email",
      "phoneNumber",
      "residentialAddress",
      "permanentAddress",
      "role",
      "dob",
      "gender",
      "bloodGroup",
      "employmentType",
      "workLocation",
      "department",
      "position",
      "nationality",
      "profileImageUrl",
      "joiningDate",
    ];

    // Decide which fields to revert:
    // If fields array is provided & non-empty, revert only those
    // Otherwise revert everything in changes
    const fieldsToRevert = Array.isArray(fields) && fields.length > 0
      ? fields
      : Object.keys(changes); // revert all changed fields

    // We'll collect the top-level fields to revert in an object
    const dataToRevert: Record<string, any> = {};

    // We'll also build an object describing the fields we actually reverted
    // so that we can store it in the new REVERT_CHANGES log details
    const revertedChanges: Record<string, any> = {};

    for (const fieldName of fieldsToRevert) {
      // Make sure this field actually exists in 'changes'
      if (!changes[fieldName]) {
        continue; // No change recorded for this field
      }

      const { old: oldValue, new: newValue } = changes[fieldName];

      // If it's a known top-level field
      if (topLevelFields.includes(fieldName) && oldValue !== undefined) {
        dataToRevert[fieldName] = oldValue ?? null;

        // Record we reverted this field
        revertedChanges[fieldName] = { old: oldValue, new: newValue };
      }
      // If it's sub-collection data (array), revert entire sub-collection
      else if (Array.isArray(oldValue)) {
        if (fieldName === "qualifications") {
          await revertQualifications(targetUsername, oldValue);
        } else if (fieldName === "experiences") {
          await revertExperiences(targetUsername, oldValue);
        } else if (fieldName === "certifications") {
          await revertCertifications(targetUsername, oldValue);
        } else if (fieldName === "employeeDocuments") {
          await revertDocuments(targetUsername, oldValue);
        } else if (fieldName === "emergencyContacts") {
          await revertEmergencyContacts(targetUsername, oldValue);
        }

        // Record we reverted this sub-collection
        revertedChanges[fieldName] = { old: oldValue, new: newValue };
      }
    }

    // If we have top-level fields to revert, do so
    if (Object.keys(dataToRevert).length > 0) {
      await prisma.user.update({
        where: { username: targetUsername },
        data: dataToRevert,
      });
    }

    // 6) Create a new Audit Log for the revert
    // We'll only store the actual fields that were reverted
    await prisma.auditLog.create({
      data: {
        action: "REVERT_CHANGES",
        performedBy: session.user.username,
        targetUsername,
        userUsername: targetUsername, // references the user whose record is changed
        details: JSON.stringify(revertedChanges, null, 2),
      },
    });
    

    return res.status(200).json({ message: "Changes reverted successfully" });
  } catch (error: any) {
    console.error("Error reverting changes:", error);
    return res.status(500).json({
      message: "Failed to revert changes",
      error: error.message,
    });
  }
}

// -------------- Sub-collection Reverters --------------

// Revert qualifications
async function revertQualifications(username: string, oldArray: any[]) {
  await prisma.qualification.deleteMany({ where: { username } });
  const data = oldArray.map((q) => ({
    ...q,
    username,
  }));
  if (data.length > 0) {
    await prisma.qualification.createMany({ data });
  }
}

// Revert experiences
async function revertExperiences(username: string, oldArray: any[]) {
  await prisma.experience.deleteMany({ where: { username } });
  const data = oldArray.map((exp) => ({
    ...exp,
    username,
  }));
  if (data.length > 0) {
    await prisma.experience.createMany({ data });
  }
}

// Revert certifications
async function revertCertifications(username: string, oldArray: any[]) {
  await prisma.certification.deleteMany({ where: { username } });
  const data = oldArray.map((cert) => ({
    ...cert,
    username,
  }));
  if (data.length > 0) {
    await prisma.certification.createMany({ data });
  }
}

// Revert documents
async function revertDocuments(username: string, oldArray: any[]) {
  await prisma.employeeDocument.deleteMany({ where: { userUsername: username } });
  if (oldArray.length > 0) {
    await prisma.employeeDocument.createMany({
      data: oldArray.map((doc) => ({
        ...doc,
        userUsername: username,
      })),
    });
  }
}

// Revert emergency contacts
async function revertEmergencyContacts(username: string, oldArray: any[]) {
  await prisma.emergencyContact.deleteMany({ where: { userUsername: username } });
  if (oldArray.length > 0) {
    await prisma.emergencyContact.createMany({
      data: oldArray.map((contact) => ({
        ...contact,
        userUsername: username,
      })),
    });
  }
}
