require('dotenv').config();
const path = require('path');
const nodemailer = require('nodemailer');
const fs = require('fs');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Función auxiliar para obtener la URL de recuperación
function getPasswordRecoveryUrl() {
    const environment = process.env.ENVIRONMENT || 'local';
    const isNgrok = environment === 'ngrok';
    const port = process.env.PORT || 3000;
    const ngrokUrl = process.env.SOCKET_URL_NGROK || 'https://<your-ngrok-url>.ngrok-free.app';

    if (isNgrok) {
        return ngrokUrl;
    }

    // Obtener la IP local
    const os = require('os');
    const interfaces = os.networkInterfaces();
    let localIP = 'localhost';
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                localIP = iface.address;
                break;
            }
        }
    }

    // Usar IP local para la red, localhost para desarrollo
    return `http://${localIP}:${port}`;
}

// Función para enviar el correo con el código de verificación
async function sendVerificationEmail(email, code) {
    try {
        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Código de Verificación para ArrendaFacil',
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <!-- Encabezado -->
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Verifica tu Email! 🎉</h1>
                    </div>

                    <!-- Cuerpo -->
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">¡Bienvenido a ArrendaFacil!</h2>
                        
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Gracias por unirte a nuestra plataforma. Tu código de verificación es:
                        </p>

                        <!-- Código de verificación -->
                        <div style="margin: 20px 0; padding: 20px; background-color: #e0f2fe; border: 2px dashed #0284c7; border-radius: 8px; text-align: center;">
                            <p style="color: #075985; font-size: 20px; font-weight: bold; margin: 0; letter-spacing: 4px;">
                                ${code}
                            </p>
                            <p style="color: #075985; font-size: 14px; margin-top: 8px;">
                                Código de verificación
                            </p>
                        </div>

                        <!-- Nota de validez -->
                        <div style="margin: 20px 0; padding: 15px; background-color: #fef9c3; border-left: 4px solid #ca8a04; border-radius: 6px;">
                            <p style="color: #78350f; font-size: 15px; margin: 0; font-weight: 500;">
                                ⏳ Este código es válido por 24 horas. Por favor, ingrésalo en la página de verificación para completar tu registro.
                            </p>
                        </div>

                        <!-- Advertencia de seguridad -->
                        <div style="margin: 20px 0; padding: 15px; background-color: #fee2e2; border-left: 4px solid #b91c1c; border-radius: 6px;">
                            <p style="color: #7f1d1d; font-size: 15px; margin: 0; font-weight: 500;">
                                ⚠️ Si no solicitaste este código, ignora este correo o contacta a nuestro soporte si tienes alguna sospecha.
                            </p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            ¡Gracias por elegir ArrendaFacil! 🏡
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Correo con código ${code} enviado a ${email}:`, info.messageId);
    } catch (error) {
        console.error('Error al enviar correo de verificación:', {
            message: error.message,
            code: error.code,
            response: error.response,
            stack: error.stack
        });
        throw new Error('No se pudo enviar el correo de verificación');
    }
}

// Nueva función para enviar correo de desbloqueo de cuenta
async function sendUnlockVerificationEmail(email, code) {
    try {
        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Código para Desbloquear tu Cuenta en ArrendaFacil',
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <!-- Encabezado -->
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">Desbloqueo de Cuenta 🔒</h1>
                    </div>

                    <!-- Cuerpo -->
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">Proceso de Seguridad</h2>
                        
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Hemos detectado múltiples intentos fallidos de inicio de sesión en tu cuenta. Para protegerte, necesitamos verificar tu identidad.
                        </p>

                        <!-- Código de desbloqueo -->
                        <div style="margin: 20px 0; padding: 20px; background-color: #e0f2fe; border: 2px dashed #0284c7; border-radius: 8px; text-align: center;">
                            <p style="color: #075985; font-size: 20px; font-weight: bold; margin: 0; letter-spacing: 4px;">
                                ${code}
                            </p>
                            <p style="color: #075985; font-size: 14px; margin-top: 8px;">
                                Código de verificación
                            </p>
                        </div>

                        <!-- Nota de validez -->
                        <div style="margin: 20px 0; padding: 15px; background-color: #fef9c3; border-left: 4px solid #ca8a04; border-radius: 6px;">
                            <p style="color: #78350f; font-size: 15px; margin: 0; font-weight: 500;">
                                ⏳ Este código es válido por 24 horas. Ingresa este código en la página de recuperación para desbloquear tu cuenta y cambiar tu contraseña.
                            </p>
                        </div>

                        <!-- Advertencia de seguridad -->
                        <div style="margin: 20px 0; padding: 15px; background-color: #fee2e2; border-left: 4px solid #b91c1c; border-radius: 6px;">
                            <p style="color: #7f1d1d; font-size: 15px; margin: 0; font-weight: 500;">
                                ⚠️ Si no solicitaste este código, te recomendamos revisar la seguridad de tu cuenta y contactar a nuestro soporte inmediatamente.
                            </p>
                        </div>

                        <!-- Contacto -->
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                            Si necesitas ayuda adicional, contáctanos en 
                            <a href="mailto:soportearrendafacil@gmail.com" style="color: #2b6b6b; font-weight: 600; text-decoration: underline;">
                                soportearrendafacil@gmail.com
                            </a>.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            ¡Gracias por mantener tu cuenta segura! 🛡️
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Correo de desbloqueo con código ${code} enviado a ${email}:`, info.messageId);
    } catch (error) {
        console.error('Error al enviar correo de desbloqueo:', {
            message: error.message,
            code: error.code,
            response: error.response,
            stack: error.stack
        });
        throw new Error('No se pudo enviar el correo de desbloqueo');
    }
}

