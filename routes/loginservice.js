const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { OAuth2Client } = require('google-auth-library');
const { sendUnlockVerificationEmail, sendPasswordResetEmail, sendPasswordResetSuccessEmail } = require('../utils/email');
const crypto = require('crypto');

// Configurar cliente de Google OAuth para login
const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI_LOGIN
);

// Objeto para almacenar códigos de verificación
const verificationCodes = {};

// Generar un código de verificación
function generateVerificationCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// Generar un token de "Recordarme"
function generateRememberToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Generar un token de restablecimiento de contraseña
function generatePasswordResetToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Traditional Login (Email/Password)
router.post('/login', async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Correo y contraseña son requeridos'
            });
        }

        // Check if the user exists in the admins table
        const [adminRows] = await pool.execute(
            'SELECT * FROM admins WHERE email = ?',
            [email]
        );

        let user = null;
        let isAdmin = false;

        if (adminRows.length > 0) {
            // User is an admin
            isAdmin = true;
            user = adminRows[0];

            // Compare the password (plaintext for admins, as per your setup)
            if (password !== user.password) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales incorrectas'
                });
            }
        } else {
            // Check if the user exists in the users table
            const [userRows] = await pool.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );

            if (userRows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales incorrectas'
                });
            }

            user = userRows[0];

            // If the user has a google_id, they must use Google login
            if (user.google_id && !user.password) {
                return res.status(400).json({
                    success: false,
                    message: 'Este usuario debe iniciar sesión con Google'
                });
            }

            // Check if the account is locked
            if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
                return res.status(403).json({
                    success: false,
                    message: 'Tu cuenta ha sido bloqueada temporalmente debido a múltiples intentos fallidos. Por favor, verifica tu identidad para desbloquearla.'
                });
            }

            // Compare the password for regular users
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                // Increment failed login attempts
                const newAttempts = user.failed_login_attempts + 1;
                let lockoutUntil = null;

                if (newAttempts >= 5) {
                    // Lock the account for 15 minutes
                    lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
                }

                await pool.execute(
                    'UPDATE users SET failed_login_attempts = ?, lockout_until = ? WHERE email = ?',
                    [newAttempts, lockoutUntil, email]
                );

                if (newAttempts >= 5) {
                    return res.status(403).json({
                        success: false,
                        message: 'Tu cuenta ha sido bloqueada temporalmente debido a múltiples intentos fallidos. Por favor, verifica tu identidad para desbloquearla.'
                    });
                }

                return res.status(401).json({
                    success: false,
                    message: 'Credenciales incorrectas'
                });
            }

            // Successful login, reset failed attempts and lockout
            await pool.execute(
                'UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE email = ?',
                [email]
            );
        }

        // Remove any verification code for this email
        delete verificationCodes[email];

        // Generar un token de "Recordarme" si el usuario lo solicita
        let rememberToken = null;
        let tokenExpiresAt = null;
        if (rememberMe) {
            rememberToken = generateRememberToken();
            tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
            if (isAdmin) {
                await pool.execute(
                    'UPDATE admins SET remember_token = ?, remember_token_expires_at = ? WHERE email = ?',
                    [rememberToken, tokenExpiresAt, email]
                );
            } else {
                await pool.execute(
                    'UPDATE users SET remember_token = ?, remember_token_expires_at = ? WHERE email = ?',
                    [rememberToken, tokenExpiresAt, email]
                );
            }
        } else {
            // Si no se selecciona "Recordarme", eliminar cualquier token existente
            if (isAdmin) {
                await pool.execute(
                    'UPDATE admins SET remember_token = NULL, remember_token_expires_at = NULL WHERE email = ?',
                    [email]
                );
            } else {
                await pool.execute(
                    'UPDATE users SET remember_token = NULL, remember_token_expires_at = NULL WHERE email = ?',
                    [email]
                );
            }
        }

        return res.status(200).json({
            success: true,
            role: isAdmin ? 'admin' : user.role,
            email: user.email,
            rememberToken: rememberToken // Enviar el token al frontend si existe
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión'
        });
    }
});

// Nuevo endpoint para verificar el token de "Recordarme"
router.post('/verify-remember-token', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token requerido'
            });
        }

        // Buscar un usuario con el token proporcionado
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE remember_token = ?',
            [token]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }

        const user = rows[0];

        // Verificar si el token ha expirado
        if (user.remember_token_expires_at && new Date(user.remember_token_expires_at) < new Date()) {
            // Token expirado, eliminarlo
            await pool.execute(
                'UPDATE users SET remember_token = NULL, remember_token_expires_at = NULL WHERE email = ?',
                [user.email]
            );
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }

        // Verificar si la cuenta está bloqueada
        if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
            return res.status(403).json({
                success: false,
                message: 'Tu cuenta ha sido bloqueada temporalmente debido a múltiples intentos fallidos. Por favor, verifica tu identidad para desbloquearla.'
            });
        }

        return res.status(200).json({
            success: true,
            role: user.role,
            email: user.email
        });
    } catch (error) {
        console.error('Error al verificar el token de "Recordarme":', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar el token'
        });
    }
});

