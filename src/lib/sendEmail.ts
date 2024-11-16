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

// Function to send email
export const sendEmail = async (to: string, username: string, password: string) => {
    const mailOptions = {
        from: mailtrapUsername, // Sender address from environment variable
        to,
        subject: 'Welcome to Our System', // Subject line
        text: `Hey Employee!! you  has been added successfully! to our firm here is your \n\nUsername: ${username}\nPassword: ${password} , Please Update your Credentials after logging in.
        Thank You.`, // Plain text body
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Verify the environment variables
console.log('SMTP Host:', smtpHost);
console.log('SMTP Port:', smtpPort);
console.log('SMTP User:', smtpUser);
console.log('SMTP Pass:', smtpPass);
console.log('Sender Email:', mailtrapUsername);