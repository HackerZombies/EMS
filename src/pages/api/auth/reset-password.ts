import type { NextApiRequest, NextApiResponse } from 'next';
import { resetUserPassword } from '../../../lib/auth';
import rateLimit from '../../../lib/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    // Enforce rate limiting
    await rateLimit(req, res);
  } catch (rateLimitError) {
    console.error('Rate limit error:', rateLimitError);
    return res.status(429).json({ message: 'Too many requests. Please try again later.' });
  }

  const { username, newPassword } = req.body;

  if (!username || !newPassword) {
    return res.status(400).json({ message: 'Username and new password are required.' });
  }

  try {
    await resetUserPassword(username, newPassword);
    return res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error: any) {
    console.error('Error resetting password:', error.message || error);
    return res.status(500).json({ message: 'Failed to reset password. Please try again.' });
  }
}