// Nueva función para enviar correo de recuperación de contraseña
async function sendPasswordResetEmail(email, token) {
    try {
        const baseUrl = getPasswordRecoveryUrl();
        const resetUrl = `${baseUrl}/reset-password?token=${token}`;
        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Restablecer tu Contraseña en ArrendaFacil',
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <!-- Encabezado -->
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">Restablecer Contraseña 🔐</h1>
                    </div>
    
                    <!-- Cuerpo -->
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">Solicitud de Restablecimiento</h2>
                        
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en ArrendaFacil.
                        </p>
    
                        <!-- Instrucciones -->
                        <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-left: 4px solid #2b6b6b; border-radius: 6px;">
                            <p style="color: #4b5563; font-size: 15px; margin: 0; line-height: 1.5;">
                                📌 Por favor, haz clic en el botón inferior para establecer una nueva contraseña:
                            </p>
                        </div>
    
                        <!-- Botón de acción -->
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #2b6b6b, #4c9f9f); 
                                      color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                Restablecer Contraseña
                            </a>
                        </div>
    
                        <!-- Nota de validez -->
                        <div style="margin: 20px 0; padding: 15px; background-color: #fef9c3; border-left: 4px solid #ca8a04; border-radius: 6px;">
                            <p style="color: #78350f; font-size: 15px; margin: 0; font-weight: 500;">
                                ⏳ Este enlace es válido por 15 minutos. Si no solicitaste este cambio, puedes ignorar este correo.
                            </p>
                        </div>
                    </div>
    
                    <!-- Footer -->
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            ¡Gracias por tu confianza en ArrendaFacil! 🛡️
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Correo de recuperación enviado a ${email}:`, info.messageId);
    } catch (error) {
        console.error('Error al enviar correo de recuperación:', {
            message: error.message,
            code: error.code,
            response: error.response,
            stack: error.stack
        });
        throw new Error('No se pudo enviar el correo de recuperación');
    }
}

// Nueva función para enviar correo de notificación de contraseña cambiada
async function sendPasswordResetSuccessEmail(email) {
    try {
        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Contraseña Cambiada Exitosamente en ArrendaFacil',
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <!-- Encabezado -->
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Contraseña Actualizada! ✅</h1>
                    </div>

                    <!-- Cuerpo -->
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">¡Seguridad Actualizada!</h2>
                        
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Tu contraseña ha sido cambiada exitosamente en ArrendaFacil.
                        </p>

                        <!-- Nota de seguridad -->
                        <div style="margin: 20px 0; padding: 15px; background-color: #fee2e2; border-left: 4px solid #b91c1c; border-radius: 6px;">
                            <p style="color: #7f1d1d; font-size: 15px; margin: 0; font-weight: 500;">
                                ⚠️ Si no realizaste este cambio, por favor contacta a nuestro equipo de soporte de inmediato.
                            </p>
                        </div>

                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Ahora puedes iniciar sesión con tu nueva contraseña desde nuestra aplicación o sitio web.
                        </p>

                        <!-- Contacto -->
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                            Para mayor seguridad, evita compartir tu contraseña y considera usar un administrador de contraseñas. 
                            Si necesitas ayuda adicional, contáctanos en 
                            <a href="mailto:soportearrendafacil@gmail.com" style="color: #2b6b6b; font-weight: 600; text-decoration: underline;">
                                soportearrendafacil@gmail.com
                            </a>.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            ¡Gracias por mantener tu cuenta segura! 🛡️
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Correo de notificación de contraseña cambiada enviado a ${email}:`, info.messageId);
    } catch (error) {
        console.error('Error al enviar correo de notificación de contraseña cambiada:', {
            message: error.message,
            code: error.code,
            response: error.response,
            stack: error.stack
        });
        throw new Error('No se pudo enviar el correo de notificación');
    }
}

// Función para enviar el correo de bienvenida
async function sendWelcomeEmail(email, role) {
    try {
        const roleText = role === 'arrendador' ? 'arrendador' : 'arrendatario';
        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '¡Registro Exitoso en ArrendaFacil!',
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <!-- Encabezado -->
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Bienvenido! 👋</h1>
                    </div>

                    <!-- Cuerpo -->
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">¡Felicidades por tu registro!</h2>
                        
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Tu registro como <strong>${roleText}</strong> ha sido completado exitosamente.
                        </p>

                        <!-- Mensaje según rol -->
                        <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-left: 4px solid #2b6b6b; border-radius: 6px;">
                            <p style="color: #4b5563; font-size: 15px; margin: 0; line-height: 1.5;">
                                ${role === 'arrendador' ? 
                                    '🚀 Publica tus propiedades y encuentra arrendatarios confiables en minutos.' : 
                                    '🎯 Encuentra la propiedad perfecta para rentar con nuestras herramientas inteligentes.'}
                            </p>
                        </div>

                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Explora la plataforma y comienza a disfrutar de todas las herramientas que tenemos para ti. 
                            ¡Estamos emocionados de tenerte con nosotros!
                        </p>

                        <!-- Contacto -->
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                            Si necesitas ayuda o tienes preguntas, contáctanos en 
                            <a href="mailto:soportearrendafacil@gmail.com" style="color: #2b6b6b; font-weight: 600; text-decoration: underline;">
                                soportearrendafacil@gmail.com
                            </a>.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            ¡Gracias por unirte a nuestra comunidad! 🏡
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Correo de bienvenida enviado a ${email}:`, info.messageId);
    } catch (error) {
        console.error('Error al enviar correo de bienvenida:', {
            message: error.message,
            code: error.code,
            response: error.response,
            stack: error.stack
        });
        throw new Error('No se pudo enviar el correo de bienvenida');
    }
}

// Función para enviar correo de despedida (Eliminación de cuenta)
async function sendAccountDeletionEmail(email) {
    try {
        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Confirmación de Eliminación de Cuenta en ArrendaFacil',
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <!-- Encabezado -->
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">Cuenta Eliminada 🔥</h1>
                    </div>

                    <!-- Cuerpo -->
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">¡Hasta Pronto!</h2>
                        
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Hemos procesado tu solicitud y tu cuenta en ArrendaFacil ha sido eliminada permanentemente.
                        </p>

                        <!-- Nota importante -->
                        <div style="margin: 20px 0; padding: 15px; background-color: #fee2e2; border-left: 4px solid #b91c1c; border-radius: 6px;">
                            <p style="color: #7f1d1d; font-size: 15px; margin: 0; font-weight: 500;">
                                ⚠️ Todos tus datos personales han sido eliminados de nuestros sistemas según lo solicitaste, en cumplimiento con nuestras políticas de privacidad.
                            </p>
                        </div>

                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Lamentamos verte partir. Si cambias de opinión, siempre puedes crear una nueva cuenta en nuestra plataforma cuando lo desees.
                        </p>

                        <!-- Contacto -->
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                            Si crees que esto fue un error o necesitas cualquier aclaración, por favor contáctanos en 
                            <a href="mailto:soportearrendafacil@gmail.com" style="color: #2b6b6b; font-weight: 600; text-decoration: underline;">
                                soportearrendafacil@gmail.com
                            </a>.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Gracias por haber formado parte de ArrendaFacil 🏡
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Correo de eliminación de cuenta enviado a ${email}:`, info.messageId);
    } catch (error) {
        console.error('Error al enviar correo de eliminación de cuenta:', {
            message: error.message,
            code: error.code,
            response: error.response,
            stack: error.stack
        });
        throw new Error('No se pudo enviar el correo de eliminación de cuenta');
    }
}

