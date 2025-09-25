
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

interface SupportResponseEmailProps {
    to: string;
    name: string;
    question: string;
    reply: string;
}

const getTransporter = () => {
    // This is the standard and most reliable configuration for Gmail with nodemailer.
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
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
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
            <tr>
                <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; margin: 20px auto; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td align="center" style="background-color: #D32F2F; padding: 20px 0;">
                                <img src="https://firebasestorage.googleapis.com/v0/b/tlacualli-a881e.appspot.com/o/restaurantes%2Fassets%2Ftlacualli_logo_white.png?alt=media&token=13688b79-56de-4c42-b949-6889a7e376d5" alt="Tlacualli Logo" style="max-width: 150px;">
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 30px 40px;">
                                <h2 style="font-family: 'Poppins', Arial, sans-serif; color: #D32F2F; margin-top: 0;">¡Hola ${name}, te damos la bienvenida a Tlacualli App!</h2>
                                <p style="font-family: 'Poppins', Arial, sans-serif; font-size: 16px; color: #333;">Tu cuenta ha sido creada exitosamente. Ahora eres parte de la comunidad que está transformando la gestión de restaurantes.</p>
                                <p style="font-family: 'Poppins', Arial, sans-serif; font-size: 16px; color: #333;">Aquí están tus credenciales de acceso:</p>
                                
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fdf2f2; border: 1px dashed #f5c2c7; border-radius: 8px; margin-top: 20px; margin-bottom: 20px;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <p style="font-family: 'Poppins', Arial, sans-serif; margin: 5px 0; font-size: 16px;"><strong>Usuario:</strong> ${username}</p>
                                            ${password ? `<p style="font-family: 'Poppins', Arial, sans-serif; margin: 5px 0; font-size: 16px;"><strong>Contraseña Temporal:</strong> ${password}</p>` : ''}
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="font-family: 'Poppins', Arial, sans-serif; font-size: 16px; color: #333;">Te recomendamos cambiar tu contraseña después de tu primer inicio de sesión por seguridad.</p>
                                
                                <!-- Button -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 30px; text-align: center;">
                                    <tr>
                                        <td>
                                            <a href="https://tlacualli.app/login" style="display: inline-block; background-color: #D32F2F; color: #ffffff; padding: 15px 30px; font-size: 18px; text-decoration: none; border-radius: 8px; font-weight: bold;">Iniciar Sesión</a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8f8f8; padding: 20px 40px; text-align: center; font-size: 12px; color: #777;">
                                <p style="margin: 0;">Si tienes alguna pregunta, contacta a nuestro equipo de soporte.</p>
                                <p style="margin-top: 10px; margin-bottom:0;">El equipo de Tlacualli App.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    try {
        await transporter.sendMail({
            from: `"Tlacualli App" <${process.env.GMAIL_USER}>`,
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

export const sendSupportResponseEmail = async ({ to, name, question, reply }: SupportResponseEmailProps) => {
    const transporter = getTransporter();
    const subject = 'Respuesta a tu consulta de soporte - Tlacualli App';
    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
            <tr>
                <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; margin: 20px auto; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td align="center" style="background-color: #D32F2F; padding: 20px 0;">
                                <img src="https://firebasestorage.googleapis.com/v0/b/tlacualli-a881e.appspot.com/o/restaurantes%2Fassets%2Ftlacualli_logo_white.png?alt=media&token=13688b79-56de-4c42-b949-6889a7e376d5" alt="Tlacualli Logo" style="max-width: 150px;">
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 30px 40px;">
                                <h2 style="font-family: 'Poppins', Arial, sans-serif; color: #333; margin-top: 0;">Hola ${name},</h2>
                                <p style="font-family: 'Poppins', Arial, sans-serif; font-size: 16px; color: #555;">Hemos revisado tu consulta y aquí tienes una respuesta de nuestro equipo de soporte:</p>
                                
                                <h3 style="color: #D32F2F; border-bottom: 2px solid #f0f0f0; padding-bottom: 5px; margin-top: 25px;">Tu consulta original:</h3>
                                <p style="background-color: #fafafa; padding: 15px; border-radius: 8px; font-style: italic; color: #666;">"${question}"</p>

                                <h3 style="color: #D32F2F; border-bottom: 2px solid #f0f0f0; padding-bottom: 5px; margin-top: 25px;">Nuestra respuesta:</h3>
                                <div style="background-color: #f0f5ff; padding: 20px; border-radius: 8px; color: #333; line-height: 1.6;">
                                    ${reply.replace(/\n/g, '<br>')}
                                </div>
                                
                                <p style="font-family: 'Poppins', Arial, sans-serif; font-size: 16px; color: #555; margin-top: 30px;">Esperamos que esto resuelva tu duda. Si necesitas más ayuda, no dudes en contactarnos de nuevo.</p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8f8f8; padding: 20px 40px; text-align: center; font-size: 12px; color: #777;">
                                <p style="margin: 0;">Saludos cordiales,</p>
                                <p style="margin-top: 5px; margin-bottom:0;"><strong>El equipo de Tlacualli App</strong></p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

     try {
        await transporter.sendMail({
            from: `"Soporte Tlacualli" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`Support response sent to ${to}`);
    } catch (error) {
        console.error(`Failed to send support response email to ${to}:`, error);
        throw error;
    }
};

export const sendCustomEmail = async ({ to, subject, html }: CustomEmailProps) => {
    const transporter = getTransporter();
    try {
        await transporter.sendMail({
            from: `"Tlacualli App" <${process.env.GMAIL_USER}>`,
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
