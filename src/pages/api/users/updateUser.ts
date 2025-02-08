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
  EmergencyContact,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import sendUpdateEmail from "@/lib/sendUserUpdateEmail";  // Make sure this sends credentials
import logger from "@/lib/logger";
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

interface FullUser extends PrismaUser {
  qualifications: Qualification[];
  experiences: Experience[];
  certifications: Certification[];
  emergencyContacts: EmergencyContact[];
  residentialAddress: Address | null;
  permanentAddress: Address | null;
}

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

    function simplifyRecord(obj: any) {
      const { id, dateCreated, ...rest } = obj;
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
  compareArray("emergencyContacts");

  return changedFields;
}

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as string)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

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
      emergencyContacts,
      profileImageUrl,
      nationality,
      resetPassword,
    } = req.body;

    if (!username || !firstName || !lastName || !email || !role) {
      return res.status(400).json({ message: "Missing mandatory fields." });
    }

    // Validate enumerations
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

    // Fetch old user data
    const oldUser = (await prisma.user.findUnique({
      where: { username },
      include: {
        qualifications: true,
        experiences: true,
        certifications: true,
        emergencyContacts: true,
        residentialAddress: true,
        permanentAddress: true,
      },
    })) as FullUser | null;

    if (!oldUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Build updates
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

    // Detect if the email has changed
    const emailChanged = oldUser.email !== email;

    //
    // Handle password logic + sending update emails
    //
    if (password) {
      // If the user explicitly provided a new password
      dataToUpdate.password = await bcrypt.hash(password, 10);
      // If email is also being changed, we can notify the user at the new email with that same password
      if (emailChanged) {
        sendUpdateEmail(email, username, password).catch((err) =>
          logger.error(`Failed to send email change credentials:`, err)
        );
      }
    } else if (resetPassword || emailChanged) {
      // If user requested a reset OR user’s email changed, generate a new password
      const newPassword = crypto.randomBytes(12).toString("hex");
      dataToUpdate.password = await bcrypt.hash(newPassword, 10);
      sendUpdateEmail(email, username, newPassword).catch((err) =>
        logger.error(`Failed to send password reset email:`, err)
      );
    }

    // Convert date strings
    if (dob) dataToUpdate.dob = new Date(dob);
    if (joiningDate !== undefined && joiningDate !== null) {
      dataToUpdate.joiningDate = new Date(joiningDate);
    }

    // Addresses
    const parsedResidential =
      residentialAddress && typeof residentialAddress === "object"
        ? residentialAddress
        : null;
    const parsedPermanent =
      permanentAddress && typeof permanentAddress === "object"
        ? permanentAddress
        : null;

    const transactionOps: any[] = [];

    // Update user
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

    // Qualifications
    if (Array.isArray(qualifications)) {
      transactionOps.push(prisma.qualification.deleteMany({ where: { username } }));
      if (qualifications.length > 0) {
        const qData: Prisma.QualificationCreateManyInput[] = qualifications.map(
          (qual: any) => {
            const record: Prisma.QualificationCreateManyInput = {
              name: qual.name,
              level: qual.level,
              specializations: qual.specializations || [],
              institution: qual.institution || null,
              username,
            };
            if (qual.startDate) record.startDate = new Date(qual.startDate);
            if (qual.endDate) record.endDate = new Date(qual.endDate);
            return record;
          }
        );
        transactionOps.push(prisma.qualification.createMany({ data: qData }));
      }
    }

    // Experiences
    if (Array.isArray(experiences)) {
      transactionOps.push(prisma.experience.deleteMany({ where: { username } }));
      if (experiences.length > 0) {
        // since startDate is required, must always provide it
        const eData: Prisma.ExperienceCreateManyInput[] = experiences.map(
          (exp: any) => {
            const record: Prisma.ExperienceCreateManyInput = {
              jobTitle: exp.jobTitle,
              company: exp.company,
              description: exp.description,
              username,
              // fallback if missing
              startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
            };
            if (exp.endDate) {
              record.endDate = new Date(exp.endDate);
            }
            return record;
          }
        );
        transactionOps.push(prisma.experience.createMany({ data: eData }));
      }
    }

    // Certifications
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
            if (cert.issueDate) {
              record.issueDate = new Date(cert.issueDate);
            }
            if (cert.expiryDate) {
              record.expiryDate = new Date(cert.expiryDate);
            }
            return record;
          }
        );
        transactionOps.push(prisma.certification.createMany({ data: cData }));
      }
    }

    // Emergency Contacts
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

    // Run transaction
    await prisma.$transaction(transactionOps);

    // Re-fetch updated user
    const newUser = (await prisma.user.findUnique({
      where: { username },
      include: {
        qualifications: true,
        experiences: true,
        certifications: true,
        emergencyContacts: true,
        residentialAddress: true,
        permanentAddress: true,
      },
    })) as FullUser | null;

    if (!newUser) {
      return res.status(500).json({ message: "Could not re-fetch updated user." });
    }

    // Build diff
    const changedFields = buildChangesDiff(oldUser, newUser);
    const hasChanges = Object.keys(changedFields).length > 0 || resetPassword || emailChanged;
    if (!hasChanges) {
      return res.status(200).json({ message: "No changes detected." });
    }

    // Audit log
    const auditLog = await prisma.auditLog.create({
      data: {
        action: "UPDATE_USER",
        performedBy: session.user.username,
        targetUsername: username,
        userUsername: username,
        details: JSON.stringify(changedFields, null, 2),
      },
    });

    // Notification
    await createNotification({
      message: `User "${username}" was updated by ${session.user.username}`,
      roleTargets: ["ADMIN"],
      targetUrl: `/activity?highlightLog=${auditLog.id}`,
    });

    return res.status(200).json({
      message: "User updated successfully",
      resetPassword: resetPassword || emailChanged
        ? "A credentials email was sent."
        : undefined,
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
      sizeLimit: "4mb",
    },
  },
};
