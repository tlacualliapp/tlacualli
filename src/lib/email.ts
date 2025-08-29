
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
    // This is the standard and most reliable configuration for Gmail with nodemailer.
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 10000,
      socketTimeout: 10000,
    });
}

export const sendWelcomeEmail = async ({ to, name, username, password }: WelcomeEmailProps) => {
    const transporter = getTransporter();

    const subject = '¡Bienvenido a Tlacualli App!';
    const html = `
       <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Poppins', sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #ffffff; }
                .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }
                .header img { max-width: 100px; }
                .content { padding: 20px 0; }
                .content h2 { color: #D32F2F; font-family: 'Poppins', sans-serif; }
                .credentials { background-color: #fdf2f2; padding: 15px; border: 1px dashed #f5c2c7; border-radius: 5px; }
                .credentials p { margin: 5px 0; }
                .button-container { text-align: center; margin-top: 20px; }
                .button { display: inline-block; background-color: #D32F2F; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; }
                .footer { font-size: 0.9em; color: #777; margin-top: 30px; text-align: center; }
            </style>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap" rel="stylesheet">
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://firebasestorage.googleapis.com/v0/b/tlacualli-a881e.appspot.com/o/restaurantes%2Fassets%2Ftaco-icon.png?alt=media&token=c191a624-9b2f-4c48-8317-a53b516b3b24" alt="Tlacualli Logo">
                </div>
                <div class="content">
                    <h2>¡Hola ${name}, te damos la bienvenida a Tlacualli App!</h2>
                    <p>Tu cuenta ha sido creada exitosamente. Ahora eres parte de la comunidad que está transformando la gestión de restaurantes.</p>
                    <p>Aquí están tus credenciales de acceso:</p>
                    <div class="credentials">
                        <p><strong>Usuario:</strong> ${username}</p>
                        ${password ? `<p><strong>Contraseña Temporal:</strong> ${password}</p>` : ''}
                    </div>
                    <p>Te recomendamos cambiar tu contraseña después de tu primer inicio de sesión por seguridad.</p>
                    <div class="button-container">
                        <a href="https://tlacualli.app/login" class="button">Iniciar Sesión</a>
                    </div>
                </div>
                <div class="footer">
                    <p>Si tienes alguna pregunta, no dudes en contactar a nuestro equipo de soporte.</p>
                    <p>El equipo de Tlacualli App.</p>
                </div>
            </div>
        </body>
        </html>
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
        let detailedError = (error as Error).message;
        if (detailedError.includes('Username and Password not accepted')) {
            detailedError = 'Invalid login. Please verify that the App Password in your .env file is correct and active in your Google Account.';
        }
        throw new Error(detailedError);
    }
};
