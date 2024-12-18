import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyUserOtp } from '../../../lib/auth';
import rateLimit from '../../../lib/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    await rateLimit(req, res, async () => {
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
      } catch (error) {
        // Cast error to known type (Error) or use a type guard
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred.';
        console.error('Error verifying OTP:', errorMessage);
        return res.status(500).json({ message: 'Failed to verify OTP. Please try again.' });
      }
    });
  } catch (error) {
    // Handle unexpected errors, ensuring 'error' is properly typed
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred.';
    console.error('Unexpected error in verify-otp handler:', errorMessage);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
}
