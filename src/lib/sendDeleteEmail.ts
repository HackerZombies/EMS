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
const gmailUser  = getEnvVar('GMAIL_USER');
const gmailPass = getEnvVar('GMAIL_PASS');

// Create a transporter object using Gmail service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  secure: true, // Use SSL
  port: 465,
  auth: {
    user: gmailUser ,
    pass: gmailPass,
  },
});

// Function to send delete email
export const sendDeleteEmail = async (to: string, username: string) => {
  const mailOptions = {
    from: gmailUser , // Sender address from environment variable
    to,
    subject: 'Your Account Has Been Removed', // Subject line
    text: `Hey ${username},\n\nWe are sorry to inform you that your account has been removed from our system.\n\nSee you soon!\nThank You.`, // Plain text body
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Delete email sent successfully');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error sending delete email:', error.message);
      throw new Error(`Error sending delete email: ${error.message}`);
    } else {
      console.error('Error sending delete email:', error);
      throw new Error('Error sending delete email: Unknown error occurred');
    }
  }
};