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
  DocumentCategory,
  WorkLocation,
  Department,
  Position
} from "@prisma/client";

// Disable default body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Utility Functions

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

// Type Definitions

interface FormFields {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dob?: string;
  phoneNumber?: string;
  email?: string;
  residentialAddress?: string;
  permanentAddress?: string;
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
  [key: string]: any; // allow indexing
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

interface EmployeeDocumentData {
  filename: string;
  data: Buffer;
  size: number;
  userUsername: string;
  category: DocumentCategory;
}

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  // Authentication Check
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Method Check
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // Initialize Busboy with higher file-size limits (e.g., 200MB)
  const bb = busboy({
    headers: req.headers,
    limits: {
      files: 100,             // up to 100 files
      fileSize: 200 * 1024 * 1024, // 200MB per file
    },
  });

  // We'll store all non-file fields here
  const fields: FormFields = {};

  // We'll store each uploaded document in a structure keyed by:
  //   documents[<categoryName>][<index>]
  //
  // Example:
  //   documents[resume][0][file], documents[resume][0][displayName], etc.
  //
  // The data shape is:
  //   documentsMap[categoryName][index] = { file, displayName, category }
  //
  const documentsMap: Record<
    string,
    Record<number, DocumentUpload>
  > = {};

  /**
   * Parse form using Busboy
   */
  const parseForm = () =>
    new Promise<void>((resolve, reject) => {
      // Handle text fields
      bb.on("field", (fieldname, value) => {
        // e.g. fieldname = "documents[resume][0][displayName]"
        // or a normal field like "firstName", "lastName", etc.
        const docMatch = fieldname.match(/^documents\[(.+?)\]\[(\d+)\]\[(.+?)\]$/);
        if (docMatch) {
          const [_, docCategory, docIndexStr, docField] = docMatch;
          const docIndex = parseInt(docIndexStr, 10);
          if (!documentsMap[docCategory]) {
            documentsMap[docCategory] = {};
          }
          if (!documentsMap[docCategory][docIndex]) {
            documentsMap[docCategory][docIndex] = {
              category: (Object.values(DocumentCategory).includes(docCategory as DocumentCategory)
                ? (docCategory as DocumentCategory)
                : DocumentCategory.others),
            };
          }

          // If this is "displayName", store it; if it is "category", we can override
          // the category if the user specifically wants to pass it. (Optional)
          if (docField === "displayName") {
            documentsMap[docCategory][docIndex].displayName = value;
          } else if (docField === "category") {
            // user might explicitly pass a category string as well
            documentsMap[docCategory][docIndex].category = (Object.values(DocumentCategory).includes(value as DocumentCategory)
              ? (value as DocumentCategory)
              : DocumentCategory.others);
          }
        } else {
          // Normal field
          fields[fieldname] = value;
        }
      });

      // Handle file uploads
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
          file.resume(); // Discard
          return reject(new Error(`Invalid file type: ${mimeType}`));
        }

        const docMatch = fieldname.match(/^documents\[(.+?)\]\[(\d+)\]\[file\]$/);
        if (!docMatch) {
          // If a file doesn't match our documents pattern, skip it
          file.resume();
          return;
        }

        const [_, docCategory, docIndexStr] = docMatch;
        const docIndex = parseInt(docIndexStr, 10);

        if (!documentsMap[docCategory]) {
          documentsMap[docCategory] = {};
        }
        if (!documentsMap[docCategory][docIndex]) {
          documentsMap[docCategory][docIndex] = {
            category: (Object.values(DocumentCategory).includes(docCategory as DocumentCategory)
              ? (docCategory as DocumentCategory)
              : DocumentCategory.others),
          };
        }

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

      bb.on("error", (err) => {
        console.error("Busboy error:", err);
        reject(err);
      });

      bb.on("finish", () => {
        resolve();
      });

      req.pipe(bb);
    });

  try {
    await parseForm();

    // Now we have all fields in `fields` and all documents in `documentsMap`
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

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
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

    // Generate username and password
    const username = generateUsername(firstName);
    const generatedPassword = generateSecurePassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Validate enumerations
    const validRoles: UserRole[] = ["ADMIN", "HR", "EMPLOYEE"];
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

    const validPositions: Position[] = [
      Position.Software_Development_Engineer,
      Position.Embedded_Software_Development_Engineer,
      Position.Hardware_Engineer,
      Position.Chief_Technology_Officer,
      Position.Chief_Executive_Officer,
      Position.Project_Manager,
    ];
    if (!validPositions.includes(position as Position)) {
      return res.status(400).json({ message: "Invalid position" });
    }

    const validWorkLocations: WorkLocation[] = [
      WorkLocation.NaviMumbai,
      WorkLocation.Delhi,
      WorkLocation.Kochi,
      WorkLocation.Remote,
    ];
    if (!validWorkLocations.includes(workLocation as WorkLocation)) {
      return res.status(400).json({ message: "Invalid work location" });
    }

    const validDepartments: Department[] = [
      Department.Admin,
      Department.HR,
      Department.Software,
      Department.Hardware,
      Department.Production,
    ];
    if (!validDepartments.includes(department as Department)) {
      return res.status(400).json({ message: "Invalid department" });
    }

    // Create the user
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
        gender: gender as Gender,
        bloodGroup: bloodGroup as BloodGroup,
        employmentType: employmentType as EmploymentType,
        dob: dob ? new Date(dob) : null,
        residentialAddress,
        permanentAddress,
        department: department as Department,
        position: position as Position,
        nationality,
        workLocation: workLocation as WorkLocation,
        joiningDate: joiningDate ? new Date(joiningDate) : null,
        profileImageUrl: profileImageUrl || "",
        avatarImageUrl: avatarImageUrl || "",
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

    // Create EmployeeDocuments for each document in documentsMap
    // docsMap = {
    //   [categoryName]: {
    //       [index]: { file, displayName, category }
    //   }
    // }
    const docsToCreate: EmployeeDocumentData[] = [];

    for (const cat of Object.keys(documentsMap)) {
      const docIndices = Object.keys(documentsMap[cat]);
      for (const idxStr of docIndices) {
        const idx = parseInt(idxStr, 10);
        const docObj = documentsMap[cat][idx];

        // We have docObj.file, docObj.displayName, docObj.category
        if (!docObj.file) continue; // no actual file
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
