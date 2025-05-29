const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendAccountDeletionEmail } = require('../utils/email');

// Middleware para autenticar usuario o administrador
const authenticateUser = async (req, res, next) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) {
        return res.status(401).json({
            success: false,
            message: 'Email del usuario no proporcionado'
        });
    }

    try {
        // Buscar primero en la tabla 'users'
        const [userRows] = await pool.query('SELECT * FROM users WHERE email = ?', [userEmail]);
        if (userRows.length > 0) {
            req.user = userRows[0];
            req.user.role = 'user'; // Marcar como usuario
            return next();
        }

        // Si no se encuentra en 'users', buscar en 'admins'
        const [adminRows] = await pool.query('SELECT * FROM admins WHERE email = ?', [userEmail]);
        if (adminRows.length > 0) {
            req.user = adminRows[0];
            req.user.role = 'admin'; // Marcar como admin
            return next();
        }

        // Si no se encuentra en ninguna tabla
        return res.status(401).json({
            success: false,
            message: 'Usuario no encontrado en ninguna tabla'
        });

    } catch (error) {
        console.error('Error verificando usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración de los formatos de teléfono por país
const phoneFormats = {
    '+57': 10,  // Colombia
    '+54': 10,  // Argentina
    '+591': 8,  // Bolivia
    '+55': 11,  // Brasil
    '+56': 9,   // Chile
    '+506': 8,  // Costa Rica
    '+53': 8,   // Cuba
    '+593': 9,  // Ecuador
    '+503': 8,  // El Salvador
    '+502': 8,  // Guatemala
    '+504': 8,  // Honduras
    '+52': 10,  // México
    '+505': 8,  // Nicaragua
    '+507': 8,  // Panamá
    '+595': 9,  // Paraguay
    '+51': 9,   // Perú
    '+1': 10,   // Puerto Rico y República Dominicana
    '+598': 9,  // Uruguay
    '+58': 10   // Venezuela
};

// Crear una expresión regular dinámica basada en los prefijos de phoneFormats
const validPrefixes = Object.keys(phoneFormats).map(prefix => prefix.replace('+', '\\+')).join('|');
const prefixRegex = new RegExp(`^(${validPrefixes})`);

// Configuración de multer para la subida de archivos (almacenamiento temporal)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempPath = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempPath)) {
            fs.mkdirSync(tempPath, { recursive: true });
        }
        cb(null, tempPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Solo se permiten archivos JPG, JPEG o PNG'));
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB
            return cb(new Error('La imagen no debe exceder 5MB'));
        }
        cb(null, true);
    }
});

// Ruta para obtener los datos del usuario
router.get('/user-profile/:email', async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email);
        const [rows] = await pool.query('SELECT full_name, phone_number, profile_picture, email, created_at, role FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const user = rows[0];
        let phonePrefix = '';
        let phoneNumber = user.phone_number || '';

        // Separar el prefijo y el número de teléfono
        if (phoneNumber) {
            const prefixMatch = phoneNumber.match(prefixRegex);
            console.log(`[DEBUG] phoneNumber: ${phoneNumber}, prefixMatch: ${prefixMatch}`); // Log para depurar

            if (prefixMatch) {
                const matchedPrefix = prefixMatch[0];
                console.log(`[DEBUG] matchedPrefix: ${matchedPrefix}, phoneFormats[matchedPrefix]: ${phoneFormats[matchedPrefix]}`); // Log adicional

                if (phoneFormats[matchedPrefix]) {
                    phonePrefix = matchedPrefix;
                    phoneNumber = phoneNumber.replace(matchedPrefix, '');
                } else {
                    console.log(`[DEBUG] Prefijo ${matchedPrefix} no encontrado en phoneFormats`);
                }
            } else {
                console.log('[DEBUG] No se encontró un prefijo válido en el número de teléfono');
            }
        }

        // Log final antes de enviar la respuesta
        console.log(`[DEBUG] Datos del usuario para ${email}:`, {
            phonePrefix: phonePrefix,
            phoneNumber: phoneNumber,
            full_name: user.full_name,
            email: user.email,
            created_at: user.created_at,
            role: user.role
        });

        res.json({
            success: true,
            name: user.full_name,
            phonePrefix: phonePrefix,
            phoneNumber: phoneNumber,
            profilePicture: user.profile_picture,
            email: user.email,
            created_at: user.created_at,
            role: user.role
        });
    } catch (error) {
        console.error('Error al obtener el perfil:', error);
        res.status(500).json({ success: false, message: 'Error al obtener el perfil' });
    }
});

