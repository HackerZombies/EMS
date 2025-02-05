// src/pages/api/announcements/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import formidable, { Fields, Files, File as FormidableFile } from "formidable";
import fs from "fs";

// 1) Import your updated createNotification
import { createNotification } from "@/services/notificationService";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function createAnnouncement(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const form = formidable({
    multiples: false,
    maxFileSize: 5 * 1024 * 1024,
  });

  try {
    form.parse(req, async (err: any, fields: Fields, files: Files) => {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(400).json({ message: "Error parsing form data" });
      }

      // 1) Convert pinned & archived
      function getFirstBoolean(val?: string | string[]): boolean {
        if (Array.isArray(val)) return val[0] === "true";
        return val === "true";
      }
      const pinnedBool = getFirstBoolean(fields.pinned);
      const archivedBool = getFirstBoolean(fields.archived);

      // 2) roleTargets: always an array of strings
      let rolesArray: string[] = [];
      if (fields.roleTargets) {
        if (Array.isArray(fields.roleTargets)) {
          rolesArray = fields.roleTargets.map(String);
        } else {
          rolesArray = [String(fields.roleTargets)];
        }
      }

      // 3) Handle the single file
      const fileVal = files.imageFile;
      let singleFile: FormidableFile | undefined;
      if (fileVal) {
        if (Array.isArray(fileVal) && fileVal.length > 0) {
          singleFile = fileVal[0] as FormidableFile;
        } else if (!Array.isArray(fileVal)) {
          singleFile = fileVal as FormidableFile;
        }
      }

      // 4) Upload to Cloudinary (optional)
      let imageUrl: string | undefined;
      if (singleFile?.filepath) {
        try {
          const fileData = fs.readFileSync(singleFile.filepath);
          const uploadResult = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "announcements",
                transformation: [{ fetch_format: "auto", quality: "auto" }],
              },
              (uploadErr, result) => {
                if (uploadErr) return reject(uploadErr);
                resolve(result);
              }
            );
            uploadStream.end(fileData);
          });

          imageUrl = uploadResult.secure_url;
        } catch (uploadErr) {
          console.error("Cloudinary upload error:", uploadErr);
          return res
            .status(400)
            .json({ message: "Error uploading image to Cloudinary" });
        }
      }

      // 5) Create Announcement in Prisma
      try {
        const newAnnouncement = await prisma.announcement.create({
          data: {
            title: String(fields.title || ""),
            text: String(fields.text || ""),
            pinned: pinnedBool,
            archived: archivedBool,
            imageUrl,
            roleTargets: { set: rolesArray }, // e.g. ["ADMIN", "EMPLOYEE"]
          },
        });

        // 6) Create notifications via your updated service
        let notificationRoles = rolesArray;
        // If the user chose "EVERYONE" or left roleTargets empty, assume all roles
        if (notificationRoles.includes("EVERYONE") || notificationRoles.length === 0) {
          notificationRoles = ["ADMIN", "HR", "EMPLOYEE"];
        }

        await createNotification({
          message: newAnnouncement.title,
          roleTargets: notificationRoles, // e.g. ["ADMIN","HR","EMPLOYEE"]
          targetUrl: `/announcements/${newAnnouncement.id}`,
        });

        return res.status(201).json(newAnnouncement);
      } catch (dbErr) {
        console.error("Prisma create error:", dbErr);
        return res.status(500).json({ message: "DB error" });
      }
    });
  } catch (e) {
    console.error("Unexpected error:", e);
    return res.status(500).json({ message: "Internal server error" });
  }
}
