// src/pages/api/users/employee-photos/[username].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

// We need a library like 'formidable' or 'multiparty' to parse FormData
import formidable from "formidable";
import fs from "fs";

// Disable the default Next.js body parser for this route
export const config = {
  api: {
    bodyParser: false, // Important for using formidable
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Parse the [username] param
  const { username } = req.query;

  // Validate username
  if (!username || Array.isArray(username)) {
    return res.status(400).json({ error: "Invalid username." });
  }

  try {
    switch (req.method) {
      case "GET":
        return handleGet(req, res, username);

      case "PUT":
        return handlePut(req, res, username);

      case "PATCH":
        return handlePatch(req, res, username);

      default:
        return res.status(405).json({ error: "Method Not Allowed" });
    }
  } catch (error: any) {
    console.error("API route error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// ------------------ GET ------------------
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  username: string
) {
  // Find the user in DB, return their stored profileImageUrl
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.profileImageUrl) {
    return res.status(404).json({ error: "No profile image found." });
  }

  return res.status(200).json({ profileImageUrl: user.profileImageUrl });
}

// ------------------ PUT ------------------
async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  username: string
) {
  // 1) Parse the multipart/form-data using formidable
  const { fields, files } = await parseForm(req);

  // 'files.image' can be a single file or an array of files.
  let imageFile = files.image as formidable.File | formidable.File[];

  if (!imageFile) {
    return res.status(400).json({ error: "Missing 'image' file in FormData." });
  }

  // If imageFile is an array, take the first item
  if (Array.isArray(imageFile)) {
    imageFile = imageFile[0];
  }

  const singleFile = imageFile as formidable.File;

  if (!singleFile.filepath) {
    return res.status(400).json({ error: "Invalid file data (no filepath)." });
  }

  // 2) Read the uploaded file from disk
  const fileData = fs.readFileSync(singleFile.filepath);
  if (!fileData) {
    return res.status(400).json({ error: "Could not read file data." });
  }

  // 3) Upload to Cloudinary with transformations
  //    - Crop to 300x300 square, focusing on face
  //    - Auto-optimize format & quality
  const uploadResult = await new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "my_app_profiles", // optional folder
        public_id: username,       // or any unique ID
        overwrite: true,
        transformation: [
          {
            width: 300,
            height: 300,
            crop: "fill",
            gravity: "face",
          },
          {
            fetch_format: "auto",
            quality: "auto",
          },
        ],
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    uploadStream.end(fileData);
  });

  // 4) Update user in DB with the new Cloudinary URL
  const updatedUser = await prisma.user.update({
    where: { username },
    data: { profileImageUrl: uploadResult.secure_url },
  });

  return res.status(200).json({ profileImageUrl: updatedUser.profileImageUrl });
}

// ------------------ PATCH ------------------
async function handlePatch(
  req: NextApiRequest,
  res: NextApiResponse,
  username: string
) {
  // The user's existing record
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.profileImageUrl) {
    return res.status(404).json({ error: "No existing image to patch." });
  }

  // For simplicity, parse JSON from the request body
  // (e.g., { "newPublicId": "bob-2025", "newTag": "employee" })
  const body = await getJsonBody(req);
  const { newPublicId, newTag } = body;

  // The existing Cloudinary public_id might be "my_app_profiles/username"
  const currentPublicId = `my_app_profiles/${username}`;

  // 1) Optionally rename
  if (newPublicId) {
    const renameResult = await cloudinary.uploader.rename(
      currentPublicId,
      `my_app_profiles/${newPublicId}`
    );

    // Update the user with the new URL
    await prisma.user.update({
      where: { username },
      data: {
        profileImageUrl: renameResult.secure_url,
      },
    });
  }

  // 2) Optionally add a tag
  if (newTag) {
    await cloudinary.uploader.explicit(`my_app_profiles/${newPublicId || username}`, {
      type: "upload",
      tags: [newTag],
    });
  }

  return res.status(200).json({ message: "Successfully patched image." });
}

/**
 * Utility: Parse multipart/form-data using 'formidable'
 */
function parseForm(req: NextApiRequest) {
  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>(
    (resolve, reject) => {
      const form = formidable({ multiples: false });
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    }
  );
}

/**
 * Utility: Parse JSON body (e.g., for PATCH)
 */
async function getJsonBody(req: NextApiRequest) {
  return new Promise<any>((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch (err) {
        reject(err);
      }
    });
  });
}
