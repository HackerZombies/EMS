import { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, File as FormidableFile, Files } from "formidable";
import path from "path";
import fs from "fs/promises";

// Disable default body parsing to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Define the uploads directory
const uploadsDir = path.join(process.cwd(), "public", "uploads");

// Ensure the uploads directory exists
fs.access(uploadsDir).catch(async () => {
  await fs.mkdir(uploadsDir, { recursive: true });
});

// Helper function to parse the incoming form data
const parseForm = async (req: NextApiRequest): Promise<{ fields: any; files: Files }> => {
  const form = new IncomingForm({
    uploadDir: uploadsDir,
    keepExtensions: true,
    maxFileSize: 2 * 1024 * 1024, // ~2MB
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

    if (!file.mimetype?.startsWith("image/")) {
      await fs.unlink(file.filepath); // Delete non-image file
      return res.status(400).json({ error: "Only image files are allowed" });
    }

    // Respond with the final image URL
    return res.status(200).json({
      imageUrl: `/uploads/${path.basename(file.filepath)}`,
    });
  } catch (error) {
    console.error("Error handling upload:", error);

    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: "Internal Server Error" });
  }
}