// Función para enviar correo de publicación exitosa
async function sendPublicationSuccessEmail(email, title) {
    try {
        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '¡Publicación Creada Exitosamente en ArrendaFacil!',
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <!-- Encabezado -->
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Publicación Creada! ✅</h1>
                    </div>

                    <!-- Cuerpo -->
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">¡Felicidades!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Tu publicación <strong>"${title}"</strong> ha sido creada exitosamente en ArrendaFacil.
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            La publicación está ahora en revisión por nuestro equipo de administradores. Te notificaremos cuando haya sido aprobada o si necesitamos alguna acción adicional.
                        </p>

                        <!-- Icono de ayuda -->
                        <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-left: 4px solid #2b6b6b; border-radius: 6px;">
                            <p style="color: #4b5563; font-size: 15px; margin: 0;">
                                📌 Puedes editar tu publicación mientras esté en revisión desde tu panel de control.
                            </p>
                        </div>

                        <!-- Contacto -->
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                            Si necesitas ayuda o tienes preguntas, contáctanos en 
                            <a href="mailto:soportearrendafacil@gmail.com" style="color: #2b6b6b; font-weight: 600; text-decoration: underline;">
                                soportearrendafacil@gmail.com
                            </a>.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            ¡Gracias por elegir ArrendaFacil! 🏡
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Correo de publicación exitosa enviado a ${email}:`, info.messageId);
    } catch (error) {
        console.error('Error al enviar correo de publicación exitosa:', {
            message: error.message,
            code: error.code,
            response: error.response,
            stack: error.stack
        });
        throw new Error('No se pudo enviar el correo de publicación exitosa');
    }
}

// Función para enviar correo de publicación en revisión
async function sendPublicationReviewEmail(email, title) {
    try {
        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Tu Publicación en ArrendaFacil está en Revisión',
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <!-- Encabezado -->
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">Publicación en Revisión</h1>
                    </div>

                    <!-- Cuerpo -->
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">Gracias por tu publicación</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Tu publicación <strong>"${title}"</strong> ha sido recibida y está actualmente en revisión por nuestro equipo de administradores.
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Este proceso puede tomar hasta una hora. Recibirás una notificación cuando la publicación haya sido aprobada o si necesitamos alguna acción adicional de tu parte.
                        </p>

                        <!-- Contacto -->
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                            Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarnos en 
                            <a href="mailto:soportearrendafacil@gmail.com" style="color: #2b6b6b; font-weight: 600; text-decoration: underline;">
                                soportearrendafacil@gmail.com
                            </a>.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            ¡Gracias por elegir ArrendaFacil! 🏡
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Correo de publicación en revisión enviado a ${email}:`, info.messageId);
    } catch (error) {
        console.error('Error al enviar correo de publicación en revisión:', {
            message: error.message,
            code: error.code,
            response: error.response,
            stack: error.stack
        });
        throw new Error('No se pudo enviar el correo de publicación en revisión');
    }
}

//Función para enviar correo de publicación aprobada
async function sendPublicationApprovedEmail(email, title) {
    try {
        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '¡Tu Publicación en ArrendaFacil ha sido Aprobada!',
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <!-- Encabezado -->
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Publicación Aprobada! 🎉</h1>
                    </div>

                    <!-- Cuerpo -->
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">¡Felicidades!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Tu publicación <strong>"${title}"</strong> ha sido aprobada por nuestro equipo de administradores. ¡Ya está disponible para que los arrendatarios la descubran y se interesen por tu propiedad!
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Gracias por confiar en ArrendaFacil para conectar con arrendatarios. Estamos aquí para ayudarte en cada paso del proceso.
                        </p>

                        <!-- Contacto -->
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                            Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarnos en 
                            <a href="mailto:soportearrendafacil@gmail.com" style="color: #2b6b6b; font-weight: 600; text-decoration: underline;">
                                soportearrendafacil@gmail.com
                            </a>.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            ¡Gracias por elegir ArrendaFacil! 🏡
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Correo de publicación aprobada enviado a ${email}:`, info.messageId);
    } catch (error) {
        console.error('Error al enviar correo de publicación aprobada:', {
            message: error.message,
            code: error.code,
            response: error.response,
            stack: error.stack
        });
        throw new Error('No se pudo enviar el correo de publicación aprobada');
    }
}

// Función para enviar correo de publicación rechazada
async function sendPublicationRejectedEmail(email, title, reason, rejectionDetails) {
    try {
        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '⚠️ Tu Publicación en ArrendaFacil ha sido Rechazada',
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <!-- Encabezado -->
                    <div style="background: linear-gradient(135deg, #b91c1c, #ef4444); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">Publicación Rechazada ⚠️</h1>
                    </div>

                    <!-- Cuerpo -->
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #b91c1c; font-size: 22px; margin-top: 0;">Lo sentimos...</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Tu publicación <strong>"${title}"</strong> ha sido rechazada por nuestro equipo de administradores por el siguiente motivo:
                        </p>
                        <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 10px 0;">
                            Motivo: ${reason}
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            <strong>Detalles:</strong> ${rejectionDetails}
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Puedes modificar tu publicación y volver a enviarla para revisión. Asegúrate de corregir los problemas mencionados para que pueda ser aprobada.
                        </p>

                        <!-- Contacto -->
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                            Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarnos en 
                            <a href="mailto:soportearrendafacil@gmail.com" style="color: #b91c1c; font-weight: 600; text-decoration: underline;">
                                soportearrendafacil@gmail.com
                            </a>.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            ¡Esperamos verte pronto en ArrendaFacil! 🏡
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Correo de publicación rechazada enviado a ${email}:`, info.messageId);
    } catch (error) {
        console.error('Error al enviar correo de publicación rechazada:', {
            message: error.message,
            code: error.code,
            response: error.response,
            stack: error.stack
        });
        throw new Error('No se pudo enviar el correo de publicación rechazada');
    }
}

