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

// Function to send delete email
export const sendDeleteEmail = async (to: string, username: string) => {
  const mailOptions = {
    from: mailtrapUsername, // Sender address from environment variable
    to,
    subject: 'Your Account Has Been Removed', // Subject line
    text: `Hey ${username},\n\nWe are sorry to inform you that your account has been removed from our system.\n\nSee you soon!\nThank You.`, // Plain text body
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Delete email sent successfully');
  } catch (error) {
    console.error('Error sending delete email:', error);
  }
};

// Verify the environment variables
console.log('SMTP Host:', smtpHost);
console.log('SMTP Port:', smtpPort);
console.log('SMTP User:', smtpUser);
console.log('SMTP Pass:', smtpPass);
console.log('Sender Email:', mailtrapUsername);