const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const moment = require('moment-timezone'); // Importar moment-timezone
const path = require('path');
const fs = require('fs').promises;

// Middleware para verificar autenticación
const authenticateUser = async (req, res, next) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) {
        return res.status(401).json({
            success: false,
            message: 'Email del usuario no proporcionado'
        });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [userEmail]);
        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        req.user = rows[0];
        next();
    } catch (error) {
        console.error('Error verificando usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Ruta para el archivo JSON que almacena los contadores
const COUNTER_FILE = path.join(__dirname, '../data/report_counters.json');

// Asegurarse de que el archivo JSON existe
async function initializeCounterFile() {
    try {
        await fs.access(COUNTER_FILE);
    } catch (error) {
        // Si el archivo no existe, crearlo con un objeto vacío
        await fs.writeFile(COUNTER_FILE, JSON.stringify({}));
    }
}

// Leer el contador del archivo JSON
async function getReportCounter(year) {
    await initializeCounterFile();
    const data = await fs.readFile(COUNTER_FILE, 'utf8');
    const counters = JSON.parse(data || '{}');
    return counters[year] || 0;
}

// Actualizar el contador en el archivo JSON
async function updateReportCounter(year, newCounter) {
    await initializeCounterFile();
    const data = await fs.readFile(COUNTER_FILE, 'utf8');
    const counters = JSON.parse(data || '{}');
    counters[year] = newCounter;
    await fs.writeFile(COUNTER_FILE, JSON.stringify(counters, null, 2));
}

// Obtener notificaciones del arrendatario
router.get('/publications/tenant/notifications', authenticateUser, async (req, res) => {
    try {
        const userEmail = req.user.email;
        console.log(`Fetching notifications for user: ${userEmail}`); // Log para depuración

        const [rows] = await pool.query(
            'SELECT id, message, type, action_url, `read`, created_at FROM notifications WHERE user_email = ? ORDER BY created_at DESC',
            [userEmail]
        );

        res.json({ success: true, notifications: rows });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Error al obtener notificaciones' });
    }
});

// Marcar una notificación como leída
router.patch('/publications/tenant/notifications/:id/read', authenticateUser, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const notificationId = req.params.id;

        const [result] = await pool.query(
            'UPDATE notifications SET `read` = 1 WHERE id = ? AND user_email = ?',
            [notificationId, userEmail]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Notificación no encontrada o no pertenece al usuario' });
        }

        res.json({ success: true, message: 'Notificación marcada como leída' });
    } catch (error) {
        console.error('Error marcando notificación como leída:', error);
        res.status(500).json({ success: false, message: 'Error al marcar la notificación como leída' });
    }
});

// Obtener todas las publicaciones con status=available
router.get('/publications/tenant/available', authenticateUser, async (req, res) => {
    try {
        const { title, type, minPrice, maxPrice, availability } = req.query;
        let query = `
            SELECT p.*, p.rental_status, u.full_name, u.profile_picture, u.created_at AS user_created_at,
                   pa.barrio, pa.calle_carrera, pa.numero, pa.conjunto_torre, pa.apartamento, pa.piso
            FROM publications p
            LEFT JOIN users u ON p.landlord_email = u.email
            LEFT JOIN publication_addresses pa ON p.id = pa.publication_id
            WHERE p.status = ?
        `;
        const params = ['available'];
        let conditions = [];

        if (title) {
            conditions.push('p.title LIKE ?');
            params.push(`%${title}%`);
        }
        if (type) {
            conditions.push('p.space_type = ?');
            params.push(type);
        }
        if (minPrice) {
            conditions.push('p.price >= ?');
            params.push(parseFloat(minPrice));
        }
        if (maxPrice) {
            conditions.push('p.price <= ?');
            params.push(parseFloat(maxPrice));
        }
        if (availability) {
            conditions.push('p.availability = ?');
            params.push(availability);
        }

        if (conditions.length > 0) {
            query += ' AND ' + conditions.join(' AND ');
        }

        query += ' ORDER BY p.created_at DESC';

        const [rows] = await pool.query(query, params);

        const publications = await Promise.all(rows.map(async (pub) => {
            let images = [];
            try {
                const [imageRows] = await pool.query(
                    'SELECT image_url FROM publication_images WHERE publication_id = ?',
                    [pub.id]
                );
                images = imageRows.map(img => img.image_url);
            } catch (imageError) {
                console.warn(`No se pudieron obtener imágenes para la publicación ${pub.id}:`, imageError.message);
                images = [];
            }
            return {
                ...pub,
                image_url: images[0] || null,
                images,
                address: {
                    barrio: pub.barrio,
                    calle_carrera: pub.calle_carrera,
                    numero: pub.numero,
                    conjunto_torre: pub.conjunto_torre,
                    apartamento: pub.apartamento,
                    piso: pub.piso
                }
            };
        }));

        res.json({
            success: true,
            publications
        });
    } catch (error) {
        console.error('Error obteniendo publicaciones disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las publicaciones'
        });
    }
});


