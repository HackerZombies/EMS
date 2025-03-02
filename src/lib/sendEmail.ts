// lib/sendEmail.ts

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

// Function to send email with a professional HTML template
export const sendEmail = async (to: string, username: string, password: string) => {
  const mailOptions = {
    from: smtpUser, // Sender address from environment variable
    to,
    subject: 'Welcome to Our System',
    // Fallback plain text message
    text: `Hello ${username},

Welcome to our system! Your account has been created successfully.

Username: ${username}
Temporary Password: ${password}

Please log in here https://ems.psitechconsultancy.com and change your password.

Thank you!`,
    // HTML version of the email with an enhanced login button
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Welcome to Our System</title>
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
                <h2 style="color: #333333;">Welcome to Our System, ${username}!</h2>
                <p style="color: #333333;">Your account has been created successfully. Please find your login details below:</p>
                <p style="color: #333333;">
                  <strong>Username:</strong> ${username}<br/>
                  <strong>Temporary Password:</strong> ${password}
                </p>
                <p style="color: #333333;">To get started, please click the button below to log in and change your password immediately.</p>
                <!-- Prominent Login Button -->
                <table border="0" cellpadding="0" cellspacing="0" style="margin: 20px auto;">
                  <tr>
                    <td align="center" style="border-radius: 5px;" bgcolor="#2C3E50">
                      <a href="https://ems.psitechconsultancy.com" target="_blank" style="font-size: 16px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 12px 24px; display: inline-block;">
                        Log in Here
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="color: #333333;">Thank you for joining us!</p>
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
    console.log('Email sent successfully');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error sending email:', error.message);
      throw new Error(`Error sending email: ${error.message}`);
    } else {
      console.error('Error sending email:', error);
      throw new Error('Error sending email: Unknown error occurred');
    }
  }
};

export default sendEmail;
