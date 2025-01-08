import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { sendEmail } from "@/lib/sendEmail";
import busboy from "busboy";
import {
  QualificationLevel,
  UserRole,
  Gender,
  BloodGroup,
  EmploymentType,
  DocumentCategory, // Import the enum directly
} from "@prisma/client";

// Disable default body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Utility Functions

/**
 * Generates a unique username based on the user's first name.
 * @param firstName - The user's first name.
 * @returns A unique username string.
 */
function generateUsername(firstName: string): string {
  const randomNumber = Math.floor(Math.random() * 90000) + 10000;
  const formattedFirstName = firstName.toLowerCase().replace(/\s+/g, "");
  return `${formattedFirstName}${randomNumber}`;
}

/**
 * Validates the format of an email address.
 * @param email - The email address to validate.
 * @returns A boolean indicating whether the email is valid.
 */
function validateEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
}

/**
 * Generates a secure random password.
 * @param length - The desired length of the password.
 * @returns A secure password string.
 */
function generateSecurePassword(length = 12): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

// Type Definitions

interface FormFields {
  firstName: string;
  middleName?: string;
  lastName: string;
  dob: string;
  phoneNumber: string;
  email: string;
  residentialAddress: string;
  permanentAddress: string;
  nationality: string;
  gender: string;
  bloodGroup: string;
  role: string;
  department: string;
  position: string;
  workLocation: string;
  employmentType: string;
  joiningDate: string;
  emergencyContacts: string;
  qualifications: string;
  experiences: string;
  certifications: string;
  profileImageUrl: string;
  avatarImageUrl: string;

  // Dynamic keys for documents
  [key: `documentName[${number}]`]: string | undefined;
  [key: `documentCategory[${number}]`]: string | undefined; // For category
}

interface FileEntry {
  filename: string;
  buffer: Buffer;
}

