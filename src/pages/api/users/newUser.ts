import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
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
  DocumentCategory,
  WorkLocation,
  Department,
  Position,
  // MaritalStatus,
} from "@prisma/client";

// Disable default body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

// ─────────────────────────────────────────────────────────────
// 1. Type Definitions
// ─────────────────────────────────────────────────────────────

interface FormFields {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dob?: string;
  phoneNumber?: string;
  email?: string;
  residentialAddress?: string; // Will parse this into JSON
  permanentAddress?: string; // Will parse this into JSON
  nationality?: string;
  gender?: string;
  bloodGroup?: string;
  role?: string;
  department?: string;
  position?: string;
  workLocation?: string;
  employmentType?: string;
  joiningDate?: string;
  emergencyContacts?: string;
  qualifications?: string;
  experiences?: string;
  certifications?: string;
  profileImageUrl?: string;
  avatarImageUrl?: string;
  [key: string]: any;
}

interface FileEntry {
  filename: string;
  buffer: Buffer;
}

interface DocumentUpload {
  file?: FileEntry;
  displayName?: string;
  category: DocumentCategory;
}

// For storing to Prisma.employeeDocument
interface EmployeeDocumentData {
  filename: string;
  data: Buffer;
  size: number;
  userUsername: string;
  category: DocumentCategory;
}

// ─────────────────────────────────────────────────────────────
// 2. More Specific Interfaces for JSON data
// ─────────────────────────────────────────────────────────────

/** Emergency Contact JSON shape */
interface EmergencyContactInput {
  name?: string;
  relationship?: string;
  phoneNumber?: string;
  email?: string;
}

/** Qualification JSON shape */
interface QualificationInput {
  name?: string;
  level?: QualificationLevel; // Schooling, Graduate, Masters, Doctorate, Other
  specializations?: string[];
  institution?: string;
  startDate?: string;
  endDate?: string;
}

/** Experience JSON shape */
interface ExperienceInput {
  jobTitle?: string;
  company?: string;
  description?: string;
  startDate?: string; // required by DB
  endDate?: string;
}

/** Certification JSON shape */
interface CertificationInput {
  name?: string;
  issuingAuthority?: string;
  licenseNumber?: string;
  issueDate?: string;
  expiryDate?: string;
}

// ─────────────────────────────────────────────────────────────
// 3. Utility Functions
// ─────────────────────────────────────────────────────────────

function generateUsername(firstName: string): string {
  const randomNumber = Math.floor(Math.random() * 90000) + 10000;
  const formattedFirstName = firstName.toLowerCase().replace(/\s+/g, "");
  return `${formattedFirstName}${randomNumber}`;
}

function validateEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
}

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

