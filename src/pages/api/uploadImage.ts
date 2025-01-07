// src/pages/api/uploadImage.ts

import path from "path";
import fs from "fs/promises"; // Use the promises API for async operations
import sharp from "sharp";
import multer from "multer";
import { NextApiRequest, NextApiResponse } from "next";

// 1. Extend NextApiRequest to include Multer's File
interface MulterRequest extends NextApiRequest {
  file?: Express.Multer.File;
}

// 2. Define the uploads directory
const uploadsDir = path.join(process.cwd(), "public", "uploads");

// 3. Ensure the uploads directory exists
const ensureUploadsDir = async () => {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch (err) {
    console.error("Failed to create uploads directory:", err);
    throw err;
  }
};

// 4. Configure Multer storage and file filtering
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Only allow image/* MIME types
    if (!file.mimetype.startsWith("image/")) {
      const error = new Error("Only image files are allowed") as any;
      error.code = "LIMIT_FILE_TYPE";
      return cb(error, false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 2 * 1024 * 1024, // ~2MB
  },
});

// 5. Helper function to run Multer middleware
const runMiddleware = (
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
): Promise<void> => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      resolve();
    });
  });
};

// 6. The main API route handler
export default async function handler(
  req: MulterRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Ensure uploads directory exists
    await ensureUploadsDir();

    // Run the Multer middleware to handle the file upload
    await runMiddleware(req, res, upload.single("image"));

    // Check if a file was uploaded
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Paths for the original and optimized images
    const originalPath = path.join(uploadsDir, file.filename);
    const optimizedPath = path.join(uploadsDir, `optimized-${file.filename}`);

    // Handle old image deletion if provided
    const oldImageRelative = req.body.oldImagePath as string | undefined; // e.g., "/uploads/old.jpg"
    let oldAbsolutePath = "";
    if (oldImageRelative) {
      const trimmed = oldImageRelative.replace(/^\/+/, ""); // Remove leading slash
      oldAbsolutePath = path.join(process.cwd(), "public", trimmed);
    }

    try {
      // Optimize the image using Sharp
      await sharp(originalPath)
        .resize(300, 300, {
          fit: "cover",
        })
        .jpeg({
          quality: 70, // ~70% JPEG quality
          mozjpeg: true,
          progressive: true,
          chromaSubsampling: "4:4:4",
        })
        .toFile(optimizedPath);

      // Delete the original uploaded file
      await fs.unlink(originalPath);

      // Rename the optimized file to the original filename
      await fs.rename(optimizedPath, originalPath);

      // Delete the old image if it exists
      if (oldAbsolutePath) {
        try {
          await fs.unlink(oldAbsolutePath);
        } catch (unlinkErr) {
          console.error("Failed to remove old image:", unlinkErr);
          // You might choose to handle this differently, e.g., notify the user
        }
      }

      // Respond with the final image URL
      return res.status(200).json({
        imageUrl: `/uploads/${file.filename}`,
      });
    } catch (error) {
      console.error("Error optimizing or saving image:", error);
      return res
        .status(500)
        .json({ error: "Failed to process and optimize image" });
    }
  } catch (err: any) {
    // Handle Multer-specific errors
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File size is too large" });
      }
      return res.status(400).json({ error: err.message });
    } else if (err.code === "LIMIT_FILE_TYPE") {
      // Handle custom file type errors
      return res.status(400).json({ error: err.message });
    }

    // Handle any other unknown errors
    console.error("Unknown error during file upload:", err);
    return res.status(500).json({ error: "An unknown error occurred" });
  }
}

// 7. Disable default body parsing to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};
