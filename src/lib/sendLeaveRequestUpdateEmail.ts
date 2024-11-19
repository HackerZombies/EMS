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
const smtpUser = getEnvVar('SMTP_USER');
const smtpPass = getEnvVar('SMTP_PASS');
const mailtrapUsername = getEnvVar('MAILTRAP_USERNAME');

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: false, // Set to true if using port 465
  auth: {
    user: smtpUser,
    pass: smtpPass
  },
});

// Function to send leave request update email
export const sendLeaveRequestUpdateEmail = async (to: string, username: string, requestStatus: string) => {
  const subject = requestStatus === "Accepted" ? "Your Leave Request Has Been Accepted" : "Your Leave Request Has Been Declined";
  const text = requestStatus === "Accepted"
    ? `Hey ${username},\n\nYour leave request has been accepted. Please plan accordingly.\n\nThank You.`
    : `Hey ${username},\n\nYour leave request has been declined. Please contact your manager for more information.\n\nThank You.`;

  const mailOptions = {
    from: mailtrapUsername, // Sender address from environment variable
    to,
    subject, // Subject line
    text, // Plain text body
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Leave request update email sent successfully');
  } catch (error) {
    console.error('Error sending leave request update email:', error);
  }
};

// Verify the environment variables
console.log('SMTP Host:', smtpHost);
console.log('SMTP Port:', smtpPort);
console.log('SMTP User:', smtpUser);
console.log('SMTP Pass:', smtpPass);
console.log('Sender Email:', mailtrapUsername);