// Obtener detalles de una publicación específica
router.get('/publications/tenant/:id', authenticateUser, async (req, res) => {
    const publicationId = req.params.id;

    try {
        const [rows] = await pool.query(
            `
            SELECT p.*, u.full_name, u.profile_picture, u.created_at AS user_created_at,
                   pa.barrio, pa.calle_carrera, pa.numero, pa.conjunto_torre, pa.apartamento, pa.piso
            FROM publications p
            LEFT JOIN users u ON p.landlord_email = u.email
            LEFT JOIN publication_addresses pa ON p.id = pa.publication_id
            WHERE p.id = ? AND p.status = ?
            `,
            [publicationId, 'available']
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada o no está disponible'
            });
        }

        const publication = rows[0];

        let images = [];
        try {
            const [imageRows] = await pool.query(
                'SELECT image_url FROM publication_images WHERE publication_id = ?',
                [publicationId]
            );
            images = imageRows.map(img => img.image_url);
        } catch (imageError) {
            console.warn(`No se pudieron obtener imágenes para la publicación ${publicationId}:`, imageError.message);
            images = [];
        }

        res.json({
            success: true,
            publication: {
                ...publication,
                image_url: images[0] || null,
                address: {
                    barrio: publication.barrio,
                    calle_carrera: publication.calle_carrera,
                    numero: publication.numero,
                    conjunto_torre: publication.conjunto_torre,
                    apartamento: publication.apartamento,
                    piso: publication.piso
                }
            },
            images
        });
    } catch (error) {
        console.error('Error obteniendo detalles de la publicación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la publicación'
        });
    }
});

// Enviar reporte de una publicación
router.post('/tenant/report', authenticateUser, async (req, res) => {
    const { publicationId, publicationTitle, reason, description } = req.body;
    const tenantEmail = req.user.email;

    // Validaciones
    if (!publicationId || !reason || !description) {
        return res.status(400).json({
            success: false,
            message: 'Faltan campos obligatorios: publicationId, reason, description'
        });
    }

    const validReasons = ['contenido_inapropiado', 'informacion_falsa', 'estafa', 'otro'];
    if (!validReasons.includes(reason)) {
        return res.status(400).json({
            success: false,
            message: 'Motivo de reporte inválido'
        });
    }

    if (description.length > 500) {
        return res.status(400).json({
            success: false,
            message: 'La descripción no debe exceder 500 caracteres'
        });
    }

    try {
        const [publicationRows] = await pool.query(
            'SELECT landlord_email, title FROM publications WHERE id = ? AND status = ?',
            [publicationId, 'available']
        );
        if (publicationRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada o no está disponible'
            });
        }
        const { title } = publicationRows[0];

        // Obtener la hora actual en la zona horaria deseada (America/Bogota)
        const currentTime = moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss');
        const currentYear = moment().tz('America/Bogota').year();

        // Establecer nivel de aislamiento SERIALIZABLE para evitar concurrencia
        await pool.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
        await pool.query('START TRANSACTION');

        try {
            // Generar número de caso único (REP-YYYY-NNNN) usando el archivo JSON
            const counter = await getReportCounter(currentYear);
            const newCounter = counter + 1;
            const caseNumber = `REP-${currentYear}-${String(newCounter).padStart(4, '0')}`;

            // Actualizar el contador en el archivo JSON
            await updateReportCounter(currentYear, newCounter);

            // Insertar el reporte en la base de datos
            const [result] = await pool.query(
                `
                INSERT INTO reports (publication_id, tenant_email, reason, description, status, case_number, created_at)
                VALUES (?, ?, ?, ?, 'Pendiente', ?, ?)
                `,
                [publicationId, tenantEmail, reason, description, caseNumber, currentTime]
            );

            // Notificación al arrendatario
            const notificationMessage = `Tu reporte de la publicación "${title}" con el número ${caseNumber} está en revisión. ¡Gracias por ayudarnos a mantener nuestra comunidad segura!`;
            const actionUrl = null; // Cambiado a null para evitar redirección a /dashboard
            await pool.query(
                'INSERT INTO notifications (user_email, type, message, action_url, `read`, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                [tenantEmail, 'report_confirmation', notificationMessage, actionUrl, 0, currentTime]
            );

            // Enviar correo de confirmación al arrendatario
            const { sendReportConfirmationEmail } = require('../utils/email');
            await sendReportConfirmationEmail(tenantEmail, title, reason, caseNumber);

            await pool.query('COMMIT');

            res.json({
                success: true,
                message: 'Reporte enviado correctamente',
                caseNumber
            });
        } catch (innerError) {
            await pool.query('ROLLBACK');
            console.error('Error en la transacción de reporte:', innerError);
            throw innerError;
        }
    } catch (error) {
        console.error('Error procesando el reporte:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar el reporte'
        });
    }
});

