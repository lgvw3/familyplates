'use server'
import { Annotation } from '@/types/scripture';
import nodemailer, { type SendMailOptions } from 'nodemailer';


export default async function sendErrorMessageToMe(annotation: Annotation) {

    try {
        const transporter = nodemailer.createTransport({
            //service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_ADDRESS,
                pass: process.env.APP_PASS,
            },
        });

        const mailOptions: SendMailOptions = {
            from: process.env.EMAIL_USER,
            to: "logangvw3@gmail.com",
            subject: `Annotation Failed For ${annotation.userName}`,
            text: `An annotation failed:
            
            ${annotation}`,
        };

        const results = await transporter.sendMail(mailOptions);
        
        if (results.accepted) {
            return {
                message: 'Success',
            }
        }
        else {
            return {
                message: 'Failed to send'
            }
        }


    } catch (error) {
      
        console.error('Error sending email:', error);
        return {
            message: "Failed to send" 
        }

    }
}