// Nueva función para enviar correo de publicación eliminada
async function sendPublicationDeletedEmail(email, title, reason, deletionDetails) {
    try {
        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🗑️ Tu Publicación en ArrendaFacil ha sido Eliminada',
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #b91c1c, #ef4444); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">Publicación Eliminada 🗑️</h1>
                    </div>
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #b91c1c; font-size: 22px; margin-top: 0;">Notificación</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Tu publicación <strong>"${title}"</strong> ha sido eliminada por nuestro equipo de administradores por el siguiente motivo:
                        </p>
                        <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 10px 0;">
                            Motivo: ${reason}
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            <strong>Detalles:</strong> ${deletionDetails}
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Si consideras que esto es un error o necesitas más información, por favor contáctanos.
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                            Puedes contactarnos en 
                            <a href="mailto:soportearrendafacil@gmail.com" style="color: #b91c1c; font-weight: 600; text-decoration: underline;">
                                soportearrendafacil@gmail.com
                            </a>.
                        </p>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Gracias por usar ArrendaFacil 🏡
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Correo de publicación eliminada enviado a ${email}:`, info.messageId);
    } catch (error) {
        console.error('Error al enviar correo de publicación eliminada:', {
            message: error.message,
            code: error.code,
            response: error.response,
            stack: error.stack
        });
        throw new Error('No se pudo enviar el correo de publicación eliminada');
    }
}

// Función para enviar correo de publicación eliminada por el arrendador 
async function sendPublicationDeletedByArrendadorEmail(recipientEmail, publicationTitle) {
    try {
        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject: `Tu publicación "${publicationTitle}" ha sido eliminada`,
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <!-- Encabezado -->
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">Publicación Eliminada 🗑️</h1>
                    </div>

                    <!-- Cuerpo -->
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">¡Acción Realizada!</h2>
                        
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Hemos procesado tu solicitud y la publicación <strong>"${publicationTitle}"</strong> ha sido eliminada de nuestra plataforma.
                        </p>

                        <!-- Nota importante -->
                        <div style="margin: 20px 0; padding: 15px; background-color: #fee2e2; border-left: 4px solid #b91c1c; border-radius: 6px;">
                            <p style="color: #7f1d1d; font-size: 15px; margin: 0; font-weight: 500;">
                                ⚠️ Esta acción es permanente y no se puede deshacer. Tus datos asociados a esta publicación han sido eliminados según lo solicitaste.
                            </p>
                        </div>

                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Si tienes alguna duda sobre este proceso o necesitas asistencia adicional, nuestro equipo está aquí para ayudarte.
                        </p>

                        <!-- Botón de contacto -->
                        <p style="margin: 20px 0 0;">
                            <a href="mailto:soportearrendafacil@gmail.com" style="display: inline-block; background-color: #2b6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; transition: background-color 0.3s;">
                                Contactar Soporte
                            </a>
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Este es un mensaje automático, por favor no respondas directamente a este correo.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil 🏡
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo de eliminación enviado a ${recipientEmail} para la publicación "${publicationTitle}"`);
    } catch (error) {
        console.error('Error al enviar el correo de eliminación:', error);
        throw new Error('Error al enviar el correo de eliminación');
    }
}

