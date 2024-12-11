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
const gmailUser   = getEnvVar('GMAIL_USER');
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

// Function to send leave request created email
export const sendLeaveRequestCreatedEmail = async (to: string, username: string) => {
    const mailOptions = {
        from: gmailUser , // Sender address from environment variable
        to,
        subject: 'Your Leave Request Has Been Submitted', // Subject line
        text: `Hey ${username},\n\nYour leave request has been successfully submitted and is currently in a pending state. You will be notified once the status of your leave request is updated.\n\nThank You.`, // Plain text body
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Leave request created email sent successfully');
    } catch (error) {
        console.error('Error sending leave request created email:', error);
    }
};

export default { sendLeaveRequestCreatedEmail }; // Default export