// Ruta para solicitar el método de recuperación (pregunta de seguridad o código por correo)
router.post('/request-recovery', async (req, res) => {
    try {
        const { email, method } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Correo electrónico requerido'
            });
        }

        // Check if the user exists
        const [rows] = await pool.execute(
            'SELECT recovery_question FROM users WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'El correo no está registrado'
            });
        }

        const user = rows[0];

        if (method === 'code') {
            // Generate and store verification code
            const code = generateVerificationCode();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
            verificationCodes[email] = { code, expiresAt };

            // Send unlock email
            await sendUnlockVerificationEmail(email, code);

            return res.status(200).json({
                success: true,
                message: 'Se ha enviado un código de verificación a tu correo.'
            });
        } else if (method === 'security') {
            return res.status(200).json({
                success: true,
                recoveryQuestion: user.recovery_question
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Método de recuperación no válido'
            });
        }
    } catch (error) {
        console.error('Error al solicitar recuperación:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al solicitar recuperación'
        });
    }
});

// Ruta para validar el método de recuperación (código o pregunta de seguridad)
router.post('/verify-recovery', async (req, res) => {
    try {
        const { email, method, code, securityAnswer } = req.body;
        if (!email || !method) {
            console.log('Faltan email o method');
            return res.status(400).json({
                success: false,
                message: 'Correo y método de recuperación son requeridos'
            });
        }

        // Check if the user exists
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            console.log('Correo no registrado:', email);
            return res.status(404).json({
                success: false,
                message: 'El correo no está registrado'
            });
        }

        const user = rows[0];

        if (method === 'code') {
            if (!code) {
                console.log('Falta el código de verificación');
                return res.status(400).json({
                    success: false,
                    message: 'Código de verificación requerido'
                });
            }

            const storedCode = verificationCodes[email];
            if (!storedCode) {
                console.log('No se encontró un código de verificación para:', email);
                return res.status(400).json({
                    success: false,
                    message: 'No se encontró un código de verificación para este correo'
                });
            }

            if (new Date() > storedCode.expiresAt) {
                console.log('Código expirado para:', email);
                delete verificationCodes[email];
                return res.status(400).json({
                    success: false,
                    message: 'El código de verificación ha expirado'
                });
            }

            if (storedCode.code !== code.toUpperCase()) {
                console.log('Código incorrecto. Esperado:', storedCode.code, 'Recibido:', code.toUpperCase());
                return res.status(400).json({
                    success: false,
                    message: 'Código de verificación incorrecto'
                });
            }
        } else if (method === 'security') {
            if (!securityAnswer) {
                console.log('Falta la respuesta de seguridad');
                return res.status(400).json({
                    success: false,
                    message: 'Respuesta de seguridad requerida'
                });
            }

            if (!user.recovery_answer) {
                console.log('No hay respuesta de seguridad almacenada para:', email);
                return res.status(500).json({
                    success: false,
                    message: 'Error: No hay respuesta de seguridad almacenada para este usuario'
                });
            }

            // Estandarizar ambas respuestas (ingresada y almacenada) para ignorar mayúsculas y espacios
            const standardizedSecurityAnswer = securityAnswer.trim().toLowerCase();
            const standardizedStoredAnswer = user.recovery_answer.trim().toLowerCase();

            // Comparar directamente como texto plano
            const match = standardizedSecurityAnswer === standardizedStoredAnswer;

            if (!match) {
                return res.status(400).json({
                    success: false,
                    message: 'Respuesta de seguridad incorrecta'
                });
            }
        } else {
            console.log('Método de recuperación no válido:', method);
            return res.status(400).json({
                success: false,
                message: 'Método de recuperación no válido'
            });
        }

        // No reiniciamos failed_login_attempts ni lockout_until aquí
        return res.status(200).json({
            success: true,
            message: 'Verificación exitosa. Puedes cambiar tu contraseña.'
        });
    } catch (error) {
        console.error('Error al verificar recuperación:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar recuperación'
        });
    }
});

// Ruta para cambiar la contraseña después de la verificación
router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Correo y nueva contraseña son requeridos'
            });
        }

        // Check if the user exists
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'El correo no está registrado'
            });
        }

        // Hash the new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update the password and reset failed attempts and lockout
        await pool.execute(
            'UPDATE users SET password = ?, failed_login_attempts = 0, lockout_until = NULL WHERE email = ?',
            [hashedPassword, email]
        );

        // Remove any verification code
        delete verificationCodes[email];

        return res.status(200).json({
            success: true,
            message: 'Contraseña actualizada exitosamente. Por favor, inicia sesión.'
        });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al cambiar contraseña'
        });
    }
});