// Función para enviar correo de reporte de publicación
async function sendReportConfirmationEmail(email, title, reason, caseNumber) {
    try {
        const reasonText = {
            contenido_inapropiado: 'Contenido Inapropiado',
            informacion_falsa: 'Información Falsa',
            estafa: 'Sospecha de Estafa',
            otro: 'Otro'
        }[reason] || 'Otro';

        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Gracias por tu reporte #${caseNumber} en ArrendaFacil 🏡`,
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <!-- Encabezado -->
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Gracias por tu ayuda! 🙌</h1>
                    </div>

                    <!-- Cuerpo -->
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">Reporte recibido (#${caseNumber})</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Gracias por reportar la publicación <strong>"${title}"</strong>. Tu contribución ayuda a mantener nuestra comunidad segura y confiable.
                        </p>
                        <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 10px 0;">
                            Motivo: ${reasonText}
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Nuestro equipo técnico revisará tu reporte cuidadosamente. Por favor, guarda este número de caso (<strong>#${caseNumber}</strong>) para cualquier consulta futura con nuestro equipo de soporte.
                        </p>

                        <!-- Contacto -->
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                            Si tienes alguna duda, contáctanos en 
                            <a href="mailto:soportearrendafacil@gmail.com" style="color: #2b6b6b; font-weight: 600; text-decoration: underline;">
                                soportearrendafacil@gmail.com
                            </a> y menciona tu número de caso.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Gracias por ser parte de ArrendaFacil 🏡
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Correo de confirmación de reporte enviado a ${email} con caso ${caseNumber}:`, info.messageId);
    } catch (error) {
        console.error('Error al enviar correo de confirmación de reporte:', {
            message: error.message,
            code: error.code,
            response: error.response,
            stack: error.stack
        });
        throw new Error('No se pudo enviar el correo de confirmación de reporte');
    }
}

// Función para enviar correo de rechazo de reporte
async function sendReportRejectionEmail(email, publicationTitle, caseNumber, rejectionReason) {
    try {
        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Reporte #${caseNumber} rechazado en ArrendaFacil 🏡`,
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <!-- Encabezado -->
                    <div style="background: linear-gradient(135deg, #dc2626, #f87171); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">Reporte Rechazado</h1>
                    </div>

                    <!-- Cuerpo -->
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #dc2626; font-size: 22px; margin-top: 0;">Reporte #${caseNumber}</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Lamentamos informarte que tu reporte sobre la publicación <strong>"${publicationTitle}"</strong> ha sido rechazado.
                        </p>
                        <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 10px 0;">
                            Razón del rechazo: ${rejectionReason}
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Si tienes alguna duda o necesitas más información, por favor contáctanos mencionando el número de caso (<strong>#${caseNumber}</strong>).
                        </p>

                        <!-- Contacto -->
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                            Contáctanos en 
                            <a href="mailto:soportearrendafacil@gmail.com" style="color: #2b6b6b; font-weight: 600; text-decoration: underline;">
                                soportearrendafacil@gmail.com
                            </a>.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Gracias por ser parte de ArrendaFacil 🏡
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Correo de rechazo de reporte enviado a ${email} con caso ${caseNumber}:`, info.messageId);
    } catch (error) {
        console.error('Error al enviar correo de rechazo de reporte:', {
            message: error.message,
            code: error.code,
            response: error.response,
            stack: error.stack
        });
        throw new Error('No se pudo enviar el correo de rechazo de reporte');
    }
}

// Correo para el arrendatario cuyo reporte fue aceptado
async function sendReportAcceptedEmail(tenantEmail, title, caseNumber) {
    try {
        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: tenantEmail,
            subject: `Reporte #${caseNumber}: Publicación Eliminada`,
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <!-- Encabezado -->
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">Reporte Procesado ✅</h1>
                        <p style="color: white; font-size: 16px; margin-top: 8px; opacity: 0.9;">#R-${caseNumber}</p>
                    </div>

                    <!-- Cuerpo -->
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">¡Acción Realizada!</h2>
                        
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Estimado/a usuario/a,
                        </p>

                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Gracias por reportar la publicación "<strong>${title}</strong>". Tu reporte (#${caseNumber}) ha sido revisado, y la publicación ha sido eliminada de nuestra plataforma.
                        </p>

                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Apreciamos tu colaboración para mantener nuestra comunidad segura y confiable. Si tienes alguna duda sobre este proceso, no dudes en contactarnos.
                        </p>

                        <!-- Botón de contacto -->
                        <p style="margin: 20px 0 0;">
                            <a href="mailto:soportearrendafacil@gmail.com" style="display: inline-block; background-color: #2b6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; transition: background-color 0.3s;">
                                Contactar Soporte
                            </a>
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Este es un mensaje automático, por favor no respondas directamente a este correo.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil 🏡
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo de reporte procesado enviado a ${tenantEmail}`);
    } catch (error) {
        console.error('Error al enviar el correo de reporte procesado:', error);
        throw new Error('Error al enviar el correo de reporte procesado');
    }
}

// Correo para notificar al arrendador sobre una nueva conversación
async function sendConversationStartedEmail(landlordEmail, tenantName, publicationTitle, conversationId) {
    try {
        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: landlordEmail,
            subject: `¡Nuevo interés en tu publicación "${publicationTitle}"!`,
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <!-- Encabezado -->
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Nueva Conversación! 💬</h1>
                    </div>

                    <!-- Cuerpo -->
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">¡Alguien está interesado!</h2>
                        
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Hola,
                        </p>

                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            <strong>${tenantName}</strong> ha mostrado interés en tu publicación "<strong>${publicationTitle}</strong>" y ha iniciado una conversación contigo.
                        </p>

                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            ¡Responde ahora para conectar con este arrendatario y cerrar el trato!
                        </p>

                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Este es un mensaje automático, por favor no respondas directamente a este correo.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil 🏡
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo de nueva conversación enviado a ${landlordEmail}`);
    } catch (error) {
        console.error('Error al enviar el correo de nueva conversación:', error);
        throw new Error('Error al enviar el correo de nueva conversación');
    }
}

// Correo para notificar al arrendador del éxito del contrato
async function sendAgreementCreatedEmail(landlordEmail, publicationTitle, contractId) {
    try {
        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: landlordEmail,
            subject: `¡Acuerdo creado exitosamente para "${publicationTitle}"!`,
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Acuerdo Creado! 📝</h1>
                    </div>
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">¡Tu contrato está listo!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Hola,
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            El acuerdo para tu publicación "<strong>${publicationTitle}</strong>" (Contrato ID: <strong>${contractId}</strong>) ha sido creado exitosamente.
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Está pendiente la firma del arrendatario. Te notificaremos cuando se complete.
                        </p>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Este es un mensaje automático, por favor no respondas directamente a este correo.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil 🏡
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo de acuerdo creado enviado a ${landlordEmail}`);
    } catch (error) {
        console.error('Error al enviar el correo de acuerdo creado:', error);
        throw new Error('Error al enviar el correo de acuerdo creado');
    }
}

// Correo para notificar al arrendatario que debe revisar y firmar el contrato
async function sendAgreementPendingEmail(tenantEmail, publicationTitle, contractId, contractPath) {
    try {
        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: tenantEmail,
            subject: `Tienes un contrato pendiente para "${publicationTitle}"`,
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Contrato Pendiente! 📜</h1>
                    </div>
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">¡Es hora de firmar!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Hola,
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Se ha generado un contrato para la publicación "<strong>${publicationTitle}</strong>" (Contrato ID: <strong>${contractId}</strong>).
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Por favor, revisa el contrato adjunto y fírmalo para confirmar el acuerdo.
                        </p>
                        <a href="${process.env.SOCKET_URL_LOCALHOST || 'http://localhost:3000'}/contracts/contrato_${contractId}.pdf" style="
                            display: inline-block; background: linear-gradient(135deg, #2b6b6b, #4c9f9f); color: white;
                            padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; margin: 10px 0;
                        ">Descargar Contrato</a>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Este es un mensaje automático, por favor no respondas directamente a este correo.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil 🏡
                        </p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: `contrato_${contractId}.pdf`,
                    path: path.join(__dirname, '../public', contractPath)
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo de contrato pendiente enviado a ${tenantEmail}`);
    } catch (error) {
        console.error('Error al enviar el correo de contrato pendiente:', error);
        throw new Error('Error al enviar el correo de contrato pendiente');
    }
}

// Correo para notificar al arrendatario que ha subido el contrato firmado
async function sendContractUploadedEmail(tenantEmail, publicationTitle, contractId) {
    try {
        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: tenantEmail,
            subject: `Contrato Firmado Subido para "${publicationTitle}"`,
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Contrato Subido! 📜</h1>
                    </div>
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">¡Gracias por tu acción!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Hola,
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Has subido exitosamente el contrato firmado para la publicación "<strong>${publicationTitle}</strong>" (Contrato ID: <strong>${contractId}</strong>).
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            El arrendador ha sido notificado y revisará el documento pronto.
                        </p>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Este es un mensaje automático, por favor no respondas directamente a este correo.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil 🏡
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo de contrato subido enviado a ${tenantEmail}`);
    } catch (error) {
        console.error('Error al enviar el correo de contrato subido:', error);
        throw new Error('Error al enviar el correo de contrato subido');
    }
}

// Correo para notificar al arrendador que el arrendatario ha subido el contrato firmado
async function sendContractUploadedNotificationEmail(landlordEmail, publicationTitle, contractId, tenantName, filePath) {
    const fs = require('fs').promises;
    const path = require('path');

    try {
        // Verificar que el archivo existe
        const absoluteFilePath = path.resolve(filePath);
        await fs.access(absoluteFilePath); // Lanza un error si el archivo no existe

        // Generar el enlace de descarga
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000'; // Cambia a tu dominio o IP en producción
        const downloadUrl = `${baseUrl}/signed_contracts/signed_${contractId}.pdf`;

        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: landlordEmail,
            subject: `El arrendatario ha subido el contrato firmado para "${publicationTitle}"`,
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Contrato Firmado Recibido! 📜</h1>
                    </div>
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">¡Acción Requerida!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Hola,
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            El arrendatario <strong>${tenantName}</strong> ha subido el contrato firmado para la publicación "<strong>${publicationTitle}</strong>" (Contrato ID: <strong>${contractId}</strong>).
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            El contrato firmado está adjunto en este correo. También puedes descargarlo haciendo clic en el siguiente botón:
                        </p>
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="${downloadUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2b6b6b; color: white; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; transition: background-color 0.3s;">
                                Descargar Contrato Firmado
                            </a>
                        </div>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Por favor, revisa el documento y toma las acciones necesarias.
                        </p>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Este es un mensaje automático, por favor no respondas directamente a este correo.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil 🏡
                        </p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: `signed_${contractId}.pdf`,
                    path: absoluteFilePath,
                    contentType: 'application/pdf'
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo de notificación de contrato subido enviado a ${landlordEmail} con el archivo adjunto y enlace de descarga`);
    } catch (error) {
        console.error('Error al enviar el correo de notificación de contrato subido:', error);
        throw new Error('Error al enviar el correo de notificación de contrato subido');
    }
}

