// lib/sendUpdateEmail.ts

import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();

// Function to safely get an environment variable
const getEnvVar = (name: string): string => {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
};

// Ensure required environment variables are set
const smtpHost = getEnvVar('SMTP_HOST');
const smtpPort = parseInt(getEnvVar('SMTP_PORT'), 10);
const smtpSecure = getEnvVar('SMTP_SECURE') === 'true';
const smtpUser = getEnvVar('SMTP_USER');
const smtpPass = getEnvVar('SMTP_PASS');

// Create a transporter object using the custom SMTP server
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure, // true for 465, false for other ports
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    // This is optional. Use it if your SMTP server uses self-signed certificates.
    rejectUnauthorized: false,
  },
});

// Verify the transporter configuration (optional but recommended)
transporter.verify(function (error, success) {
  if (error) {
    console.error('Error with SMTP configuration:', error);
  } else {
    console.log('SMTP configuration is correct. Ready to send emails.');
  }
});

// Function to send update email
export const sendUpdateEmail = async (to: string, username: string, password: string) => {
  const mailOptions = {
    from: smtpUser, // Sender address from environment variable
    to,
    subject: 'Your Account Information Has Been Updated', // Subject line
    text: `Hey ${username},\n\nYour account information has been successfully updated! Here are your updated credentials:\n\nUsername: ${username}\nPassword: ${password}\n\nPlease update your credentials after logging in.\n\nThank You.`, // Plain text body
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Update email sent successfully');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error sending update email:', error.message);
      throw new Error(`Error sending update email: ${error.message}`);
    } else {
      console.error('Error sending update email:', error);
      throw new Error('Error sending update email: Unknown error occurred');
    }
  }
};

export default sendUpdateEmail; // Default export
