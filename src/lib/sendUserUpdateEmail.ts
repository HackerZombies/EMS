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

// Function to send update email
export const sendUserUpdateEmail = async (to: string, username: string, password: string) => {
  const mailOptions = {
    from: mailtrapUsername, // Sender address from environment variable
    to,
    subject: 'Your Account Information Has Been Updated', // Subject line
    text: `Hey ${username},\n\nYour account information has been successfully updated! Here are your updated credentials:\n\nUsername: ${username}\nPassword: ${password}\n\nPlease update your credentials after logging in.\nThank You.`, // Plain text body
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Update email sent successfully');
  } catch (error) {
    console.error('Error sending update email:', error);
  }
};