// Correo para notificar que el acuerdo ha sido aceptado
async function sendContractAcceptedEmail(recipientEmail, publicationTitle, contractId, role) {
    try {
        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject: `¡Acuerdo Aceptado! Contrato ${contractId}`,
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Acuerdo Aceptado! 🎉</h1>
                    </div>
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">¡Felicidades!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Hola,
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Nos complace informarte que el acuerdo para la publicación "<strong>${publicationTitle}</strong>" (Contrato ID: <strong>${contractId}</strong>) ha sido aceptado exitosamente como ${role}.
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Gracias por confiar en ArrendaFacil. ¡Esperamos que esta sea una gran experiencia!
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Si necesitas asistencia, contáctanos a través de la plataforma.
                        </p>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Este es un mensaje automático, por favor no respondas directamente a este correo.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil 🏡
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo de notificación de contrato aceptado enviado a ${recipientEmail}`);
    } catch (error) {
        console.error('Error al enviar el correo de notificación de contrato aceptado:', error);
        throw new Error('Error al enviar el correo de notificación de contrato aceptado');
    }
}

// Correo para notificar al arrendatario que el contrato fue rechazado
function sendContractRejectedEmail(tenantEmail, publicationTitle, contractId, filePath, callback) {
    const mailOptions = {
        from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
        to: tenantEmail,
        subject: `Contrato ${contractId} Rechazado - Intenta de Nuevo`,
        html: `
            <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #dc2626, #f87171); padding: 30px; text-align: center;">
                    <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">Contrato Rechazado 📝</h1>
                </div>
                <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                    <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">¡Intenta de Nuevo!</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                        Hola,
                    </p>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                        El contrato para la publicación "<strong>${publicationTitle || 'Desconocido'}</strong>" (Contrato ID: <strong>${contractId}</strong>) ha sido rechazado.
                    </p>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                        Por favor, revisa el contrato y súbelo nuevamente asegurándote de que cumple con los requisitos. ${
                            filePath ? 'El contrato rechazado está adjunto en este correo para tu referencia.' : 'No se encontró el contrato firmado para adjuntar.'
                        }
                    </p>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                        Si tienes dudas, contáctanos a través de la plataforma.
                    </p>
                </div>
                <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                        Este es un mensaje automático, por favor no respondas directamente a este correo.
                    </p>
                    <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                        Saludos cordiales,<br>El equipo de ArrendaFacil 🏡
                    </p>
                </div>
            </div>
        `,
        attachments: []
    };

    if (filePath) {
        const absoluteFilePath = path.resolve(filePath);
        console.log(`Intentando adjuntar archivo: ${absoluteFilePath}`);
        fs.access(absoluteFilePath, fs.constants.F_OK, (accessError) => {
            if (accessError) {
                console.warn(`No se pudo acceder al archivo ${absoluteFilePath}: ${accessError.message}`);
                // Enviar correo sin adjunto
                transporter.sendMail(mailOptions, (mailError, info) => {
                    if (mailError) {
                        console.error('Error al enviar el correo de notificación de contrato rechazado:', mailError);
                        return callback(new Error(`Error al enviar el correo: ${mailError.message}`));
                    }
                    console.log(`Correo de notificación de contrato rechazado enviado a ${tenantEmail} sin adjunto`);
                    callback(null);
                });
            } else {
                // Archivo existe, adjuntarlo
                mailOptions.attachments.push({
                    filename: `signed_${contractId}.pdf`,
                    path: absoluteFilePath,
                    contentType: 'application/pdf'
                });
                transporter.sendMail(mailOptions, (mailError, info) => {
                    if (mailError) {
                        console.error('Error al enviar el correo de notificación de contrato rechazado:', mailError);
                        return callback(new Error(`Error al enviar el correo: ${mailError.message}`));
                    }
                    console.log(`Correo de notificación de contrato rechazado enviado a ${tenantEmail} con adjunto`);
                    callback(null);
                });
            }
        });
    } else {
        console.log('No se proporcionó filePath para adjuntar.');
        // Enviar correo sin adjunto
        transporter.sendMail(mailOptions, (mailError, info) => {
            if (mailError) {
                console.error('Error al enviar el correo de notificación de contrato rechazado:', mailError);
                return callback(new Error(`Error al enviar el correo: ${mailError.message}`));
            }
            console.log(`Correo de notificación de contrato rechazado enviado a ${tenantEmail} sin adjunto`);
            callback(null);
        });
    }
}

// Correo para notificar al arrendatario que se ha actualizado el contrato
async function sendContractUpdatedEmailTenant(tenantEmail, publicationTitle, contractId, filePath) {
    const fs = require('fs').promises;
    const path = require('path');

    try {
        // Verificar que el archivo existe
        const absoluteFilePath = path.resolve(filePath);
        await fs.access(absoluteFilePath);

        // Generar el enlace de descarga
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const downloadUrl = `${baseUrl}/contracts/contrato_${contractId}.pdf`;

        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: tenantEmail,
            subject: `Contrato Actualizado para "${publicationTitle}" (ID: ${contractId})`,
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Contrato Actualizado! 📝</h1>
                    </div>
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">¡Toma nota!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Hola,
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            El arrendador ha actualizado el contrato para la publicación "<strong>${publicationTitle}</strong>" (Contrato ID: <strong>${contractId}</strong>).
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            El nuevo contrato está adjunto y también puedes descargarlo haciendo clic en el siguiente botón. Por favor, revisa y fírmalo para cerrar el acuerdo.
                        </p>
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="${downloadUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2b6b6b; color: white; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; transition: background-color 0.3s;">
                                Descargar y Firmar Contrato
                            </a>
                        </div>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Este es un mensaje automático, por favor no respondas directamente a este correo.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil 🏡
                        </p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: `contrato_${contractId}.pdf`,
                    path: absoluteFilePath,
                    contentType: 'application/pdf'
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo de contrato actualizado enviado a ${tenantEmail}`);
    } catch (error) {
        console.error('Error al enviar el correo de contrato actualizado al arrendatario:', error);
        throw new Error('Error al enviar el correo de contrato actualizado al arrendatario');
    }
}

