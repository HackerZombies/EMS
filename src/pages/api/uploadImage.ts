// src/pages/api/uploadImage.ts
import { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, File as FormidableFile, Files } from "formidable";
import path from "path";
import fs from "fs/promises";
import { v2 as cloudinary } from "cloudinary";

// 1) Cloudinary config from ENV
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Disable default body parsing to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to parse the incoming form data
const parseForm = async (req: NextApiRequest): Promise<{ fields: any; files: Files }> => {
  const form = new IncomingForm({
    keepExtensions: true,
    maxFileSize: 2 * 1024 * 1024, // ~2MB limit
    multiples: false,
    filename: (name, ext, part) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      return uniqueSuffix + path.extname(part.originalFilename || "");
    },
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { fields, files } = await parseForm(req);

    // Check if an image file was uploaded
    let file: FormidableFile;
    if (files.image) {
      file = Array.isArray(files.image) ? files.image[0] : files.image;
    } else {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Validate the file type
    if (!file.mimetype?.startsWith("image/")) {
      // If not an image, delete the temp file if it exists
      if (file.filepath) {
        await fs.unlink(file.filepath).catch(() => null);
      }
      return res.status(400).json({ error: "Only image files are allowed" });
    }

    // 2) Upload to Cloudinary with transformations
    // Crop to 300×300, focusing on face, then auto-format and auto-quality
    const uploadResult = await cloudinary.uploader.upload(file.filepath, {
      folder: "ems", // adjust folder name if needed
      use_filename: true,
      unique_filename: false,
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
    });

    // 3) Remove the temp file from the server
    await fs.unlink(file.filepath).catch(() => null);

    // 4) Respond with Cloudinary's secure URL (or public_id, etc.)
    // The transformations are now part of the final stored image
    return res.status(200).json({
      success: true,
      publicId: uploadResult.public_id,
      imageUrl: uploadResult.secure_url,
    });
  } catch (error) {
    console.error("Error handling upload:", error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
