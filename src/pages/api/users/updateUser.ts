// src/pages/api/users/updateUser.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import {
  Department,
  Position,
  WorkLocation,
  EmploymentType,
  User as PrismaUser,
  Qualification,
  Experience,
  Certification,
  EmployeeDocument,
  EmergencyContact,
} from "@prisma/client";
import sendUpdateEmail from "@/lib/sendUserUpdateEmail";
import { mapToDocumentCategory } from "@/lib/documentCategory";
import logger from "@/lib/logger";
import crypto from "crypto";

const ALLOWED_ROLES = ["HR", "ADMIN"];

/** A helper interface to represent the "full" user including relations. */
interface FullUser extends PrismaUser {
  qualifications: Qualification[];
  experiences: Experience[];
  certifications: Certification[];
  employeeDocuments: EmployeeDocument[];
  emergencyContacts: EmergencyContact[];
}

/** Compare old vs. new user for an object describing changes. */
function buildChangesDiff(oldUser: FullUser, newUser: FullUser) {
  const changedFields: Record<string, { old: any; new: any }> = {};

  // 1. Compare top-level fields
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
  ];

  for (const key of topLevelFields) {
    const oldVal = (oldUser as any)[key];
    const newVal = (newUser as any)[key];

    if (oldVal instanceof Date && newVal instanceof Date) {
      if (oldVal.getTime() !== newVal.getTime()) {
        changedFields[key] = { old: oldVal, new: newVal };
      }
    } else if (
      typeof oldVal === "object" &&
      oldVal !== null &&
      typeof newVal === "object" &&
      newVal !== null
    ) {
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changedFields[key] = { old: oldVal, new: newVal };
      }
    } else {
      if (oldVal !== newVal) {
        changedFields[key] = { old: oldVal, new: newVal };
      }
    }
  }

  // 2. Compare joiningDate separately
  if (oldUser.joiningDate instanceof Date && newUser.joiningDate instanceof Date) {
    if (oldUser.joiningDate.getTime() !== newUser.joiningDate.getTime()) {
      changedFields["joiningDate"] = {
        old: oldUser.joiningDate,
        new: newUser.joiningDate,
      };
    }
  } else {
    if (oldUser.joiningDate !== newUser.joiningDate) {
      changedFields["joiningDate"] = {
        old: oldUser.joiningDate,
        new: newUser.joiningDate,
      };
    }
  }

  // 3. Compare array fields
  function compareArray(fieldName: keyof FullUser) {
    const oldFieldValue = oldUser[fieldName];
    const newFieldValue = newUser[fieldName];

    const oldArray = Array.isArray(oldFieldValue)
      ? oldFieldValue.map(simplifyRecord)
      : [];
    const newArray = Array.isArray(newFieldValue)
      ? newFieldValue.map(simplifyRecord)
      : [];

    const oldVal = JSON.stringify(oldArray);
    const newVal = JSON.stringify(newArray);
    if (oldVal !== newVal) {
      changedFields[fieldName as string] = {
        old: JSON.parse(oldVal),
        new: JSON.parse(newVal),
      };
    }
  }

  function simplifyRecord(obj: any) {
    const { id, dateCreated, ...rest } = obj;
    return rest;
  }

  compareArray("qualifications");
  compareArray("experiences");
  compareArray("certifications");
  compareArray("employeeDocuments");
  compareArray("emergencyContacts");

  return changedFields;
}

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // 1) Session & Role check
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user || !ALLOWED_ROLES.includes(session.user.role as string)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 2) Extract body
    const {
      username,
      firstName,
      lastName,
      email,
      phoneNumber,
      residentialAddress, // now sent as either a JSON string or an object
      permanentAddress,   // now sent as either a JSON string or an object
      role,
      password,
      dob,
      joiningDate,
      middleName,
      department,
      position,
      gender,
      bloodGroup,
      employmentType,
      workLocation,
      qualifications,
      experiences,
      certifications,
      documents,
      emergencyContacts,
      profileImageUrl,
      nationality,
      resetPassword,
    } = req.body;

    // 3) Basic validation
    if (!username || !firstName || !lastName || !email || !role) {
      return res.status(400).json({ message: "Missing mandatory fields" });
    }

    // 4) Prepare main user data for update (do NOT include addresses here)
    const dataToUpdate: Record<string, any> = {
      firstName,
      lastName,
      email,
      phoneNumber,
      role,
    };

    if (middleName) dataToUpdate.middleName = middleName;
    if (department) dataToUpdate.department = department;
    if (position) dataToUpdate.position = position;
    if (gender) dataToUpdate.gender = gender;
    if (bloodGroup) dataToUpdate.bloodGroup = bloodGroup;
    if (employmentType) dataToUpdate.employmentType = employmentType;
    if (workLocation) dataToUpdate.workLocation = workLocation;
    if (profileImageUrl) dataToUpdate.profileImageUrl = profileImageUrl;
    if (dob) dataToUpdate.dob = new Date(dob);
    if (nationality) dataToUpdate.nationality = nationality;
    if (joiningDate !== undefined && joiningDate !== null) {
      dataToUpdate.joiningDate = new Date(joiningDate);
    }

    // 5) Handle password reset or direct password change
    if (resetPassword) {
      const newPassword = crypto.randomBytes(12).toString("hex");
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      dataToUpdate.password = hashedPassword;

      // Send password reset email asynchronously
      sendUpdateEmail(email, username, newPassword)
        .then(() => logger.info(`Password reset email sent to user ${username}.`))
        .catch((error) =>
          logger.error(`Failed to send password reset email to ${username}:`, error)
        );
    } else if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    // 6) Enum Validations
    const validDepartments: Department[] = [
      Department.Admin,
      Department.HR,
      Department.Software,
      Department.Hardware,
      Department.Production,
    ];
    if (department && !validDepartments.includes(department as Department)) {
      return res.status(400).json({ message: "Invalid department" });
    }

    const validPositions: Position[] = [
      Position.Software_Development_Engineer,
      Position.Embedded_Software_Development_Engineer,
      Position.Hardware_Engineer,
      Position.Chief_Technology_Officer,
      Position.Chief_Executive_Officer,
      Position.Project_Manager,
    ];
    if (position && !validPositions.includes(position as Position)) {
      return res.status(400).json({ message: "Invalid position" });
    }

    const validWorkLocations: WorkLocation[] = [
      WorkLocation.NaviMumbai,
      WorkLocation.Delhi,
      WorkLocation.Kochi,
      WorkLocation.Remote,
    ];
    if (workLocation && !validWorkLocations.includes(workLocation as WorkLocation)) {
      return res.status(400).json({ message: "Invalid work location" });
    }

    const validEmploymentTypes: EmploymentType[] = [
      EmploymentType.FULL_TIME,
      EmploymentType.PART_TIME,
      EmploymentType.CONTRACT,
      EmploymentType.INTERN,
      EmploymentType.OTHER,
    ];
    if (employmentType && !validEmploymentTypes.includes(employmentType as EmploymentType)) {
      return res.status(400).json({ message: "Invalid employment type" });
    }

    // 7) Fetch old user
    const oldUser = (await prisma.user.findUnique({
      where: { username },
      include: {
        qualifications: true,
        experiences: true,
        certifications: true,
        employeeDocuments: true,
        emergencyContacts: true,
      },
    })) as FullUser | null;

    if (!oldUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // 8) Parse addresses from the request.
    // If the address is a string, attempt to parse it; if it is an object, use it directly.
    let parsedResidentialAddress = null;
    if (residentialAddress) {
      if (typeof residentialAddress === "string") {
        try {
          parsedResidentialAddress = JSON.parse(residentialAddress);
        } catch (err) {
          return res.status(400).json({ message: "Invalid JSON for residentialAddress" });
        }
      } else if (typeof residentialAddress === "object") {
        parsedResidentialAddress = residentialAddress;
      }
    }

    let parsedPermanentAddress = null;
    if (permanentAddress) {
      if (typeof permanentAddress === "string") {
        try {
          parsedPermanentAddress = JSON.parse(permanentAddress);
        } catch (err) {
          return res.status(400).json({ message: "Invalid JSON for permanentAddress" });
        }
      } else if (typeof permanentAddress === "object") {
        parsedPermanentAddress = permanentAddress;
      }
    }

    // 9) Update main user record using nested upsert for addresses.
    // Notice that we do NOT include the 'userUsername' field in the create data.
    await prisma.user.update({
      where: { username },
      data: {
        ...dataToUpdate,
        residentialAddress: parsedResidentialAddress
          ? {
              upsert: {
                update: {
                  flat: parsedResidentialAddress.flat,
                  street: parsedResidentialAddress.street,
                  landmark: parsedResidentialAddress.landmark,
                  city: parsedResidentialAddress.city,
                  district: parsedResidentialAddress.district,
                  state: parsedResidentialAddress.state,
                  pin: parsedResidentialAddress.pin,
                },
                create: {
                  flat: parsedResidentialAddress.flat,
                  street: parsedResidentialAddress.street,
                  landmark: parsedResidentialAddress.landmark,
                  city: parsedResidentialAddress.city,
                  district: parsedResidentialAddress.district,
                  state: parsedResidentialAddress.state,
                  pin: parsedResidentialAddress.pin,
                },
              },
            }
          : undefined,
        permanentAddress: parsedPermanentAddress
          ? {
              upsert: {
                update: {
                  flat: parsedPermanentAddress.flat,
                  street: parsedPermanentAddress.street,
                  landmark: parsedPermanentAddress.landmark,
                  city: parsedPermanentAddress.city,
                  district: parsedPermanentAddress.district,
                  state: parsedPermanentAddress.state,
                  pin: parsedPermanentAddress.pin,
                },
                create: {
                  flat: parsedPermanentAddress.flat,
                  street: parsedPermanentAddress.street,
                  landmark: parsedPermanentAddress.landmark,
                  city: parsedPermanentAddress.city,
                  district: parsedPermanentAddress.district,
                  state: parsedPermanentAddress.state,
                  pin: parsedPermanentAddress.pin,
                },
              },
            }
          : undefined,
      },
    });

    // 10) Update sub-collections concurrently
    await Promise.all([
      handleQualifications(username, qualifications),
      handleExperiences(username, experiences),
      handleCertifications(username, certifications),
      handleDocuments(username, documents),
      handleEmergencyContacts(username, emergencyContacts),
    ]);

    // 11) Re-fetch new user
    const newUser = (await prisma.user.findUnique({
      where: { username },
      include: {
        qualifications: true,
        experiences: true,
        certifications: true,
        employeeDocuments: true,
        emergencyContacts: true,
      },
    })) as FullUser | null;

    if (!newUser) {
      return res.status(500).json({ message: "Could not re-fetch updated user." });
    }

    // 12) Build diff
    const changedFields = buildChangesDiff(oldUser, newUser);

    // 13) If no changes, respond
    const hasChanges = Object.keys(changedFields).length > 0 || resetPassword;
    if (!hasChanges) {
      return res.status(200).json({ message: "No changes detected" });
    }

    // 14) Create the audit log
    const auditLog = await prisma.auditLog.create({
      data: {
        action: "UPDATE_USER",
        performedBy: session.user.username,
        targetUsername: username,
        userUsername: username,
        details: JSON.stringify(changedFields, null, 2),
      },
    });

    // 15) Create a notification for ADMIN
    await prisma.notification.create({
      data: {
        message: `User "${username}" was updated by ${session.user.username}`,
        roleTargets: ["ADMIN"],
        targetUrl: `/activity?highlightLog=${auditLog.id}`,
      },
    });

    return res.status(200).json({
      message: "User updated successfully",
      resetPassword: resetPassword ? "Password reset email sent" : undefined,
      updatedUser: newUser,
    });
  } catch (error: any) {
    logger.error("Error updating user:", error);
    return res.status(500).json({
      message: "Failed to update user",
      error: error.message,
    });
  }
}

