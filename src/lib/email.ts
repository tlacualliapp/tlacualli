
'use server';

import 'dotenv/config';
import nodemailer from 'nodemailer';

interface WelcomeEmailProps {
    to: string;
    name: string;
    username: string;
    password?: string;
}

interface CustomEmailProps {
    to: string;
    subject: string;
    html: string;
}

const getTransporter = () => {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: true, // Use true for port 465, false for others
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
}

export const sendWelcomeEmail = async ({ to, name, username, password }: WelcomeEmailProps) => {
    const transporter = getTransporter();

    const subject = '¡Bienvenido a Tlacualli App!';
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #E53935;">¡Hola ${name}, te damos la bienvenida a Tlacualli App!</h2>
                <p>Tu cuenta ha sido creada exitosamente. Ahora eres parte de la comunidad que está transformando la gestión de restaurantes.</p>
                <p>Aquí están tus credenciales de acceso:</p>
                <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px;">
                    <p><strong>Usuario:</strong> ${username}</p>
                    ${password ? `<p><strong>Contraseña Temporal:</strong> ${password}</p>` : ''}
                </div>
                <p>Te recomendamos cambiar tu contraseña después de tu primer inicio de sesión por seguridad.</p>
                <a href="https://tlacuallionline.com/login" style="display: inline-block; background-color: #E53935; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">
                    Iniciar Sesión
                </a>
                <p style="font-size: 0.9em; color: #777; margin-top: 30px;">
                    Si tienes alguna pregunta, no dudes en contactar a nuestro equipo de soporte.
                    <br>
                    El equipo de Tlacualli App.
                </p>
            </div>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `"Tlacualli App" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`Welcome email sent to ${to}`);
    } catch (error) {
        console.error(`Failed to send welcome email to ${to}:`, error);
        // We don't re-throw the error to avoid blocking the user creation process
        // but it should be logged for monitoring.
    }
};

export const sendCustomEmail = async ({ to, subject, html }: CustomEmailProps) => {
    const transporter = getTransporter();
    try {
        await transporter.sendMail({
            from: `"Tlacualli App" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`Custom email sent to ${to}`);
    } catch (error) {
        console.error(`Failed to send custom email to ${to}:`, error);
        throw new Error('Failed to send email.');
    }
};
