import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyUserOtp } from '../../../lib/auth';
import rateLimit from '../../../lib/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    await rateLimit(req, res); // Enforce rate limiting
  } catch (rateLimitError) {
    // Rate limiting error is handled inside rateLimit
    return; // Exit early if rate limiting fails
  }

  const { username, otp } = req.body;

  if (!username || !otp) {
    return res.status(400).json({ message: 'Username and OTP are required.' });
  }

  try {
    const isValid = await verifyUserOtp(username, otp);
    if (isValid) {
      return res.status(200).json({ message: 'OTP verified successfully.' });
    } else {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }
  } catch (error: any) {
    console.error('Error verifying OTP:', error.message || error);
    return res.status(500).json({ message: 'Failed to verify OTP. Please try again.' });
  }
}