// ------------------------------
//  Sub-collection Handlers
// ------------------------------
async function handleEmergencyContacts(username: string, emergencyContacts: any[]) {
  if (Array.isArray(emergencyContacts)) {
    await prisma.emergencyContact.deleteMany({ where: { userUsername: username } });
    const data = emergencyContacts.map((contact) => ({
      name: contact.name,
      relationship: contact.relationship,
      phoneNumber: contact.phoneNumber,
      email: contact.email,
      userUsername: username,
    }));
    if (data.length > 0) {
      await prisma.emergencyContact.createMany({ data });
    }
  }
}

async function handleQualifications(username: string, qualifications: any[]) {
  if (Array.isArray(qualifications)) {
    await prisma.qualification.deleteMany({ where: { username } });

    const data = qualifications.map((qual) => {
      const record: any = {
        name: qual.name,
        level: qual.level,
        specializations: qual.specializations || [],
        institution: qual.institution || null,
        username,
      };

      if (qual.startDate) {
        record.startDate = new Date(qual.startDate);
      }
      if (qual.endDate) {
        record.endDate = new Date(qual.endDate);
      }

      return record;
    });

    if (data.length > 0) {
      await prisma.qualification.createMany({ data });
    }
  }
}

async function handleExperiences(username: string, experiences: any[]) {
  if (Array.isArray(experiences)) {
    await prisma.experience.deleteMany({ where: { username } });
    const data = experiences.map((exp) => {
      const record: any = {
        jobTitle: exp.jobTitle,
        company: exp.company,
        description: exp.description,
        username,
      };

      if (exp.startDate) {
        record.startDate = new Date(exp.startDate);
      }
      if (exp.endDate) {
        record.endDate = new Date(exp.endDate);
      }

      return record;
    });

    if (data.length > 0) {
      await prisma.experience.createMany({ data });
    }
  }
}

