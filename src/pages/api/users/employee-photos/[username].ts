import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, File as FormidableFile, Files } from "formidable";
import path from "path";
import fs from "fs/promises";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), "public", "uploads");
fs.access(uploadDir).catch(async () => {
  await fs.mkdir(uploadDir, { recursive: true });
});

const parseForm = async (req: NextApiRequest): Promise<{ fields: any; files: Files }> => {
  const form = new IncomingForm({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024,
    multiples: false,
    filename: (name, ext, part) => {
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
      resolve({ fields, files });
    });
  });
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { username } = req.query;
    if (!username || typeof username !== "string") {
      return res.status(400).json({ message: "Username not provided or invalid." });
    }

    if (session.user?.username !== username) {
      return res.status(403).json({ message: "Forbidden: You cannot update another user's profile." });
    }

    const currentUser = await prisma.user.findUnique({ where: { username } });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const { fields, files } = await parseForm(req);

    let newProfileImageUrl: string | null = null;

    // Use 'files.image' since client sends under key 'image'
    if (files.image) {
      let file: FormidableFile;
      if (Array.isArray(files.image)) {
        file = files.image[0];
      } else {
        file = files.image;
      }

      if (!file.mimetype?.startsWith("image/")) {
        await fs.unlink(file.filepath);
        return res.status(400).json({ message: "Only image files are allowed!" });
      }

      newProfileImageUrl = `/uploads/${path.basename(file.filepath)}`;

      if (currentUser.profileImageUrl && currentUser.profileImageUrl !== "/default-avatar.png") {
        const oldImagePath = path.join(process.cwd(), "public", currentUser.profileImageUrl);
        try {
          await fs.unlink(oldImagePath);
          console.log("Old profile image deleted:", oldImagePath);
        } catch (err) {
          console.error("Failed to delete old profile image:", err);
        }
      }
    }

    if (!newProfileImageUrl) {
      return res.status(400).json({ message: "No image uploaded." });
    }

    const updatedUser = await prisma.user.update({
      where: { username },
      data: {
        profileImageUrl: newProfileImageUrl,
        
      },
      select: {
        profileImageUrl: true,
      },
    });

    return res.status(200).json({
      message: "Profile image updated successfully.",
      imageUrl: updatedUser.profileImageUrl,
    });
  } catch (error: any) {
    console.error("API Error:", error);

    if (error instanceof PrismaClientKnownRequestError) {
      return res.status(409).json({ message: "Failed to update profile image." });
    }

    if (error && typeof error === "object" && "code" in error) {
      const errCode = (error as any).code;
      if (errCode === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File size exceeds the 5MB limit." });
      }
    }

    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error." });
  }
};

export default handler;