// Ruta para actualizar el perfil
router.post('/update-profile', upload.single('profilePicture'), async (req, res) => {
    try {
        const { email, name, phone } = req.body;
        const file = req.file;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email del usuario no proporcionado' });
        }

        // Validaciones
        if (!name || !/^[A-Za-z\s]{1,50}$/.test(name)) {
            return res.status(400).json({ success: false, message: 'El nombre solo puede contener letras y espacios (máx. 50 caracteres)' });
        }

        // Validar el número de teléfono con prefijo
        if (!phone) {
            return res.status(400).json({ success: false, message: 'El teléfono es obligatorio' });
        }

        const prefix = phone.match(prefixRegex);
        if (!prefix) {
            return res.status(400).json({ success: false, message: 'El teléfono debe incluir un prefijo internacional (ej. +57)' });
        }

        const expectedLength = phoneFormats[prefix[0]];
        if (!expectedLength) {
            return res.status(400).json({ success: false, message: 'Prefijo de país no soportado' });
        }

        const digits = phone.replace(prefix[0], '');
        if (!/^\d+$/.test(digits) || digits.length !== expectedLength) {
            return res.status(400).json({ success: false, message: `El número debe tener exactamente ${expectedLength} dígitos después del prefijo ${prefix[0]}` });
        }

        // Buscar el usuario
        const [rows] = await pool.query('SELECT profile_picture FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const user = rows[0];
        let profilePicture = user.profile_picture;

        // Manejar la foto de perfil
        if (file) {
            // Subir la nueva imagen a Cloudinary
            const uploadResult = await cloudinary.uploader.upload(file.path, {
                folder: 'profile_pictures',
                overwrite: true
            });

            // Eliminar la imagen anterior de Cloudinary si existe
            if (profilePicture) {
                const publicId = profilePicture.split('/').slice(-1)[0].split('.')[0];
                await cloudinary.uploader.destroy(`profile_pictures/${publicId}`);
            }

            profilePicture = uploadResult.secure_url;

            // Eliminar el archivo temporal
            fs.unlinkSync(file.path);
        }

        // Actualizar los datos en la base de datos
        await pool.query(
            'UPDATE users SET full_name = ?, phone_number = ?, profile_picture = ? WHERE email = ?',
            [name, phone, profilePicture, email]
        );

        res.json({ success: true, message: 'Perfil actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar el perfil:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el perfil' });
    }
});

// Ruta para eliminar la foto de perfil
router.post('/delete-profile-picture/:email', async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email);

        // Buscar el usuario
        const [rows] = await pool.query('SELECT profile_picture FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const user = rows[0];
        if (user.profile_picture) {
            // Extraer el public_id de la URL de Cloudinary
            const publicId = user.profile_picture.split('/').slice(-1)[0].split('.')[0];
            await cloudinary.uploader.destroy(`profile_pictures/${publicId}`);
        }

        // Actualizar la base de datos
        await pool.query('UPDATE users SET profile_picture = NULL WHERE email = ?', [email]);

        res.json({ success: true, message: 'Foto de perfil eliminada' });
    } catch (error) {
        console.error('Error al eliminar la foto de perfil:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar la foto de perfil' });
    }
});

