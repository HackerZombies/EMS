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

// Ensure required environment variables are set for SMTP
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
    // Use this option if your SMTP server uses self-signed certificates
    rejectUnauthorized: false,
  },
});

// Function to send leave request update email
export const sendLeaveRequestUpdateEmail = async (to: string, username: string, requestStatus: string) => {
  const subject = requestStatus === "Accepted" ? "Your Leave Request Has Been Accepted" : "Your Leave Request Has Been Declined";
  const text = requestStatus === "Accepted"
    ? `Hey ${username},\n\nYour leave request has been accepted. Please plan accordingly.\n\nThank You.`
    : `Hey ${username},\n\nYour leave request has been declined. Please contact your manager for more information.\n\nThank You.`;

  const mailOptions = {
    from: smtpUser, // Sender address from environment variable
    to,
    subject, // Subject line
    text, // Plain text body
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Leave request update email sent successfully');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error sending leave request update email:', error.message);
      throw new Error(`Error sending email: ${error.message}`);
    } else {
      console.error('Error sending leave request update email:', error);
      throw new Error('Error sending email: Unknown error occurred');
    }
  }
};

