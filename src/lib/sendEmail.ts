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

// Function to send email
export const sendEmail = async (to: string, username: string, password: string) => {
    const mailOptions = {
        from: gmailUser , // Sender address from environment variable
        to,
        subject: 'Welcome to Our System',
        text: `Hello ${username},\n\nWelcome to our system! Your account has been created successfully.\n\nUsername: ${username}\nTemporary Password: ${password}\n\nPlease log in and change your password immediately.\n\nThank you!`,
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

export default sendEmail; // Default export