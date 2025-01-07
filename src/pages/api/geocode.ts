//pages/api/geocode.ts

import { NextApiRequest, NextApiResponse } from "next";

export default async function geocodeHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: "Latitude and longitude are required." });
  }

  try {
    const apiKey = process.env.OPENCAGE_API_KEY; // Access the API key from the environment
    if (!apiKey) {
      throw new Error("OpenCage API key is not configured.");
    }

    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch address from OpenCage API.");
    }

    const data = await response.json();

    if (data.results.length > 0) {
      const address = data.results[0].formatted;
      return res.status(200).json({ address });
    }

    return res.status(404).json({ message: "No address found for the provided coordinates." });
  } catch (error) {
    console.error("Error during geocoding:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
