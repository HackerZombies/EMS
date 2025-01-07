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

// Verify the transporter configuration (optional but recommended)
transporter.verify(function (error, success) {
    if (error) {
        console.error('Error with SMTP configuration:', error);
    } else {
        console.log('SMTP configuration is correct. Ready to send emails.');
    }
});

// Function to send leave request created email
const sendLeaveRequestCreatedEmail = async (to: string, username: string) => {
    const mailOptions = {
        from: smtpUser, // Sender address from environment variable
        to,
        subject: 'Your Leave Request Has Been Submitted', // Subject line
        text: `Hey ${username},\n\nYour leave request has been successfully submitted and is currently in a pending state. You will be notified once the status of your leave request is updated.\n\nThank You.`, // Plain text body
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Leave request created email sent successfully');
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Error sending leave request created email:', error.message);
            throw new Error(`Error sending email: ${error.message}`);
        } else {
            console.error('Error sending leave request created email:', error);
            throw new Error('Error sending email: Unknown error occurred');
        }
    }
};

export default sendLeaveRequestCreatedEmail; // Default export
