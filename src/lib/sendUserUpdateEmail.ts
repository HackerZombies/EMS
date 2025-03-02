// lib/sendUserUpdateEmail.ts

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
transporter.verify((error, success) => {
  if (error) {
    console.error('Error with SMTP configuration:', error);
  } else {
    console.log('SMTP configuration is correct. Ready to send emails.');
  }
});

// Function to send user update email with an HTML template
export const sendUpdateEmail = async (to: string, username: string, password: string) => {
  const mailOptions = {
    from: smtpUser, // Sender address from environment variable
    to,
    subject: 'Your Account Information Has Been Updated',
    // Fallback plain text message
    text: `Hey ${username},

Your account information has been successfully updated! Here are your updated credentials:

Username: ${username}
Password: ${password}

Please update your credentials after logging in.

Thank You.`,
    // HTML version of the email
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Account Information Updated</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f6f6f6;">
          <table align="center" width="600" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: #ffffff;">
            <!-- Header with company name -->
            <tr>
              <td align="center" style="padding: 20px; background-color: #2C3E50;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px;">
                  Psitech Consultancy Services Pvt Ltd.
                </h1>
              </td>
            </tr>
            <!-- Email Body -->
            <tr>
              <td style="padding: 20px;">
                <h2 style="color: #333333;">Hello ${username},</h2>
                <p style="color: #333333;">Your account information has been successfully updated! Here are your updated credentials:</p>
                <p style="color: #333333;">
                  <strong>Username:</strong> ${username}<br/>
                  <strong>Password:</strong> ${password}
                </p>
                <p style="color: #333333;">
                  Please log in and update your credentials as soon as possible.
                </p>
                <p style="color: #333333;">Thank You.</p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td align="center" style="padding: 20px; background-color: #f0f0f0; color: #777777; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Psitech Consultancy Services Pvt Ltd. All rights reserved.
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
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

export default sendUpdateEmail;