router.get('/stats', authenticateUser, async (req, res) => {
    try {
        const userEmail = req.user.email;
        // Query for active publications (status = 'available')
        const [activePublicationsResult] = await pool.query(
            'SELECT COUNT(*) as count FROM publications WHERE landlord_email = ? AND status = ?',
            [userEmail, 'available']
        );

        // Query for pending publications (status = 'pending')
        const [pendingPublicationsResult] = await pool.query(
            'SELECT COUNT(*) as count FROM publications WHERE landlord_email = ? AND status = ?',
            [userEmail, 'pending']
        );

        // Query for unread messages (type = 'message' and read = 0)
        const [newMessagesResult] = await pool.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_email = ? AND type = ? AND `read` = ?',
            [userEmail, 'message', 0]
        );

        // Extract counts
        const activePublications = Number(activePublicationsResult[0].count) || 0;
        const pendingPublications = Number(pendingPublicationsResult[0].count) || 0;
        const newMessages = Number(newMessagesResult[0].count) || 0;

        // Return stats
        res.json({
            success: true,
            stats: {
                activePublications,
                pendingPublications,
                newMessages
            }
        });
    } catch (error) {
        console.error('Error fetching landlord stats:', error);
        res.status(500).json({ success: false, message: 'Error al obtener las estadísticas.' });
    }
});

router.get('/tenant/stats', authenticateUser, async (req, res) => {
    try {
        const userEmail = req.user.email;

        // Query for available publications (status = 'available')
        const [availablePublicationsResult] = await pool.query(
            'SELECT COUNT(*) as count FROM publications WHERE status = ?',
            ['available']
        );

        // Query for unread messages (type = 'message' and read = 0)
        const [newMessagesResult] = await pool.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_email = ? AND type = ? AND `read` = ?',
            [userEmail, 'message', 0]
        );

        // Query for active contracts (status = 'active')
        const [activeContractsResult] = await pool.query(
            'SELECT COUNT(*) as count FROM agreements WHERE tenant_email = ? AND status = ?',
            [userEmail, 'active']
        );

        // Extract counts
        const availablePublications = Number(availablePublicationsResult[0].count) || 0;
        const newMessages = Number(newMessagesResult[0].count) || 0;
        const activeContracts = Number(activeContractsResult[0].count) || 0;

        // Return stats
        res.json({
            success: true,
            stats: {
                availablePublications,
                newMessages,
                activeContracts
            }
        });
    } catch (error) {
        console.error('Error fetching tenant stats:', error);
        res.status(500).json({ success: false, message: 'Error al obtener las estadísticas.' });
    }
});

module.exports = router;