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

// Function to send update email
export const sendUpdateEmail = async (to: string, username: string, password: string) => {
    const mailOptions = {
        from: gmailUser , // Sender address from environment variable
        to,
        subject: 'Your Account Information Has Been Updated', // Subject line
        text: `Hey ${username},\n\nYour account information has been successfully updated! Here are your updated credentials:\n\nUsername: ${username}\nPassword: ${password}\n\nPlease update your credentials after logging in.\nThank You.`, // Plain text body
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

export default sendUpdateEmail; // Default export