// Coreo para notificar al arrendador sobre la actualizacion del contrato
async function sendContractUpdatedEmailLandlord(landlordEmail, publicationTitle, contractId, tenantName, filePath) {
    const fs = require('fs').promises;
    const path = require('path');

    try {
        // Verificar que el archivo existe
        const absoluteFilePath = path.resolve(filePath);
        await fs.access(absoluteFilePath);

        // Generar el enlace de descarga
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const downloadUrl = `${baseUrl}/contracts/contrato_${contractId}.pdf`;

        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: landlordEmail,
            subject: `Contrato Actualizado para "${publicationTitle}" (ID: ${contractId})`,
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Contrato Actualizado! 📝</h1>
                    </div>
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">¡Acción Requerida!</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Hola,
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Has actualizado el contrato para la publicación "<strong>${publicationTitle}</strong>" (Contrato ID: <strong>${contractId}</strong>).
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            El nuevo contrato está adjunto y también puedes descargarlo haciendo clic en el siguiente botón. El arrendatario, <strong>${tenantName}</strong>, debe firmarlo para completar el proceso.
                        </p>
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="${downloadUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2b6b6b; color: white; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; transition: background-color 0.3s;">
                                Descargar Contrato Actualizado
                            </a>
                        </div>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Este es un mensaje automático, por favor no respondas directamente a este correo.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil 🏡
                        </p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: `contrato_${contractId}.pdf`,
                    path: absoluteFilePath,
                    contentType: 'application/pdf'
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo de contrato actualizado enviado a ${landlordEmail}`);
    } catch (error) {
        console.error('Error al enviar el correo de contrato actualizado al arrendador:', error);
        throw new Error('Error al enviar el correo de contrato actualizado al arrendador');
    }
}

// Correo para notificar al arrendador sobre la expiración del contrato
async function sendContractExpiredEmailLandlord(landlordEmail, publicationTitle, contractId, expirationDate) {
    try {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const actionUrl = `${baseUrl}/acuerdos`;

        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: landlordEmail,
            subject: `Contrato ${contractId} ha expirado`,
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Contrato Expirado! ⏰</h1>
                    </div>
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">Notificación de Expiración</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Hola,
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Le informamos que el contrato con ID <strong>${contractId}</strong> para la publicación "<strong>${publicationTitle}</strong>" ha expirado el <strong>${expirationDate}</strong>.
                        </p>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Este es un mensaje automático, por favor no respondas directamente a este correo.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil 🏡
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo de expiración enviado a ${landlordEmail}`);
    } catch (error) {
        console.error('Error al enviar el correo de expiración al arrendador:', error);
        throw new Error('Error al enviar el correo de expiración al arrendador');
    }
}

// Correo para notificar al arrendatario sobre la expiración del contrato
async function sendContractExpiredEmailTenant(tenantEmail, publicationTitle, contractId, expirationDate) {
    try {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const actionUrl = `${baseUrl}/acuerdos`;

        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: tenantEmail,
            subject: `Contrato ${contractId} ha expirado`,
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Contrato Expirado! ⏰</h1>
                    </div>
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">Notificación de Expiración</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Hola,
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Le informamos que el contrato con ID <strong>${contractId}</strong> para la publicación "<strong>${publicationTitle}</strong>" ha expirado el <strong>${expirationDate}</strong>.
                        </p>
                        <div style="text-align: center; margin: 20px 0;">
                        </div>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Este es un mensaje automático, por favor no respondas directamente a este correo.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil 🏡
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo de expiración enviado a ${tenantEmail}`);
    } catch (error) {
        console.error('Error al enviar el correo de expiración al arrendatario:', error);
        throw new Error('Error al enviar el correo de expiración al arrendatario');
    }
}

// Correo para notificar al arrendador sobre la cancelación del contrato
async function sendContractCancelledEmailLandlord(landlordEmail, publicationTitle, contractId, startDate, endDate, reason) {
    try {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const actionUrl = `${baseUrl}/acuerdos`;

        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: landlordEmail,
            subject: `Contrato ${contractId} ha sido cancelado`,
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Contrato Cancelado! ⏰</h1>
                    </div>
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">Notificación de Cancelación</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Hola,
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Te informamos que el contrato con ID <strong>${contractId}</strong> para la publicación "<strong>${publicationTitle}</strong>" ha sido cancelado. 
                            Detalles del contrato: Inicio: <strong>${startDate}</strong>, Fin: <strong>${endDate}</strong>.
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Motivo de la cancelación: <strong>${reason}</strong>
                        </p>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Este es un mensaje automático, por favor no respondas directamente a este correo.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil 🏡
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo de cancelación enviado a ${landlordEmail}`);
    } catch (error) {
        console.error('Error al enviar el correo de cancelación al arrendador:', error);
        throw new Error('Error al enviar el correo de cancelación al arrendador');
    }
}

// Correo para notificar al arrendatario sobre la cancelación del contrato
async function sendContractCancelledEmailTenant(tenantEmail, publicationTitle, contractId, startDate, endDate, reason) {
    try {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const actionUrl = `${baseUrl}/acuerdos`;

        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: tenantEmail,
            subject: `Contrato ${contractId} ha sido cancelado`,
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Contrato Cancelado! ⏰</h1>
                    </div>
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">Notificación de Cancelación</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Hola,
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Te informamos que el contrato con ID <strong>${contractId}</strong> para la publicación "<strong>${publicationTitle}</strong>" ha sido cancelado. 
                            Detalles del contrato: Inicio: <strong>${startDate}</strong>, Fin: <strong>${endDate}</strong>.
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Motivo de la cancelación: <strong>${reason}</strong>
                        </p>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Este es un mensaje automático, por favor no respondas directamente a este correo.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil 🏡
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo de cancelación enviado a ${tenantEmail}`);
    } catch (error) {
        console.error('Error al enviar el correo de cancelación al arrendatario:', error);
        throw new Error('Error al enviar el correo de cancelación al arrendatario');
    }
}

// Correo para notificar al arrendatario sobre una nueva calificación
async function sendRatingReceivedEmail(tenantEmail, landlordName, contractId, publicationTitle, rating, comment) {
    try {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const actionUrl = `${baseUrl}/perfil/${tenantEmail}`;

        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: tenantEmail,
            subject: `Nueva calificación recibida para el contrato ${contractId}`,
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Nueva Calificación Recibida! ⭐</h1>
                    </div>
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">Notificación de Calificación</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Hola,
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            El arrendador <strong>${landlordName}</strong> te ha dejado una calificación de <strong>${rating} estrella${rating !== 1 ? 's' : ''}</strong> para el contrato <strong>#${contractId}</strong> de la publicación "<strong>${publicationTitle}</strong>".
                        </p>
                        ${comment ? `
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Comentario: <strong>${comment}</strong>
                        </p>
                        ` : ''}
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Puedes revisar los detalles en la comunidad de la plataforma.
                        </p>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Este es un mensaje automático, por favor no respondas directamente a este correo.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil 🏡
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo de notificación de calificación enviado a ${tenantEmail}`);
    } catch (error) {
        console.error('Error al enviar el correo de notificación de calificación:', error);
        throw new Error('Error al enviar el correo de notificación de calificación');
    }
}