// Main Handler Function

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  // Authentication Check
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== "HR") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Method Check
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // Initialize Busboy
  const bb = busboy({
    headers: req.headers,
    limits: { files: 10, fileSize: 50 * 1024 * 1024 }, // 50MB per file
  });

  const fields: Partial<FormFields> = {};
  const files: {
    file: FileEntry;
    customName?: string;
    category?: DocumentCategory;
  }[] = [];

  /**
   * Parses the incoming form data using Busboy.
   * @returns A promise that resolves when parsing is complete.
   */
  const parseForm = () =>
    new Promise<void>((resolve, reject) => {
      // Handle non-file fields
      bb.on("field", (name, val) => {
        fields[name as keyof FormFields] = val;
      });

      // Handle file uploads
      bb.on("file", (name, file, info) => {
        const { filename, mimeType } = info;
        const allowedFileTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/jpeg",
          "image/png",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/plain",
          "text/csv",
        ];

        if (!allowedFileTypes.includes(mimeType)) {
          file.resume(); // Discard the file
          return reject(new Error(`Invalid file type: ${mimeType}`));
        }

        const fileBuffers: Buffer[] = [];

        file.on("data", (data: Buffer) => {
          fileBuffers.push(data);
        });

        file.on("end", () => {
          const buffer = Buffer.concat(fileBuffers);
          files.push({ file: { filename, buffer } });
        });

        file.on("error", (err) => {
          console.error("File stream error:", err);
          reject(new Error("File upload error"));
        });
      });

      // Handle parsing errors
      bb.on("error", (err) => {
        console.error("Busboy error:", err);
        reject(err);
      });

      // After parsing all fields and files
      bb.on("finish", () => {
        files.forEach((fileObj, index) => {
          // Assign custom name if provided
          const customNameField = `documentName[${index}]` as keyof FormFields;
          if (fields.hasOwnProperty(customNameField)) {
            fileObj.customName = fields[customNameField];
          }

          // Assign category if provided and valid
          const categoryField = `documentCategory[${index}]` as keyof FormFields;
          if (fields.hasOwnProperty(categoryField)) {
            const categoryVal = (fields[categoryField] || "").toLowerCase() as DocumentCategory;
            if (Object.values(DocumentCategory).includes(categoryVal)) {
              fileObj.category = categoryVal;
            } else {
              console.warn(
                `Invalid category provided: ${fields[categoryField]}. Defaulting to "others".`
              );
              fileObj.category = DocumentCategory.others; // Default to 'others'
            }
          } else {
            // If category not provided, default to 'others'
            fileObj.category = DocumentCategory.others;
          }
        });
        resolve();
      });

      req.pipe(bb);
    });

  try {
    // Parse the incoming form data
    await parseForm();

    // Destructure form fields
    const {
      firstName,
      middleName,
      lastName,
      email,
      phoneNumber,
      role,
      dob,
      residentialAddress,
      permanentAddress,
      department,
      position,
      nationality,
      gender,
      bloodGroup,
      workLocation,
      employmentType,
      joiningDate,
      emergencyContacts,
      qualifications,
      experiences,
      certifications,
      profileImageUrl,
      avatarImageUrl,
    } = fields;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phoneNumber ||
      !role ||
      !department ||
      !position
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Helper function to safely parse JSON arrays
    const safeJsonParse = <T>(str: string | undefined): T[] => {
      if (!str) return [];
      try {
        return JSON.parse(str) as T[];
      } catch (e) {
        console.error("JSON parse error:", e);
        return [];
      }
    };

    // Parse arrays
    const parsedEmergencyContacts = safeJsonParse<any>(emergencyContacts);
    const parsedQualifications = safeJsonParse<any>(qualifications).map(
      (q: any) => ({
        name: q.name || "",
        level: q.level as QualificationLevel,
        specializations: q.specializations || [],
        institution: q.institution || "",
      })
    );
    const parsedExperiences = safeJsonParse<any>(experiences);
    const parsedCertifications = safeJsonParse<any>(certifications);

    // Validate email format
    if (!validateEmail(email as string)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    try {
      // Generate username and password
      const username = generateUsername(firstName as string);
      const generatedPassword = generateSecurePassword();
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      // Validate enumerations
      const validRoles: UserRole[] = ["HR", "EMPLOYEE"];
      if (!validRoles.includes(role as UserRole)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const validGenders: Gender[] = ["M", "F", "Other"];
      if (!validGenders.includes(gender as Gender)) {
        return res.status(400).json({ message: "Invalid gender" });
      }

      const validBloodGroups: BloodGroup[] = [
        "A_POSITIVE",
        "B_POSITIVE",
        "AB_POSITIVE",
        "O_POSITIVE",
        "A_NEGATIVE",
        "B_NEGATIVE",
        "AB_NEGATIVE",
        "O_NEGATIVE",
      ];
      if (!validBloodGroups.includes(bloodGroup as BloodGroup)) {
        return res.status(400).json({ message: "Invalid blood group" });
      }

      const validEmploymentTypes: EmploymentType[] = [
        "FULL_TIME",
        "PART_TIME",
        "CONTRACT",
      ];
      if (!validEmploymentTypes.includes(employmentType as EmploymentType)) {
        return res.status(400).json({ message: "Invalid employment type" });
      }

      // Create the new user
      const newUser = await prisma.user.create({
        data: {
          username,
          firstName: firstName as string,
          middleName: middleName,
          lastName: lastName as string,
          password: hashedPassword,
          email: email as string,
          phoneNumber: phoneNumber as string,
          leaveBalance: 28,
          role: role as UserRole,
          gender: gender as Gender,
          bloodGroup: bloodGroup as BloodGroup,
          employmentType: employmentType as EmploymentType,
          dob: dob ? new Date(dob as string) : null,
          residentialAddress: residentialAddress as string,
          permanentAddress: permanentAddress as string,
          department: department as string,
          position: position as string,
          nationality: nationality as string,
          workLocation: workLocation as string,
          joiningDate: joiningDate ? new Date(joiningDate as string) : null,
          profileImageUrl: profileImageUrl as string,
          avatarImageUrl: avatarImageUrl as string,
        },
      });

      // Create emergency contacts
      if (parsedEmergencyContacts.length > 0) {
        await prisma.emergencyContact.createMany({
          data: parsedEmergencyContacts.map((ec) => ({
            name: ec.name,
            relationship: ec.relationship,
            phoneNumber: ec.phoneNumber,
            email: ec.email,
            userUsername: newUser.username,
          })),
        });
      }

      // Create qualifications
      if (parsedQualifications.length > 0) {
        await prisma.qualification.createMany({
          data: parsedQualifications.map((q) => ({
            name: q.name,
            level: q.level,
            specializations: q.specializations || [],
            institution: q.institution,
            username: newUser.username,
          })),
        });
      }

      // Create experiences
      if (parsedExperiences.length > 0) {
        await prisma.experience.createMany({
          data: parsedExperiences.map((exp) => {
            const experienceData: any = {
              jobTitle: exp.jobTitle,
              company: exp.company,
              description: exp.description,
              username: newUser.username,
            };
            if (exp.startDate) {
              experienceData.startDate = new Date(exp.startDate);
            }
            if (exp.endDate) {
              experienceData.endDate = new Date(exp.endDate);
            }
            return experienceData;
          }),
        });
      }

      // Create certifications
      if (parsedCertifications.length > 0) {
        await prisma.certification.createMany({
          data: parsedCertifications.map((cert) => ({
            name: cert.name,
            issuingAuthority: cert.issuingAuthority,
            licenseNumber: cert.licenseNumber,
            issueDate: cert.issueDate ? new Date(cert.issueDate) : undefined,
            expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined,
            username: newUser.username,
          })),
        });
      }

      // Handle file uploads (EmployeeDocuments), including category
      if (files.length > 0) {
        const employeeDocumentsData = files.map((fileObj) => ({
          filename: fileObj.customName || fileObj.file.filename,
          data: fileObj.file.buffer,
          size: fileObj.file.buffer.length,
          userUsername: newUser.username,
          category: fileObj.category, // Assign category here
        }));

        await prisma.employeeDocument.createMany({
          data: employeeDocumentsData,
        });
      }

      // Send email with credentials
      await sendEmail(email as string, username, generatedPassword);

      return res.status(200).json({ username: newUser.username });
    } catch (error: any) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          const target = error.meta?.target;
          const field = Array.isArray(target) ? target.join(", ") : target;
          return res.status(409).json({ message: `The ${field} is already in use.` });
        }
      }
      console.error("Failed to create user:", error);
      return res.status(500).json({ message: "Failed to create user" });
    }
  } catch (error: any) {
    console.error("Error parsing form:", error);
    return res.status(400).json({ message: error.message || "Invalid form data" });
  }
}
