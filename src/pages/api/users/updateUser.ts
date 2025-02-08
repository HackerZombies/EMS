// src/pages/api/users/updateUser.ts

import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import crypto from "crypto";
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
  Prisma, // for input types
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import sendUpdateEmail from "@/lib/sendUserUpdateEmail";
import { mapToDocumentCategory } from "@/lib/documentCategory";
import logger from "@/lib/logger";

// 1) Import your pivot-based createNotification service
import { createNotification } from "@/services/notificationService";

const ALLOWED_ROLES = ["HR", "ADMIN"];

interface Address {
  flat: string | null;
  street: string | null;
  landmark: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pin: string | null;
}

/** Helper interface representing a full user with relations. */
interface FullUser extends PrismaUser {
  qualifications: Qualification[];
  experiences: Experience[];
  certifications: Certification[];
  employeeDocuments: EmployeeDocument[];
  emergencyContacts: EmergencyContact[];
  residentialAddress: Address | null;
  permanentAddress: Address | null;
}

/**
 * Build a diff object describing what fields changed (including nested ones).
 * Strips large Buffer data from being JSON-stringified.
 */
function buildChangesDiff(oldUser: FullUser, newUser: FullUser) {
  const changedFields: Record<string, { old: any; new: any }> = {};

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

  // Compare joiningDate separately
  if (oldUser.joiningDate instanceof Date && newUser.joiningDate instanceof Date) {
    if (oldUser.joiningDate.getTime() !== newUser.joiningDate.getTime()) {
      changedFields.joiningDate = {
        old: oldUser.joiningDate,
        new: newUser.joiningDate,
      };
    }
  } else {
    if (oldUser.joiningDate !== newUser.joiningDate) {
      changedFields.joiningDate = {
        old: oldUser.joiningDate,
        new: newUser.joiningDate,
      };
    }
  }

  // Compare array fields
  function compareArray(fieldName: keyof FullUser) {
    const oldFieldValue = oldUser[fieldName];
    const newFieldValue = newUser[fieldName];

    // Helper to remove large Buffer fields (data)
    function simplifyRecord(obj: any) {
      const { id, dateCreated, data, ...rest } = obj;
      return rest;
    }

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

  compareArray("qualifications");
  compareArray("experiences");
  compareArray("certifications");
  compareArray("employeeDocuments");
  compareArray("emergencyContacts");

  return changedFields;
}

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  // Only allow PUT requests.
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // 1) Check session and ensure user has the allowed role.
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as string)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 2) Extract body data
    const {
      username,
      firstName,
      lastName,
      email,
      phoneNumber,
      residentialAddress,
      permanentAddress,
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

    if (!username || !firstName || !lastName || !email || !role) {
      return res.status(400).json({ message: "Missing mandatory fields." });
    }

    // 3) Validate enumerations
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
    if (
      employmentType &&
      !validEmploymentTypes.includes(employmentType as EmploymentType)
    ) {
      return res.status(400).json({ message: "Invalid employment type" });
    }

    // 4) Fetch the existing user (with relations) to compare diffs
    const oldUser = (await prisma.user.findUnique({
      where: { username },
      include: {
        qualifications: true,
        experiences: true,
        certifications: true,
        employeeDocuments: true,
        emergencyContacts: true,
        residentialAddress: true,
        permanentAddress: true,
      },
    })) as FullUser | null;

    if (!oldUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // 5) Build updates for user (not including sub-collections yet)
    const dataToUpdate: Record<string, any> = {
      firstName,
      lastName,
      email,
      phoneNumber,
      role,
      middleName: middleName || null,
      department: department || null,
      position: position || null,
      gender: gender || null,
      bloodGroup: bloodGroup || null,
      employmentType: employmentType || null,
      workLocation: workLocation || null,
      profileImageUrl: profileImageUrl || null,
      nationality: nationality || null,
    };

    // 6) Handle password-related updates
    if (resetPassword) {
      // Generate a random password
      const newPassword = crypto.randomBytes(12).toString("hex");
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      dataToUpdate.password = hashedPassword;

      // Send email asynchronously
      sendUpdateEmail(email, username, newPassword)
        .then(() => logger.info(`Password reset email sent to user ${username}.`))
        .catch((err) =>
          logger.error(`Failed to send password reset email to ${username}:`, err)
        );
    } else if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    // 7) Convert date strings to Date objects if provided (schema requires them if not optional)
    if (dob) dataToUpdate.dob = new Date(dob);
    if (joiningDate !== undefined && joiningDate !== null) {
      dataToUpdate.joiningDate = new Date(joiningDate);
    }

    // 8) Prepare updates for addresses
    const parsedResidential =
      residentialAddress && typeof residentialAddress === "object"
        ? residentialAddress
        : null;
    const parsedPermanent =
      permanentAddress && typeof permanentAddress === "object"
        ? permanentAddress
        : null;

    // 9) Build a single transaction with all operations
    const transactionOps: any[] = [];

    // 9A) Update user (including address upserts)
    transactionOps.push(
      prisma.user.update({
        where: { username },
        data: {
          ...dataToUpdate,
          residentialAddress: parsedResidential
            ? {
                upsert: {
                  update: {
                    flat: parsedResidential.flat,
                    street: parsedResidential.street,
                    landmark: parsedResidential.landmark,
                    city: parsedResidential.city,
                    district: parsedResidential.district,
                    state: parsedResidential.state,
                    pin: parsedResidential.pin,
                  },
                  create: {
                    flat: parsedResidential.flat,
                    street: parsedResidential.street,
                    landmark: parsedResidential.landmark,
                    city: parsedResidential.city,
                    district: parsedResidential.district,
                    state: parsedResidential.state,
                    pin: parsedResidential.pin,
                  },
                },
              }
            : undefined,
          permanentAddress: parsedPermanent
            ? {
                upsert: {
                  update: {
                    flat: parsedPermanent.flat,
                    street: parsedPermanent.street,
                    landmark: parsedPermanent.landmark,
                    city: parsedPermanent.city,
                    district: parsedPermanent.district,
                    state: parsedPermanent.state,
                    pin: parsedPermanent.pin,
                  },
                  create: {
                    flat: parsedPermanent.flat,
                    street: parsedPermanent.street,
                    landmark: parsedPermanent.landmark,
                    city: parsedPermanent.city,
                    district: parsedPermanent.district,
                    state: parsedPermanent.state,
                    pin: parsedPermanent.pin,
                  },
                },
              }
            : undefined,
        },
      })
    );

    // 9B) Qualifications
    if (Array.isArray(qualifications)) {
      transactionOps.push(prisma.qualification.deleteMany({ where: { username } }));
      if (qualifications.length > 0) {
        // Build array of QualificationCreateManyInput
        const qData: Prisma.QualificationCreateManyInput[] = qualifications.map(
          (qual: any) => {
            // If your schema requires startDate, do the same approach (fallback or supply a date).
            // Otherwise, if it's optional, only add the property if provided.
            const record: Prisma.QualificationCreateManyInput = {
              name: qual.name,
              level: qual.level,
              specializations: qual.specializations || [],
              institution: qual.institution || null,
              username,
            };
            // If your schema has startDate/endDate as optional, only add them if provided:
            if (qual.startDate) record.startDate = new Date(qual.startDate);
            if (qual.endDate) record.endDate = new Date(qual.endDate);
            return record;
          }
        );
        transactionOps.push(prisma.qualification.createMany({ data: qData }));
      }
    }

    // 9C) Experiences
    if (Array.isArray(experiences)) {
      transactionOps.push(prisma.experience.deleteMany({ where: { username } }));
      if (experiences.length > 0) {
        // Since startDate is required in your schema, fallback to new Date() if missing
        const eData: Prisma.ExperienceCreateManyInput[] = experiences.map((exp: any) => {
          const record: Prisma.ExperienceCreateManyInput = {
            jobTitle: exp.jobTitle,
            company: exp.company,
            description: exp.description,
            username,
            // If your schema says: startDate Date (no ?), we MUST supply it.
            startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
          };
          // If your schema also requires endDate, fallback to new Date()
          // If it's optional, only add if present
          if (typeof exp.endDate !== "undefined" && exp.endDate !== null) {
            record.endDate = new Date(exp.endDate);
          } else {
            // If endDate is mandatory in the schema
            record.endDate = new Date();
          }

          return record;
        });
        transactionOps.push(prisma.experience.createMany({ data: eData }));
      }
    }

    // 9D) Certifications
    if (Array.isArray(certifications)) {
      transactionOps.push(prisma.certification.deleteMany({ where: { username } }));
      if (certifications.length > 0) {
        const cData: Prisma.CertificationCreateManyInput[] = certifications.map(
          (cert: any) => {
            const record: Prisma.CertificationCreateManyInput = {
              name: cert.name,
              issuingAuthority: cert.issuingAuthority,
              licenseNumber: cert.licenseNumber || null,
              username,
            };
            // If issueDate is required, fallback to new Date()
            if (typeof cert.issueDate !== "undefined" && cert.issueDate !== null) {
              record.issueDate = new Date(cert.issueDate);
            }
            // If expiryDate is optional, only add if present
            if (typeof cert.expiryDate !== "undefined" && cert.expiryDate !== null) {
              record.expiryDate = new Date(cert.expiryDate);
            }
            return record;
          }
        );
        transactionOps.push(prisma.certification.createMany({ data: cData }));
      }
    }

    // 9E) Employee Documents
    if (documents && typeof documents === "object") {
      transactionOps.push(
        prisma.employeeDocument.deleteMany({ where: { userUsername: username } })
      );
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
              filename: doc.displayName || doc.fileName || "Untitled",
              fileType: doc.fileType || null,
              data: doc.fileData
                ? Buffer.from(doc.fileData, "base64")
                : Buffer.from([]),
              size: doc.size || 0,
              category: mappedCategory,
            };
          })
          .filter((doc) => doc !== null);
      });
      if (allDocs.length > 0) {
        transactionOps.push(prisma.employeeDocument.createMany({ data: allDocs }));
      }
    }

    // 9F) Emergency Contacts
    if (Array.isArray(emergencyContacts)) {
      transactionOps.push(
        prisma.emergencyContact.deleteMany({ where: { userUsername: username } })
      );
      if (emergencyContacts.length > 0) {
        const ecData = emergencyContacts.map((contact: any) => ({
          name: contact.name,
          relationship: contact.relationship,
          phoneNumber: contact.phoneNumber,
          email: contact.email,
          userUsername: username,
        }));
        transactionOps.push(prisma.emergencyContact.createMany({ data: ecData }));
      }
    }

    // 10) Run all DB operations in a single transaction
    await prisma.$transaction(transactionOps);

    // 11) Now, fetch the updated user
    const newUser = (await prisma.user.findUnique({
      where: { username },
      include: {
        qualifications: true,
        experiences: true,
        certifications: true,
        employeeDocuments: true,
        emergencyContacts: true,
        residentialAddress: true,
        permanentAddress: true,
      },
    })) as FullUser | null;

    if (!newUser) {
      return res.status(500).json({ message: "Could not re-fetch updated user." });
    }

    // 12) Build the diff
    const changedFields = buildChangesDiff(oldUser, newUser);
    const hasChanges = Object.keys(changedFields).length > 0 || resetPassword;

    if (!hasChanges) {
      return res.status(200).json({ message: "No changes detected." });
    }

    // 13) Create an audit log entry
    const auditLog = await prisma.auditLog.create({
      data: {
        action: "UPDATE_USER",
        performedBy: session.user.username,
        targetUsername: username,
        userUsername: username,
        details: JSON.stringify(changedFields, null, 2),
      },
    });

    // 14) Create notifications via your pivot-based service
    await createNotification({
      message: `User "${username}" was updated by ${session.user.username}`,
      roleTargets: ["ADMIN"], // Adjust roles if needed
      targetUrl: `/activity?highlightLog=${auditLog.id}`,
    });

    // 15) Respond success
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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb", // typical limit for Vercel free tier
    },
  },
};
