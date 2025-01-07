import type { NextApiRequest, NextApiResponse } from 'next';
import { sendOtpToUser } from '../../../lib/auth';
import rateLimit from '../../../lib/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return; // Ensure the response is sent
  }

  try {
    await rateLimit(req, res); // Handle rate limiting
  } catch (rateLimitError) {
    console.error('Rate limit error:', rateLimitError);
    res.status(429).json({ message: 'Too many requests. Please try again later.' });
    return; // Ensure the response is sent
  }

  const { username } = req.body;

  if (!username) {
    res.status(400).json({ message: 'Username is required.' });
    return; // Ensure the response is sent
  }

  try {
    await sendOtpToUser(username);
    res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    res
      .status(500)
      .json({ message: error.message || 'Failed to send OTP. Please try again.' });
  }
}