// Ruta para eliminar la cuenta del usuario
router.post('/delete-account/:email', async (req, res) => {
    let connection;
    try {
        const email = decodeURIComponent(req.params.email);

        // Obtener conexión para transacción
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Buscar el usuario y su rol
        const [rows] = await connection.query('SELECT profile_picture, role FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        const user = rows[0];

        // Eliminar foto de perfil de Cloudinary
        if (user.profile_picture) {
            const publicId = user.profile_picture.split('/').slice(-1)[0].split('.')[0];
            await cloudinary.uploader.destroy(`profile_pictures/${publicId}`);
        }

        // Obtener publicaciones del usuario
        const [publications] = await connection.query('SELECT id, title FROM publications WHERE landlord_email = ?', [email]);

        // Definir razón genérica para la cancelación del contrato
        const genericCancellationReason = 'Por decisión administrativa de la plataforma';

        // Procesar publicaciones del usuario (si es arrendador)
        for (const publication of publications) {
            const publicationId = publication.id;

            // Obtener acuerdos asociados con la publicación
            const [agreements] = await connection.query(
                `
                SELECT id, tenant_email, contract_id, start_date, end_date, status
                FROM agreements
                WHERE publication_id = ?
                `,
                [publicationId]
            );

            // Notificar a los arrendatarios con acuerdos activos o en proceso y eliminar datos relacionados
            for (const agreement of agreements) {
                if (['active', 'en_proceso'].includes(agreement.status)) {
                    const tenantEmail = agreement.tenant_email;
                    const contractId = agreement.contract_id;
                    const startDate = new Date(agreement.start_date).toLocaleDateString();
                    const endDate = new Date(agreement.end_date).toLocaleDateString();

                    try {
                        // Enviar correo de notificación al arrendatario
                        await sendContractCancelledEmailTenant(
                            tenantEmail,
                            publication.title || 'Publicación eliminada',
                            contractId,
                            startDate,
                            endDate,
                            genericCancellationReason
                        );
                    } catch (emailError) {
                        console.warn(`Error al enviar correo a ${tenantEmail}:`, emailError.message);
                    }

                    // Crear notificación para el arrendatario
                    await connection.query(
                        `
                        INSERT INTO notifications (user_email, type, message, action_url, \`read\`, created_at)
                        VALUES (?, 'contract_cancelled', ?, ?, 0, NOW())
                        `,
                        [
                            tenantEmail,
                            `Tu contrato ${contractId} ha sido cancelado ${genericCancellationReason} debido a la eliminación de la cuenta del arrendador.`,
                            `/acuerdos`
                        ]
                    );
                }

                // Eliminar calificaciones asociadas al acuerdo
                await connection.query(
                    `
                    DELETE FROM tenant_ratings
                    WHERE agreement_id = ?
                    `,
                    [agreement.id]
                );
                await connection.query(
                    `
                    DELETE FROM landlord_ratings
                    WHERE agreement_id = ?
                    `,
                    [agreement.id]
                );

                // Eliminar el historial de cada acuerdo
                await connection.query(
                    `
                    DELETE FROM agreement_history
                    WHERE agreement_id = ?
                    `,
                    [agreement.id]
                );
            }

            // Eliminar los acuerdos asociados a la publicación
            await connection.query(
                `
                DELETE FROM agreements
                WHERE publication_id = ?
                `,
                [publicationId]
            );

            // Eliminar imágenes de publicaciones en Cloudinary
            const [images] = await connection.query('SELECT image_url FROM publication_images WHERE publication_id = ?', [publicationId]);
            for (const image of images) {
                const publicId = image.image_url.split('/').slice(-1)[0].split('.')[0];
                await cloudinary.uploader.destroy(`publication_images/${publicId}`);
            }

            // Eliminar reports asociados a esta publicación
            await connection.query('DELETE FROM reports WHERE publication_id = ?', [publicationId]);

            // Eliminar imágenes locales asociadas a la publicación
            await connection.query('DELETE FROM publication_images WHERE publication_id = ?', [publicationId]);

            // Eliminar mensajes y conversaciones asociadas a esta publicación
            const [conversations] = await connection.query('SELECT id FROM conversations WHERE publication_id = ?', [publicationId]);
            for (const conversation of conversations) {
                const conversationId = conversation.id;
                // Eliminar mensajes de la conversación
                await connection.query('DELETE FROM messages WHERE conversation_id = ?', [conversationId]);
                // Eliminar la conversación
                await connection.query('DELETE FROM conversations WHERE id = ?', [conversationId]);
            }
        }

        // Eliminar acuerdos donde el usuario es arrendatario
        const [tenantAgreements] = await connection.query(
            `
            SELECT id, landlord_email, contract_id, start_date, end_date, status, publication_id
            FROM agreements
            WHERE tenant_email = ?
            `,
            [email]
        );

        for (const agreement of tenantAgreements) {
            // Si el acuerdo está activo o en proceso, actualizar rental_status de la publicación
            if (['active', 'en_proceso'].includes(agreement.status)) {
                await connection.query(
                    `
                    UPDATE publications
                    SET rental_status = 'disponible'
                    WHERE id = ?
                    `,
                    [agreement.publication_id]
                );
            }

            // Eliminar calificaciones asociadas al acuerdo
            await connection.query(
                `
                DELETE FROM tenant_ratings
                WHERE agreement_id = ?
                `,
                [agreement.id]
            );
            await connection.query(
                `
                DELETE FROM landlord_ratings
                WHERE agreement_id = ?
                `,
                [agreement.id]
            );

            // Eliminar el historial del acuerdo
            await connection.query(
                `
                DELETE FROM agreement_history
                WHERE agreement_id = ?
                `,
                [agreement.id]
            );

            // Notificar al arrendador si el acuerdo está activo o en proceso
            if (['active', 'en_proceso'].includes(agreement.status)) {
                const landlordEmail = agreement.landlord_email;
                const contractId = agreement.contract_id;
                const startDate = new Date(agreement.start_date).toLocaleDateString();
                const endDate = new Date(agreement.end_date).toLocaleDateString();

                // Obtener el título de la publicación
                const [publication] = await connection.query(
                    `
                    SELECT title
                    FROM publications
                    WHERE id = ?
                    `,
                    [agreement.publication_id]
                );
                const publicationTitle = publication.length ? publication[0].title : 'Publicación eliminada';

                try {
                    // Enviar correo de notificación al arrendador
                    await sendContractCancelledEmailTenant(
                        landlordEmail,
                        publicationTitle,
                        contractId,
                        startDate,
                        endDate,
                        genericCancellationReason
                    );
                } catch (emailError) {
                    console.warn(`Error al enviar correo a ${landlordEmail}:`, emailError.message);
                }

                // Crear notificación para el arrendador
                await connection.query(
                    `
                    INSERT INTO notifications (user_email, type, message, action_url, \`read\`, created_at)
                    VALUES (?, 'contract_cancelled', ?, ?, 0, NOW())
                    `,
                    [
                        landlordEmail,
                        `El contrato ${contractId} ha sido cancelado ${genericCancellationReason} debido a la eliminación de la cuenta del arrendatario.`,
                        `/acuerdos`
                    ]
                );
            }
        }

        // Eliminar los acuerdos donde el usuario es arrendatario
        await connection.query(
            `
            DELETE FROM agreements
            WHERE tenant_email = ?
            `,
            [email]
        );

        // Eliminar mensajes donde el usuario es el remitente
        await connection.query('DELETE FROM messages WHERE sender_email = ?', [email]);

        // Eliminar conversaciones donde el usuario es landlord o tenant (que no estén ligadas a publicaciones ya eliminadas)
        await connection.query('DELETE FROM conversations WHERE landlord_email = ? OR tenant_email = ?', [email, email]);

        // Eliminar reports hechos por el usuario (como inquilino)
        await connection.query('DELETE FROM reports WHERE tenant_email = ?', [email]);

        // Eliminar publicaciones (solo para arrendadores)
        if (publications.length > 0) {
            await connection.query('DELETE FROM publications WHERE landlord_email = ?', [email]);
        }

        // Eliminar notificaciones del usuario
        await connection.query('DELETE FROM notifications WHERE user_email = ?', [email]);

        // Eliminar usuario
        await connection.query('DELETE FROM users WHERE email = ?', [email]);

        // Confirmar transacción
        await connection.commit();

        // Eliminar del archivo JSON animationStates.json
        const filePath = path.join(__dirname, '../data/animationStates.json');
        if (fs.existsSync(filePath)) {
            const rawData = fs.readFileSync(filePath);
            const animationStates = JSON.parse(rawData);

            if (animationStates[email]) {
                delete animationStates[email];
                fs.writeFileSync(filePath, JSON.stringify(animationStates, null, 2));
                console.log(`Correo ${email} eliminado de animationStates.json`);
            }
        }

        // Enviar correo de confirmación
        await sendAccountDeletionEmail(email);

        res.status(200).json({ success: true, message: 'Cuenta eliminada correctamente' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al eliminar la cuenta:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar la cuenta' });
    } finally {
        if (connection) connection.release();
    }
});

// Ruta para cerrar sesión
router.post('/logout', authenticateUser, async (req, res) => {
    try {
        const userEmail = req.user.email;
        console.log('Handling POST /api/logout for email:', userEmail);

        // Clear remember_token and remember_token_expires_at in the database
        await pool.query(
            'UPDATE users SET remember_token = NULL, remember_token_expires_at = NULL WHERE email = ?',
            [userEmail]
        );

        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });
    } catch (error) {
        console.error('Error durante el cierre de sesión:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cerrar la sesión'
        });
    }
});

module.exports = router;