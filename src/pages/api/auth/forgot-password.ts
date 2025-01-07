import type { NextApiRequest, NextApiResponse } from 'next';
import { sendOtpToUser } from '../../../lib/auth';
import rateLimit from '../../../lib/rateLimit'; // Import your rateLimit function

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      await rateLimit(req, res); // Apply rate limiting

      const { username } = req.body;

      if (!username) {
        return res.status(400).json({ message: 'Username is required.' });
      }

      await sendOtpToUser(username);
      return res.status(200).json({ message: 'OTP sent successfully.' });
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      return res.status(500).json({ message: error.message || 'Failed to send OTP. Please try again.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