async function handleCertifications(username: string, certifications: any[]) {
  if (Array.isArray(certifications)) {
    await prisma.certification.deleteMany({ where: { username } });
    const data = certifications.map((cert) => {
      const record: any = {
        name: cert.name,
        issuingAuthority: cert.issuingAuthority,
        licenseNumber: cert.licenseNumber || null,
        username,
      };

      if (cert.issueDate) {
        record.issueDate = new Date(cert.issueDate);
      }
      if (cert.expiryDate) {
        record.expiryDate = new Date(cert.expiryDate);
      }

      return record;
    });

    if (data.length > 0) {
      await prisma.certification.createMany({ data });
    }
  }
}

async function handleDocuments(username: string, documents: any) {
  if (documents && typeof documents === "object") {
    await prisma.employeeDocument.deleteMany({ where: { userUsername: username } });

    const allDocs = Object.keys(documents).flatMap((category) => {
      const docs = Array.isArray(documents[category]) ? documents[category] : [];
      return docs
        .map((doc: any) => {
          const mappedCategory = mapToDocumentCategory(category);
          if (!mappedCategory) {
            console.warn(`Invalid document category: ${category}`);
            return null;
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

    if (allDocs.length > 0) {
      await prisma.employeeDocument.createMany({ data: allDocs });
    }
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};
