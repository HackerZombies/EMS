// src/pages/api/users/updateProfileImage.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, File as FormidableFile, Files } from "formidable";
import path from "path";
import fs from "fs/promises"; // Using promises for async operations
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// Disable the default body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure the uploads directory exists
const uploadDir = path.join(process.cwd(), "public", "uploads");
fs.access(uploadDir).catch(async () => {
  await fs.mkdir(uploadDir, { recursive: true });
});

// Define expected fields interface
interface UpdateProfileImageFields {
  avatarImageUrl?: string; // For handling image deletion if needed
}

// Type guard to validate fields
function isValidUpdateProfileImageFields(fields: any): fields is UpdateProfileImageFields {
  return (
    typeof fields === "object" &&
    fields !== null &&
    (typeof fields.avatarImageUrl === "string" || fields.avatarImageUrl === undefined)
  );
}

// Helper function to parse the incoming form
const parseForm = async (
  req: NextApiRequest
): Promise<{ fields: UpdateProfileImageFields; files: Files }> => {
  const form = new IncomingForm({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5 MB
    multiples: false, // Single file upload
    filename: (name, ext, part, form) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      return uniqueSuffix + path.extname(part.originalFilename || "");
    },
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }

      // Normalize fields: ensure each field is a string, not an array
      const normalizedFields: any = {};
      for (const key in fields) {
        if (Array.isArray(fields[key])) {
          normalizedFields[key] = fields[key][0];
        } else {
          normalizedFields[key] = fields[key];
        }
      }

      // Use the type guard to ensure fields are of type UpdateProfileImageFields
      if (!isValidUpdateProfileImageFields(normalizedFields)) {
        reject(new Error("Invalid form data."));
        return;
      }

      resolve({ fields: normalizedFields, files });
    });
  });
};

// API Route Handler
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Validate session
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const username = session.user?.username;
    if (!username) {
      return res.status(400).json({ message: "Invalid session data: Username missing." });
    }

    // Parse the incoming form data
    const { fields, files } = await parseForm(req);

    // Extract avatar image data
    const { avatarImageUrl } = fields;

    // Handle file upload
    let newAvatarImageUrl: string | null = null;
    if (files.file) {
      let file: FormidableFile;

      if (Array.isArray(files.file)) {
        // This should not happen since multiples: false, but handle just in case
        file = files.file[0];
      } else {
        file = files.file;
      }

      // Validate file type
      if (!file.mimetype?.startsWith("image/")) {
        // Remove the uploaded file since it's not an image
        await fs.unlink(file.filepath);
        return res.status(400).json({ message: "Only image files are allowed!" });
      }

      newAvatarImageUrl = `/uploads/${path.basename(file.filepath)}`;

      // Fetch the current user to get the old avatar image path
      const currentUser = await prisma.user.findUnique({
        where: { username },
      });

      if (
        currentUser &&
        currentUser.avatarImageUrl &&
        currentUser.avatarImageUrl !== "/default-avatar.png"
      ) {
        const oldImagePath = path.join(process.cwd(), "public", currentUser.avatarImageUrl);
        try {
          await fs.unlink(oldImagePath);
          console.log("Old image deleted:", oldImagePath);
        } catch (err) {
          console.error("Failed to delete old image:", err);
        }
      }
    }

    // Handle avatar image removal
    let avatarImageUrlToUpdate: string | null = null;
    if (avatarImageUrl === "") {
      avatarImageUrlToUpdate = "/default-avatar.png";

      // Fetch the current user to get the old avatar image path
      const currentUser = await prisma.user.findUnique({
        where: { username },
      });

      if (
        currentUser &&
        currentUser.avatarImageUrl &&
        currentUser.avatarImageUrl !== "/default-avatar.png"
      ) {
        const oldImagePath = path.join(process.cwd(), "public", currentUser.avatarImageUrl);
        try {
          await fs.unlink(oldImagePath);
          console.log("Old image deleted:", oldImagePath);
        } catch (err) {
          console.error("Failed to delete old image:", err);
        }
      }
    }

    // Prepare data to update
    const dataToUpdate: {
      avatarImageUrl?: string;
    } = {};

    if (newAvatarImageUrl) {
      dataToUpdate.avatarImageUrl = newAvatarImageUrl;
    } else if (avatarImageUrlToUpdate) {
      dataToUpdate.avatarImageUrl = avatarImageUrlToUpdate;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ message: "No image to update." });
    }

    // Update user in the database
    const updatedUser = await prisma.user.update({
      where: { username },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        avatarImageUrl: true,
        // Add other non-sensitive fields you want to return
      },
    });

    return res.status(200).json({
      message: "Profile image updated successfully.",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("API Route Error:", error);

    // Handle Prisma errors
    if (error instanceof PrismaClientKnownRequestError) {
      return res.status(409).json({ message: "Failed to update profile image." });
    }

    // Handle formidable errors based on their properties
    if (error && typeof error === "object" && "code" in error) {
      const errCode = (error as any).code;
      if (errCode === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File size exceeds the 5MB limit." });
      }
      // Add more formidable error codes handling if needed
    }

    // Handle custom errors
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error." });
  }
};

export default handler;