// Nueva ruta para solicitar restablecimiento de contraseña
router.post('/request-password-reset', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Correo electrónico requerido'
            });
        }

        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'El correo no está registrado'
            });
        }

        const user = rows[0];

        if (user.google_id && !user.password) {
            return res.status(400).json({
                success: false,
                message: 'Este usuario debe recuperar la contraseña con Google'
            });
        }

        const token = generatePasswordResetToken();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

        const formattedExpiresAt = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

        await pool.execute(
            'UPDATE users SET password_reset_token = ?, password_reset_expires_at = ? WHERE email = ?',
            [token, formattedExpiresAt, email]
        );

        const [savedData] = await pool.execute(
            'SELECT password_reset_token, password_reset_expires_at FROM users WHERE email = ?',
            [email]
        );
        console.log('Datos almacenados:', savedData[0]);

        await sendPasswordResetEmail(email, token);

        return res.status(200).json({
            success: true,
            message: 'Se ha enviado un enlace de recuperación a tu correo.'
        });
    } catch (error) {
        console.error('Error al solicitar restablecimiento de contraseña:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al solicitar restablecimiento de contraseña'
        });
    }
});

// Validar token
router.post('/reset-password-token', async (req, res) => {
    try {
        const { token } = req.body;

        console.log('Validando token:', token);

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token requerido'
            });
        }

        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE password_reset_token = ?',
            [token]
        );

        if (rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El token de recuperación es inválido'
            });
        }

        const user = rows[0];
        if (new Date(user.password_reset_expires_at) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'El token de recuperación ha expirado'
            });
        }

        return res.status(200).json({
            success: true,
            email: user.email,
            message: 'Token válido. Puede proceder a cambiar la contraseña.'
        });
    } catch (error) {
        console.error('Error al validar el token de restablecimiento:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al validar el token de restablecimiento'
        });
    }
});

// Nueva ruta para restablecer la contraseña con el token
router.post('/reset-password-with-token', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token y nueva contraseña son requeridos'
            });
        }

        // Convertir la fecha actual a un formato compatible con MySQL
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Check if the token exists and is valid
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires_at > ?',
            [token, now]
        );

        if (rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El enlace de recuperación es inválido o ha expirado'
            });
        }

        const user = rows[0];

        // Validate password strength
        const passwordRequirements = {
            minLength: newPassword.length >= 8,
            upperCase: /[A-Z]/.test(newPassword),
            lowerCase: /[a-z]/.test(newPassword),
            number: /[0-9]/.test(newPassword),
            specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
        };

        const allRequirementsMet = Object.values(passwordRequirements).every(req => req);
        if (!allRequirementsMet) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial'
            });
        }

        // Hash the new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update the password and clear the reset token
        await pool.execute(
            'UPDATE users SET password = ?, password_reset_token = NULL, password_reset_expires_at = NULL, failed_login_attempts = 0, lockout_until = NULL WHERE email = ?',
            [hashedPassword, user.email]
        );

        // Send success notification email
        await sendPasswordResetSuccessEmail(user.email);

        return res.status(200).json({
            success: true,
            message: 'Contraseña actualizada exitosamente. Por favor, inicia sesión.'
        });
    } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al restablecer contraseña'
        });
    }
});

// Ruta para iniciar el flujo de OAuth con Google (Login)
router.get('/google/login', (req, res) => {
    const authUrl = googleClient.generateAuthUrl({
        scope: ['profile', 'email', 'openid'],
        redirect_uri: process.env.GOOGLE_REDIRECT_URI_LOGIN
    });
    res.redirect(authUrl);
});

// Ruta de callback de Google para login
router.get('/google/login/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.redirect('/login?success=false&error=Falta el código de autorización');
        }

        // Intercambiar el código por un token de acceso
        const { tokens } = await googleClient.getToken({
            code,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI_LOGIN
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
            googleId: payload['sub'],
            email: payload['email']
        };

        if (!user.email || !user.googleId) {
            return res.redirect('/login?success=false&error=Autenticación fallida: Datos incompletos');
        }

        // Check if the user exists in the database
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE google_id = ? AND email = ?',
            [user.googleId, user.email]
        );

        if (rows.length === 0) {
            return res.redirect('/login?success=false&error=Usuario no registrado. Por favor, regístrate primero.');
        }

        const dbUser = rows[0];

        // Successful login, redirect based on role
        const redirectPage = dbUser.role === 'arrendador' ? '/Arrendador' : '/Arrendatario';
        res.redirect(`${redirectPage}?success=true&email=${encodeURIComponent(user.email)}`);
    } catch (error) {
        console.error('Error en /google/login/callback:', error);
        res.redirect('/login?success=false&error=Error interno del servidor');
    }
});

module.exports = router;