// Correo para notificar al arrendador sobre una nueva calificación
async function sendLandlordRatingReceivedEmail(landlordEmail, tenantName, contractId, publicationTitle, rating, comment) {
    try {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const actionUrl = `${baseUrl}/perfil/${landlordEmail}`;

        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: landlordEmail,
            subject: `Nueva calificación recibida para el contrato ${contractId}`,
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Nueva Calificación Recibida! ⭐</h1>
                    </div>
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <h2 style="color: #2b6b6b; font-size: 22px; margin-top: 0;">Notificación de Calificación</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Hola,
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            El arrendatario <strong>${tenantName}</strong> te ha dejado una calificación de <strong>${rating} estrella${rating !== 1 ? 's' : ''}</strong> para el contrato <strong>#${contractId}</strong> de la publicación "<strong>${publicationTitle}</strong>".
                        </p>
                        ${comment ? `
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Comentario: <strong>${comment}</strong>
                        </p>
                        ` : ''}
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Puedes revisar los detalles en la comunidad de la plataforma.
                        </p>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Este es un mensaje automático, por favor no respondas directamente a este correo.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil 🏡
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo de notificación de calificación enviado a ${landlordEmail}`);
    } catch (error) {
        console.error('Error al enviar el correo de notificación de calificación:', error);
        throw new Error('Error al enviar el correo de notificación de calificación');
    }
}

// Correo para notificar al arrendador que puede calificar al arrendatario
async function sendRatingAvailableEmailLandlord(landlordEmail, contractId, publicationTitle) {
    try {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const actionUrl = `${baseUrl}/calificar/${contractId}`;

        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: landlordEmail,
            subject: `Ya puedes calificar al arrendatario del contrato ${contractId}`,
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Tu contrato ha finalizado! 📝</h1>
                    </div>
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Hola,
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            El contrato <strong>#${contractId}</strong> con la publicación "<strong>${publicationTitle}</strong>" ha finalizado. 
                            Ahora puedes calificar al arrendatario en la plataforma.
                        </p>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Este es un mensaje automático, por favor no respondas directamente a este correo.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil 🏡
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo de calificación disponible enviado a ${landlordEmail}`);
    } catch (error) {
        console.error('Error al enviar el correo de calificación disponible:', error);
        throw new Error('Error al enviar el correo de calificación disponible');
    }
}

// Correo para notificar al arrendatario que puede calificar al arrendador
async function sendRatingAvailableEmailTenant(tenantEmail, contractId, publicationTitle) {
    try {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const actionUrl = `${baseUrl}/calificar/${contractId}`;

        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: tenantEmail,
            subject: `Ya puedes calificar al arrendador del contrato ${contractId}`,
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Tu contrato ha finalizado! 📝</h1>
                    </div>
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Hola,
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            El contrato <strong>#${contractId}</strong> con la publicación "<strong>${publicationTitle}</strong>" ha finalizado. 
                            Ahora puedes calificar al arrendador en la plataforma.
                        </p>
                        <a href="${actionUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2b6b6b; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px;">
                            Calificar Ahora
                        </a>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Este es un mensaje automático, por favor no respondas directamente a este correo.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil 🏡
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo de calificación disponible enviado a ${tenantEmail}`);
    } catch (error) {
        console.error('Error al enviar el correo de calificación disponible:', error);
        throw new Error('Error al enviar el correo de calificación disponible');
    }
}

// Correo para notificar al arrendatario que su contrato está por expirar (1 día antes)
async function sendContractExpiringEmailTenant(tenantEmail, contractId, publicationTitle, endDate) {
    try {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const actionUrl = `${baseUrl}/contratos/${contractId}`;

        const mailOptions = {
            from: `"ArrendaFacil" <${process.env.EMAIL_USER}>`,
            to: tenantEmail,
            subject: `Tu contrato ${contractId} está por expirar`,
            html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #2b6b6b, #4c9f9f); padding: 30px; text-align: center;">
                        <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">¡Atención, tu contrato expira pronto! ⏰</h1>
                    </div>
                    <div style="padding: 30px; background-color: white; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Hola,
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0;">
                            Tu contrato <strong>#${contractId}</strong> con la publicación "<strong>${publicationTitle}</strong>" está por expirar el ${endDate}. 
                            Te recomendamos hablar con el arrendador para ampliar el plazo o darlo por terminado.
                        </p>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Este es un mensaje automático, por favor no respondas directamente a este correo.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                            Saludos cordiales,<br>El equipo de ArrendaFacil 🏡
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo de contrato por expirar enviado a ${tenantEmail}`);
    } catch (error) {
        console.error('Error al enviar el correo de contrato por expirar:', error);
        throw new Error('Error al enviar el correo de contrato por expirar');
    }
}

module.exports = {
    sendVerificationEmail,
    sendUnlockVerificationEmail,
    sendPasswordResetEmail,
    sendPasswordResetSuccessEmail,
    sendWelcomeEmail,
    sendAccountDeletionEmail,
    sendPublicationSuccessEmail,
    sendPublicationReviewEmail,
    sendPublicationApprovedEmail,
    sendPublicationRejectedEmail,
    sendPublicationDeletedEmail,
    sendPublicationDeletedByArrendadorEmail,
    sendReportConfirmationEmail,
    sendReportRejectionEmail,
    sendReportAcceptedEmail,
    sendConversationStartedEmail,
    sendAgreementCreatedEmail,
    sendAgreementPendingEmail,
    sendContractUploadedEmail,
    sendContractUploadedNotificationEmail,
    sendContractAcceptedEmail,
    sendContractRejectedEmail,
    sendContractUpdatedEmailTenant,
    sendContractUpdatedEmailLandlord,
    sendContractExpiredEmailLandlord,
    sendContractExpiredEmailTenant,
    sendContractCancelledEmailLandlord,
    sendContractCancelledEmailTenant,
    sendRatingReceivedEmail,
    sendLandlordRatingReceivedEmail,
    sendRatingAvailableEmailLandlord,
    sendRatingAvailableEmailTenant,
    sendContractExpiringEmailTenant
};
