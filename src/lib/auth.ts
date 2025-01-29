import { prisma } from './prisma';
import { sendotpEmail } from './email'; // Correct import from the consolidated email module
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import logger from './logger'; // If you're using a logger

const OTP_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes
const SALT_ROUNDS = 10; // Number of salt rounds for bcrypt

/**
 * Sends an OTP to the user's registered email.
 * @param username The username of the user.
 */
export async function sendOtpToUser(username: string) {
  try {
    // Find the user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new Error('User not found.');
    }

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Hash the OTP before storing it
    const hashedOtp = await bcrypt.hash(otp, SALT_ROUNDS);

    // Save or update the OTP for the user
    await prisma.oTP.upsert({
      where: { userId: user.id }, // userId is now unique
      update: {
        otp: hashedOtp,
        createdAt: new Date(),
      },
      create: {
        userId: user.id,
        otp: hashedOtp,
      },
    });

    // Send OTP via email
    await sendotpEmail({
      to: user.email,
      subject: 'Your OTP for Password Reset',
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    });

    logger.info(`OTP sent to user: ${username}`);
  } catch (error: any) {
    logger.error('Error in sendOtpToUser:', error);
    throw error;
  }
}

/**
 * Verifies the OTP provided by the user.
 * @param username The username of the user.
 * @param otp The OTP to verify.
 * @returns A boolean indicating whether the OTP is valid.
 */
export async function verifyUserOtp(username: string, otp: string): Promise<boolean> {
  try {
    // Find the user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return false;
    }

    // Find the OTP record
    const otpRecord = await prisma.oTP.findUnique({
      where: { userId: user.id }, // userId is now unique
    });

    if (!otpRecord) {
      return false;
    }

    // Verify the OTP using bcrypt
    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValid) {
      return false;
    }

    // Check if OTP has expired
    const now = new Date();
    const otpCreationTime = otpRecord.createdAt;
    if (now.getTime() - otpCreationTime.getTime() > OTP_EXPIRATION_TIME) {
      return false;
    }

    // Delete the OTP after successful verification
    await prisma.oTP.delete({
      where: { userId: user.id }, // userId is now unique
    });

    logger.info(`OTP verified for user: ${username}`);
    return true;
  } catch (error: any) {
    logger.error('Error in verifyUserOtp:', error);
    throw error;
  }
}

/**
 * Resets the user's password.
 * @param username The username of the user.
 * @param newPassword The new password to set.
 */
export async function resetUserPassword(username: string, newPassword: string) {
  try {
    // Hash the new password using bcrypt
    const hashedPassword = await hashPassword(newPassword);

    // Update the user's password
    await prisma.user.update({
      where: { username },
      data: { password: hashedPassword },
    });

    logger.info(`Password reset for user: ${username}`);
  } catch (error: any) {
    logger.error('Error in resetUserPassword:', error);
    throw error;
  }
}

/**
 * Hashes a password using bcrypt.
 * @param password The plain text password.
 * @returns The hashed password.
 */
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}