// A helper to parse arrays from JSON
function safeJsonParse<T>(str: string | undefined): T[] {
  if (!str) return [];
  try {
    return JSON.parse(str) as T[];
  } catch (e) {
    console.error("JSON parse error:", e);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// 4. The Main Handler
// ─────────────────────────────────────────────────────────────

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  // 1) Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // 2) Check method
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // 3) Initialize Busboy
  const bb = busboy({
    headers: req.headers,
    limits: {
      files: 100, // up to 100 files
      fileSize: 200 * 1024 * 1024, // 200MB per file
    },
  });

  // 4) Storage for fields & documents
  const fields: FormFields = {};
  const documentsMap: Record<string, Record<number, DocumentUpload>> = {};

  // 5) Parse form
  const parseForm = () =>
    new Promise<void>((resolve, reject) => {
      // Handle text fields
      bb.on("field", (fieldname, value) => {
        // e.g. "documents[resume][0][displayName]" or "firstName"
        const docMatch = fieldname.match(
          /^documents\[(.+?)\]\[(\d+)\]\[(.+?)\]$/
        );
        if (docMatch) {
          const [_, docCategory, docIndexStr, docField] = docMatch;
          const docIndex = parseInt(docIndexStr, 10);
          if (!documentsMap[docCategory]) {
            documentsMap[docCategory] = {};
          }
          if (!documentsMap[docCategory][docIndex]) {
            documentsMap[docCategory][docIndex] = {
              category: Object.values(DocumentCategory).includes(
                docCategory as DocumentCategory
              )
                ? (docCategory as DocumentCategory)
                : DocumentCategory.others,
            };
          }

          // If this is "displayName" or "category"
          if (docField === "displayName") {
            documentsMap[docCategory][docIndex].displayName = value;
          } else if (docField === "category") {
            documentsMap[docCategory][docIndex].category = Object.values(
              DocumentCategory
            ).includes(value as DocumentCategory)
              ? (value as DocumentCategory)
              : DocumentCategory.others;
          }
        } else {
          // Normal field
          fields[fieldname] = value;
        }
      });

      // Handle files
      bb.on("file", (fieldname, file, info) => {
        // fieldname = "documents[resume][0][file]"
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
          file.resume(); // discard
          return reject(new Error(`Invalid file type: ${mimeType}`));
        }

        const docMatch = fieldname.match(
          /^documents\[(.+?)\]\[(\d+)\]\[file\]$/
        );
        if (!docMatch) {
          file.resume(); // skip
          return;
        }

        const [_, docCategory, docIndexStr] = docMatch;
        const docIndex = parseInt(docIndexStr, 10);

        if (!documentsMap[docCategory]) {
          documentsMap[docCategory] = {};
        }
        if (!documentsMap[docCategory][docIndex]) {
          documentsMap[docCategory][docIndex] = {
            category: Object.values(DocumentCategory).includes(
              docCategory as DocumentCategory
            )
              ? (docCategory as DocumentCategory)
              : DocumentCategory.others,
          };
        }

        // Accumulate file buffers
        const fileBuffers: Buffer[] = [];
        file.on("data", (data: Buffer) => fileBuffers.push(data));
        file.on("error", (err) => {
          console.error("File stream error:", err);
          reject(err);
        });
        file.on("end", () => {
          const buffer = Buffer.concat(fileBuffers);
          documentsMap[docCategory][docIndex].file = {
            filename,
            buffer,
          };
        });
      });

      // Busboy error
      bb.on("error", (err) => {
        console.error("Busboy error:", err);
        reject(err);
      });

      // All done
      bb.on("finish", () => {
        resolve();
      });

      req.pipe(bb);
    });

  // 6) Try parsing and process the data
  try {
    await parseForm();

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

    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Parse addresses from JSON strings
    let parsedResidentialAddress = {};
    let parsedPermanentAddress = {};
    try {
      if (residentialAddress) {
        parsedResidentialAddress = JSON.parse(residentialAddress);
      }
      if (permanentAddress) {
        parsedPermanentAddress = JSON.parse(permanentAddress);
      }
    } catch (parseErr) {
      return res.status(400).json({
        message: "Invalid JSON for residential/permanent address fields",
      });
    }

    // Parse arrays
    const parsedEmergencyContacts = safeJsonParse<EmergencyContactInput>(
      emergencyContacts
    );
    const parsedQualifications = safeJsonParse<QualificationInput>(qualifications);
    const parsedExperiences = safeJsonParse<ExperienceInput>(experiences);
    const parsedCertifications = safeJsonParse<CertificationInput>(certifications);

    // Generate username & hashed password
    const username = generateUsername(firstName);
    const generatedPassword = generateSecurePassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Validate enumerations
    const validRoles: UserRole[] = ["ADMIN", "HR", "EMPLOYEE"];
    if (!validRoles.includes(role as UserRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const validGenders: Gender[] = ["M", "F", "Other"];
    if (gender && !validGenders.includes(gender as Gender)) {
      return res.status(400).json({ message: "Invalid gender" });
    }

    const validBloodGroups: BloodGroup[] = [
      "A_POSITIVE",
      "A_NEGATIVE",
      "B_POSITIVE",
      "B_NEGATIVE",
      "AB_POSITIVE",
      "AB_NEGATIVE",
      "O_POSITIVE",
      "O_NEGATIVE",
      "UNKNOWN",
    ];
    if (bloodGroup && !validBloodGroups.includes(bloodGroup as BloodGroup)) {
      return res.status(400).json({ message: "Invalid blood group" });
    }

    const validEmploymentTypes: EmploymentType[] = [
      "FULL_TIME",
      "PART_TIME",
      "CONTRACT",
      "INTERN",
      "OTHER",
    ];
    if (
      employmentType &&
      !validEmploymentTypes.includes(employmentType as EmploymentType)
    ) {
      return res.status(400).json({ message: "Invalid employment type" });
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

    // Create the user in DB with nested address creation
    const newUser = await prisma.user.create({
      data: {
        username,
        firstName,
        middleName,
        lastName,
        password: hashedPassword,
        email,
        phoneNumber,
        leaveBalance: 28,
        role: role as UserRole,
        gender: gender ? (gender as Gender) : undefined,
        bloodGroup: bloodGroup ? (bloodGroup as BloodGroup) : undefined,
        employmentType: employmentType
          ? (employmentType as EmploymentType)
          : undefined,
        dob: dob ? new Date(dob) : undefined,

        // Nested create for address models
        residentialAddress: {
          create: parsedResidentialAddress as {
            flat?: string;
            street?: string;
            landmark?: string;
            city?: string;
            district?: string;
            state?: string;
            pin?: string;
          },
        },
        permanentAddress: {
          create: parsedPermanentAddress as {
            flat?: string;
            street?: string;
            landmark?: string;
            city?: string;
            district?: string;
            state?: string;
            pin?: string;
          },
        },

        department: department ? (department as Department) : undefined,
        position: position ? (position as Position) : undefined,
        nationality,
        workLocation: workLocation ? (workLocation as WorkLocation) : undefined,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
        profileImageUrl: profileImageUrl || "",
        avatarImageUrl: avatarImageUrl || "",
      },
    });

    // Create emergency contacts
    if (parsedEmergencyContacts.length > 0) {
      await prisma.emergencyContact.createMany({
        data: parsedEmergencyContacts.map((ec) => ({
          name: ec.name || "",
          relationship: ec.relationship || "",
          phoneNumber: ec.phoneNumber || "",
          email: ec.email || "",
          userUsername: newUser.username,
        })),
      });
    }

    // Create qualifications
    if (parsedQualifications.length > 0) {
      await prisma.qualification.createMany({
        data: parsedQualifications.map((q) => ({
          name: q.name || "",
          level: q.level ?? QualificationLevel.Other,
          specializations: q.specializations ?? [],
          institution: q.institution ?? "",
          username: newUser.username,
          startDate: q.startDate ? new Date(q.startDate) : null,
          endDate: q.endDate ? new Date(q.endDate) : null,
        })),
      });
    }

    // Create experiences
    if (parsedExperiences.length > 0) {
      // The 'startDate' is required in DB, so check
      for (const exp of parsedExperiences) {
        if (!exp.startDate) {
          return res
            .status(400)
            .json({ message: "Experience startDate is required." });
        }
      }

      await prisma.experience.createMany({
        data: parsedExperiences.map((exp) => ({
          jobTitle: exp.jobTitle || "",
          company: exp.company || "",
          startDate: new Date(exp.startDate as string),
          endDate: exp.endDate ? new Date(exp.endDate) : null,
          description: exp.description || "",
          username: newUser.username,
        })),
      });
    }

    // Create certifications
    if (parsedCertifications.length > 0) {
      await prisma.certification.createMany({
        data: parsedCertifications.map((cert) => ({
          name: cert.name || "",
          issuingAuthority: cert.issuingAuthority || "",
          licenseNumber: cert.licenseNumber || "",
          issueDate: cert.issueDate ? new Date(cert.issueDate) : null,
          expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : null,
          username: newUser.username,
        })),
      });
    }

    // Create documents
    const docsToCreate: EmployeeDocumentData[] = [];
    for (const cat of Object.keys(documentsMap)) {
      const docIndices = Object.keys(documentsMap[cat]);
      for (const idxStr of docIndices) {
        const idx = parseInt(idxStr, 10);
        const docObj = documentsMap[cat][idx];
        if (!docObj.file) continue; // no file
        const category = docObj.category || DocumentCategory.others;

        docsToCreate.push({
          filename: docObj.displayName || docObj.file.filename,
          data: docObj.file.buffer,
          size: docObj.file.buffer.length,
          userUsername: newUser.username,
          category,
        });
      }
    }
    if (docsToCreate.length > 0) {
      await prisma.employeeDocument.createMany({
        data: docsToCreate,
      });
    }

    // Send email with credentials
    await sendEmail(email, username, generatedPassword);

    return res.status(200).json({ username: newUser.username });
  } catch (error: any) {
    // Handle Prisma unique constraint errors
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = error.meta?.target;
        const field = Array.isArray(target) ? target.join(", ") : target;
        return res
          .status(409)
          .json({ message: `The ${field} is already in use.` });
      }
    }
    console.error("Failed to create user:", error);
    return res.status(500).json({ message: "Failed to create user" });
  }
}
