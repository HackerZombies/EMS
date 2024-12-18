import type { NextApiRequest, NextApiResponse } from 'next';
import { resetUserPassword } from '../../../lib/auth';
import rateLimit from '../../../lib/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Ensure rate limiting works correctly and returns errors if applicable
    await rateLimit(req, res, async () => {
      const { username, newPassword } = req.body;

      if (!username || !newPassword) {
        return res.status(400).json({ message: 'Username and new password are required.' });
      }

      try {
        await resetUserPassword(username, newPassword);
        return res.status(200).json({ message: 'Password reset successfully.' });
      } catch (error: any) {
        console.error('Error resetting password:', error);
        return res.status(500).json({ message: 'Failed to reset password. Please try again.' });
      }
    });
  } catch (error) {
    // Catch any unexpected errors from rateLimit or other middleware
    console.error('Unexpected error in reset-password handler:', error);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
}
