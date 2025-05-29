const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { sendVerificationEmail, sendWelcomeEmail } = require('../utils/email');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const verificationCodes = {};
const users = [];

function generateVerificationCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// Configurar cliente de Google OAuth
const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Verificación de email en users y admins
router.post('/check-email', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Correo electrónico requerido'
            });
        }

        console.log('Verificando correo:', email);

        // Verificar en users
        const [userRows] = await pool.execute(
            'SELECT email FROM users WHERE email = ?',
            [email]
        );

        // Verificar en admins
        const [adminRows] = await pool.execute(
            'SELECT email FROM admins WHERE email = ?',
            [email]
        );

        const exists = userRows.length > 0 || adminRows.length > 0;

        console.log('Correo existe en users:', userRows.length > 0);
        console.log('Correo existe en admins:', adminRows.length > 0);

        return res.status(200).json({
            success: true,
            exists
        });
    } catch (error) {
        console.error('Error al verificar correo:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar el correo'
        });
    }
});

// Enviar código de verificación
router.post('/send-verification-code', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Correo electrónico requerido'
            });
        }

        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        verificationCodes[email] = { code, expiresAt };

        await sendVerificationEmail(email, code);

        return res.status(200).json({
            success: true,
            message: 'Código de verificación enviado al correo'
        });
    } catch (error) {
        console.error('Error al enviar código:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al enviar el código de verificación'
        });
    }
});

// Verificar código
router.post('/verify-code', async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Correo y código son requeridos'
            });
        }

        const storedCode = verificationCodes[email];
        if (!storedCode) {
            return res.status(400).json({
                success: false,
                message: 'No se encontró un código de verificación para este correo'
            });
        }

        if (new Date() > storedCode.expiresAt) {
            delete verificationCodes[email];
            return res.status(400).json({
                success: false,
                message: 'El código de verificación ha expirado'
            });
        }

        if (storedCode.code === code.toUpperCase()) {
            delete verificationCodes[email];
            return res.status(200).json({
                success: true,
                message: 'Código verificado correctamente'
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Código de verificación incorrecto'
            });
        }
    } catch (error) {
        console.error('Error al verificar código:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar el código'
        });
    }
});

// Registro de usuario (Tradicional)
router.post('/register', async (req, res) => {
    try {
        const {
            full_name,
            fullName,
            email,
            role,
            phoneNumber,
            password,
            recoveryQuestion = '',
            recoveryAnswer = '',
            googleId = null
        } = req.body;

        const finalFullName = full_name || fullName;

        const missingFields = [];
        if (!finalFullName) missingFields.push('full_name');
        if (!email) missingFields.push('email');
        if (!role) missingFields.push('role');
        if (!phoneNumber) missingFields.push('phoneNumber');
        if (!password && !googleId) missingFields.push('password');

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Faltan datos requeridos: ${missingFields.join(', ')}`
            });
        }

        const [existingUser] = await pool.execute(
            'SELECT email FROM users WHERE email = ?',
            [email]
        );
        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico ya está registrado'
            });
        }

        let hashedPassword = null;
        if (password) {
            const saltRounds = 10;
            hashedPassword = await bcrypt.hash(password, saltRounds);
        }

        await pool.execute(
            `INSERT INTO users (full_name, email, role, phone_number, recovery_question, recovery_answer, password, google_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                finalFullName,
                email,
                role,
                phoneNumber,
                recoveryQuestion,
                recoveryAnswer,
                hashedPassword,
                googleId
            ]
        );

        sendWelcomeEmail(email, role).catch(error => {
            console.error('Error al enviar correo de bienvenida:', error);
        });

        return res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente.'
        });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al registrar el usuario'
        });
    }
});

// Ruta para iniciar el flujo de OAuth con Google
router.get('/google', (req, res) => {
    const authUrl = googleClient.generateAuthUrl({
        scope: ['profile', 'email', 'openid'],
        redirect_uri: process.env.GOOGLE_REDIRECT_URI
    });
    res.redirect(authUrl);
});

// Ruta de callback de Google
router.get('/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.redirect('/registerGoogle?success=false&error=Falta el código de autorización');
        }

        // Intercambiar el código por un token de acceso
        const { tokens } = await googleClient.getToken({
            code,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI
        });

        // Establecer las credenciales en el cliente
        googleClient.setCredentials(tokens);

        // Obtener información del usuario desde Google
        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const user = {
            googleId: payload['sub'], // ID de Google del usuario
            email: payload['email'],  // Correo del usuario
            displayName: payload['name'] // Nombre del usuario (opcional)
        };

        if (!user.email || !user.googleId) {
            return res.redirect('/registerGoogle?success=false&error=Autenticación fallida: Datos incompletos');
        }

        // Redirigir con los datos del usuario
        res.redirect(`/registerGoogle?success=true&email=${encodeURIComponent(user.email)}&googleId=${user.googleId}`);
    } catch (error) {
        console.error('Error en /google/callback:', error);
        res.redirect('/registerGoogle?success=false&error=Error interno del servidor');
    }
});

// Ruta para registrar al usuario con Google
router.post('/register-google', async (req, res) => {
    const { fullName, email, role, phoneNumber, googleId } = req.body;

    try {
        await pool.execute(
            'INSERT INTO users (full_name, email, role, phone_number, google_id) VALUES (?, ?, ?, ?, ?)',
            [fullName, email, role, phoneNumber, googleId]
        );

        res.json({ success: true, message: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error('Error al registrar usuario con Google:', error);
        res.status(500).json({ success: false, message: 'Error al registrar usuario' });
    }
});

// Enviar correo de bienvenida
router.post('/send-welcome-email', async (req, res) => {
    try {
        const { email, role, delay = 0 } = req.body;
        if (!email || !role) {
            return res.status(400).json({ success: false, message: 'Correo y rol son requeridos' });
        }

        if (delay > 0) {
            console.log(`Esperando ${delay}ms antes de enviar correo a: ${email}`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        await sendWelcomeEmail(email, role);
        return res.status(200).json({ success: true, message: 'Correo de bienvenida programado' });
    } catch (error) {
        console.error('Error al enviar correo de bienvenida:', error);
        return res.status(500).json({ success: false, message: 'Error al enviar el correo de bienvenida' });
    }
});

module.exports = router;