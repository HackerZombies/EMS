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

// Ensure required environment variables are set for Gmail
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

// Function to send leave request update email
export const sendLeaveRequestUpdateEmail = async (to: string, username: string, requestStatus: string) => {
  const subject = requestStatus === "Accepted" ? "Your Leave Request Has Been Accepted" : "Your Leave Request Has Been Declined";
  const text = requestStatus === "Accepted"
    ? `Hey ${username},\n\nYour leave request has been accepted. Please plan accordingly.\n\nThank You.`
    : `Hey ${username},\n\nYour leave request has been declined. Please contact your manager for more information.\n\nThank You.`;

  const mailOptions = {
    from: gmailUser , // Sender address from environment variable
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
console.log('Gmail User:', gmailUser );
console.log('Gmail Pass:', gmailPass);