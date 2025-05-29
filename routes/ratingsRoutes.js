const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const {sendRatingReceivedEmail, sendLandlordRatingReceivedEmail} = require('../utils/email');

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
        const [userRows] = await pool.query('SELECT * FROM users WHERE email = ?', [userEmail]);
        if (userRows.length > 0) {
            req.user = userRows[0];
            req.user.role = 'user';
            return next();
        }

        const [adminRows] = await pool.query('SELECT * FROM admins WHERE email = ?', [userEmail]);
        if (adminRows.length > 0) {
            req.user = adminRows[0];
            req.user.role = 'admin';
            return next();
        }

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

// Ruta para obtener todos los arrendatarios con paginación
router.get('/tenants', authenticateUser, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Consultar todos los arrendatarios (role = 'arrendatario') desde la tabla users
        const [tenants] = await pool.query(`
            SELECT DISTINCT 
                u.email AS tenant_email,
                u.full_name,
                u.profile_picture,
                (SELECT COUNT(*) > 0 
                 FROM agreements a2 
                 WHERE a2.tenant_email = u.email 
                 AND a2.landlord_email = ? 
                 AND a2.status = 'active') AS activeContractsWithMe,
                (SELECT COUNT(*) 
                 FROM agreements a3 
                 WHERE a3.tenant_email = u.email 
                 AND a3.status = 'active') AS totalActiveContracts,
                (SELECT COUNT(DISTINCT a4.publication_id) 
                 FROM agreements a4 
                 JOIN publications p ON a4.publication_id = p.id 
                 WHERE a4.tenant_email = u.email) AS publicationCount
            FROM users u
            WHERE u.role = 'arrendatario'
            ORDER BY u.full_name ASC
            LIMIT ? OFFSET ?
        `, [userEmail, limit, offset]);

        // Calcular el total de arrendatarios (role = 'arrendatario')
        const [totalResult] = await pool.query(`
            SELECT COUNT(*) as total
            FROM users u
            WHERE u.role = 'arrendatario'
        `);
        const totalTenants = totalResult[0].total;
        const totalPages = Math.ceil(totalTenants / limit);

        res.json({
            success: true,
            tenants,
            pagination: {
                currentPage: page,
                totalPages,
                totalTenants
            }
        });
    } catch (error) {
        console.error('Error fetching tenants:', error);
        res.status(500).json({ success: false, message: 'Error al obtener arrendatarios: ' + error.message });
    }
});

// Ruta para buscar arrendatarios por nombre o contrato
router.get('/tenants/search', authenticateUser, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const searchQuery = req.query.q ? `%${req.query.q}%` : '%';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Consultar todos los arrendatarios (role = 'arrendatario') desde la tabla users
        const [tenants] = await pool.query(`
            SELECT DISTINCT 
                u.email AS tenant_email,
                u.full_name,
                u.profile_picture,
                (SELECT COUNT(*) > 0 
                 FROM agreements a2 
                 WHERE a2.tenant_email = u.email 
                 AND a2.landlord_email = ? 
                 AND a2.status = 'active') AS activeContractsWithMe,
                (SELECT COUNT(*) 
                 FROM agreements a3 
                 WHERE a3.tenant_email = u.email 
                 AND a3.status = 'active') AS totalActiveContracts,
                (SELECT COUNT(DISTINCT a4.publication_id) 
                 FROM agreements a4 
                 JOIN publications p ON a4.publication_id = p.id 
                 WHERE a4.tenant_email = u.email) AS publicationCount
            FROM users u
            LEFT JOIN agreements a ON a.tenant_email = u.email
            LEFT JOIN publications p ON a.publication_id = p.id
            WHERE u.role = 'arrendatario'
            AND (u.full_name LIKE ? OR u.email LIKE ? OR p.title LIKE ?)
            ORDER BY u.full_name ASC
            LIMIT ? OFFSET ?
        `, [userEmail, searchQuery, searchQuery, searchQuery, limit, offset]);

        // Calcular el total de arrendatarios (role = 'arrendatario') con el criterio de búsqueda
        const [totalResult] = await pool.query(`
            SELECT COUNT(DISTINCT u.email) as total
            FROM users u
            LEFT JOIN agreements a ON a.tenant_email = u.email
            LEFT JOIN publications p ON a.publication_id = p.id
            WHERE u.role = 'arrendatario'
            AND (u.full_name LIKE ? OR u.email LIKE ? OR p.title LIKE ?)
        `, [searchQuery, searchQuery, searchQuery]);
        const totalTenants = totalResult[0].total;
        const totalPages = Math.ceil(totalTenants / limit);

        res.json({
            success: true,
            tenants,
            pagination: {
                currentPage: page,
                totalPages,
                totalTenants
            }
        });
    } catch (error) {
        console.error('Error searching tenants:', error);
        res.status(500).json({ success: false, message: 'Error al buscar arrendatarios: ' + error.message });
    }
});

// Ruta para obtener detalles de un arrendatario (contratos activos, calificaciones, comentarios)
router.get('/tenants/:email', authenticateUser, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const tenantEmail = req.params.email;

        const [tenantRows] = await pool.query(`
            SELECT 
                u.email,
                u.full_name,
                u.profile_picture
            FROM users u
            WHERE u.email = ?
        `, [tenantEmail]);

        if (tenantRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Arrendatario no encontrado.' });
        }

        const tenant = tenantRows[0];

        // Solo devolver contratos activos (status = 'active')
        const [activeContracts] = await pool.query(`
            SELECT 
                a.id,
                a.contract_id,
                a.publication_id,
                p.title,
                a.start_date,
                a.end_date
            FROM agreements a
            JOIN publications p ON a.publication_id = p.id
            WHERE a.tenant_email = ?
            AND a.status = 'active'
        `, [tenantEmail]);

        // Contratos finalizados (status = 'expired') para el dropdown de reseñas
        const [expiredContracts] = await pool.query(`
            SELECT 
                a.id,
                a.contract_id,
                a.publication_id,
                p.title,
                a.start_date,
                a.end_date
            FROM agreements a
            JOIN publications p ON a.publication_id = p.id
            WHERE a.tenant_email = ?
            AND a.landlord_email = ?
            AND a.status = 'expired'
        `, [tenantEmail, userEmail]);

        const [ratingStats] = await pool.query(`
            SELECT 
                AVG(rating) as averageRating,
                COUNT(*) as ratingCount
            FROM tenant_ratings
            WHERE tenant_email = ?
        `, [tenantEmail]);

        const [recentComments] = await pool.query(`
            SELECT 
                tr.landlord_email,
                u.full_name as landlord_name,
                tr.rating,
                tr.comment,
                tr.created_at,
                a.contract_id,
                p.title as publication_title
            FROM tenant_ratings tr
            JOIN users u ON tr.landlord_email = u.email
            JOIN agreements a ON tr.agreement_id = a.id
            JOIN publications p ON a.publication_id = p.id
            WHERE tr.tenant_email = ?
            ORDER BY tr.created_at DESC
            LIMIT 5
        `, [tenantEmail]);

        res.json({
            success: true,
            tenant: {
                email: tenant.email,
                full_name: tenant.full_name,
                profile_picture: tenant.profile_picture,
                activeContracts: activeContracts,
                expiredContracts: expiredContracts, // Nuevo campo para contratos finalizados
                averageRating: parseFloat(ratingStats[0].averageRating) || 0,
                ratingCount: parseInt(ratingStats[0].ratingCount) || 0,
                recentComments: recentComments
            }
        });
    } catch (error) {
        console.error('Error fetching tenant details:', error);
        res.status(500).json({ success: false, message: 'Error al obtener detalles del arrendatario: ' + error.message });
    }
});

// Ruta para enviar una calificación
router.post('/tenants/:email/rate', authenticateUser, async (req, res) => {
    try {
        const landlordEmail = req.user.email;
        const tenantEmail = req.params.email;
        const { agreement_id, rating, comment } = req.body;

        // Validar datos
        if (!agreement_id || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'El ID del acuerdo y una calificación válida (1-5) son requeridos.' });
        }
        if (comment && comment.length > 300) {
            return res.status(400).json({ success: false, message: 'El comentario no puede exceder los 300 caracteres.' });
        }

        // Verificar que el acuerdo existe, está asociado al arrendador y arrendatario, y su status es 'expired'
        const [agreement] = await pool.query(`
            SELECT a.*, p.title
            FROM agreements a
            JOIN publications p ON a.publication_id = p.id
            WHERE a.id = ? AND a.landlord_email = ? AND a.tenant_email = ?
        `, [agreement_id, landlordEmail, tenantEmail]);

        if (!agreement.length) {
            return res.status(400).json({ success: false, message: 'El acuerdo no existe o no tienes permiso para calificarlo.' });
        }

        if (agreement[0].status !== 'expired') {
            return res.status(400).json({ success: false, message: 'No puedes reseñar este contrato porque aún no ha finalizado. Debe estar en estado "expired".' });
        }

        // Verificar si ya existe una calificación para este acuerdo
        const [existingRating] = await pool.query(`
            SELECT id
            FROM tenant_ratings
            WHERE agreement_id = ?
        `, [agreement_id]);

        if (existingRating.length) {
            return res.status(400).json({ success: false, message: 'Ya has calificado este acuerdo.' });
        }

        // Obtener el nombre completo del arrendador
        const [landlord] = await pool.query(`
            SELECT full_name
            FROM users
            WHERE email = ?
        `, [landlordEmail]);

        if (!landlord.length) {
            return res.status(400).json({ success: false, message: 'Arrendador no encontrado.' });
        }

        const landlordName = landlord[0].full_name;
        const publicationTitle = agreement[0].title;
        const contractId = agreement[0].contract_id;

        // Guardar la calificación
        await pool.query(`
            INSERT INTO tenant_ratings (agreement_id, landlord_email, tenant_email, rating, comment)
            VALUES (?, ?, ?, ?, ?)
        `, [agreement_id, landlordEmail, tenantEmail, rating, comment || null]);

        // Enviar notificación al arrendatario
        await pool.query(`
            INSERT INTO notifications (user_email, type, message, action_url, \`read\`, created_at)
            VALUES (?, 'rating_received', ?, ?, 0, NOW())
        `, [tenantEmail, `Has recibido una nueva calificación del arrendador ${landlordName}.`, `/perfil/${tenantEmail}`]);

        // Enviar correo al arrendatario
        try {
            await sendRatingReceivedEmail(tenantEmail, landlordName, contractId, publicationTitle, rating, comment || '');
        } catch (emailError) {
            console.error('Error al enviar el correo de notificación de calificación:', emailError);
        }

        res.status(201).json({ success: true, message: 'Calificación enviada correctamente.' });
    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).json({ success: false, message: 'Error al enviar la calificación: ' + error.message });
    }
});

// Ruta para obtener los detalles del arrendador autenticado
router.get('/landlord/me', authenticateUser, async (req, res) => {
    try {
        const landlordEmail = req.user.email;

        // Obtener datos del arrendador
        const [landlordData] = await pool.query(`
            SELECT 
                u.full_name,
                u.email,
                u.profile_picture
            FROM users u
            WHERE u.email = ?
        `, [landlordEmail]);

        if (!landlordData.length) {
            return res.status(404).json({ success: false, message: 'Arrendador no encontrado' });
        }

        // Obtener calificación promedio y cantidad de reseñas
        const [ratingData] = await pool.query(`
            SELECT 
                AVG(rating) AS averageRating,
                COUNT(*) AS ratingCount
            FROM landlord_ratings
            WHERE landlord_email = ?
        `, [landlordEmail]);

        // Obtener los últimos 5 comentarios
        const [recentComments] = await pool.query(`
            SELECT 
                lr.comment,
                lr.created_at,
                lr.rating,
                u.full_name AS tenant_name,
                a.contract_id,
                p.title AS publication_title
            FROM landlord_ratings lr
            JOIN users u ON lr.tenant_email = u.email
            JOIN agreements a ON lr.agreement_id = a.id
            JOIN publications p ON a.publication_id = p.id
            WHERE lr.landlord_email = ?
            ORDER BY lr.created_at DESC
            LIMIT 5
        `, [landlordEmail]);

        res.json({
            success: true,
            landlord: {
                full_name: landlordData[0].full_name,
                email: landlordData[0].email,
                profile_picture: landlordData[0].profile_picture,
                averageRating: parseFloat(ratingData[0].averageRating) || 0,
                ratingCount: parseInt(ratingData[0].ratingCount) || 0,
                recentComments: recentComments || []
            }
        });
    } catch (error) {
        console.error('Error fetching landlord details:', error);
        res.status(500).json({ success: false, message: 'Error al obtener detalles: ' + error.message });
    }
});

// Ruta para obtener todos los arrendadores con paginación
router.get('/landlords', authenticateUser, async (req, res) => {
    try {
        const userEmail = req.user.email; // Cambié tenantEmail por userEmail para consistencia
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Consultar todos los arrendadores (role = 'arrendador') desde la tabla users
        const [landlords] = await pool.query(`
            SELECT DISTINCT 
                u.email AS landlord_email,
                u.full_name,
                u.profile_picture,
                (SELECT COUNT(*) > 0 
                 FROM agreements a2 
                 WHERE a2.landlord_email = u.email 
                 AND a2.tenant_email = ? 
                 AND a2.status = 'active') AS activeContractsWithMe,
                (SELECT COUNT(*) 
                 FROM agreements a3 
                 WHERE a3.landlord_email = u.email 
                 AND a3.status = 'active') AS totalActiveContracts,
                (SELECT COUNT(DISTINCT a4.publication_id) 
                 FROM agreements a4 
                 JOIN publications p ON a4.publication_id = p.id 
                 WHERE a4.landlord_email = u.email) AS publicationCount
            FROM users u
            WHERE u.role = 'arrendador'
            ORDER BY u.full_name ASC
            LIMIT ? OFFSET ?
        `, [userEmail, limit, offset]);

        // Calcular el total de arrendadores (role = 'arrendador')
        const [totalResult] = await pool.query(`
            SELECT COUNT(*) as total
            FROM users u
            WHERE u.role = 'arrendador'
        `);
        const totalLandlords = totalResult[0].total;
        const totalPages = Math.ceil(totalLandlords / limit);

        res.json({
            success: true,
            landlords,
            pagination: {
                currentPage: page,
                totalPages,
                totalLandlords
            }
        });
    } catch (error) {
        console.error('Error fetching landlords:', error);
        res.status(500).json({ success: false, message: 'Error al obtener arrendadores: ' + error.message });
    }
});

// Ruta para buscar arrendadores por nombre o contrato
router.get('/landlords/search', authenticateUser, async (req, res) => {
    try {
        const userEmail = req.user.email; // Cambié tenantEmail por userEmail para consistencia
        const searchQuery = req.query.q ? `%${req.query.q}%` : '%';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Consultar todos los arrendadores (role = 'arrendador') desde la tabla users
        const [landlords] = await pool.query(`
            SELECT DISTINCT 
                u.email AS landlord_email,
                u.full_name,
                u.profile_picture,
                (SELECT COUNT(*) > 0 
                 FROM agreements a2 
                 WHERE a2.landlord_email = u.email 
                 AND a2.tenant_email = ? 
                 AND a2.status = 'active') AS activeContractsWithMe,
                (SELECT COUNT(*) 
                 FROM agreements a3 
                 WHERE a3.landlord_email = u.email 
                 AND a3.status = 'active') AS totalActiveContracts,
                (SELECT COUNT(DISTINCT a4.publication_id) 
                 FROM agreements a4 
                 JOIN publications p ON a4.publication_id = p.id 
                 WHERE a4.landlord_email = u.email) AS publicationCount
            FROM users u
            LEFT JOIN agreements a ON a.landlord_email = u.email
            LEFT JOIN publications p ON a.publication_id = p.id
            WHERE u.role = 'arrendador'
            AND (u.full_name LIKE ? OR u.email LIKE ? OR p.title LIKE ?)
            ORDER BY u.full_name ASC
            LIMIT ? OFFSET ?
        `, [userEmail, searchQuery, searchQuery, searchQuery, limit, offset]);

        // Calcular el total de arrendadores (role = 'arrendador') con el criterio de búsqueda
        const [totalResult] = await pool.query(`
            SELECT COUNT(DISTINCT u.email) as total
            FROM users u
            LEFT JOIN agreements a ON a.landlord_email = u.email
            LEFT JOIN publications p ON a.publication_id = p.id
            WHERE u.role = 'arrendador'
            AND (u.full_name LIKE ? OR u.email LIKE ? OR p.title LIKE ?)
        `, [searchQuery, searchQuery, searchQuery]);
        const totalLandlords = totalResult[0].total;
        const totalPages = Math.ceil(totalLandlords / limit);

        res.json({
            success: true,
            landlords,
            pagination: {
                currentPage: page,
                totalPages,
                totalLandlords
            }
        });
    } catch (error) {
        console.error('Error searching landlords:', error);
        res.status(500).json({ success: false, message: 'Error al buscar arrendadores: ' + error.message });
    }
});

// Ruta para obtener detalles de un arrendador (contratos activos, calificaciones, comentarios)
router.get('/landlords/:email', authenticateUser, async (req, res) => {
    try {
        const tenantEmail = req.user.email;
        const landlordEmail = req.params.email;

        const [landlordRows] = await pool.query(`
            SELECT 
                u.email,
                u.full_name,
                u.profile_picture
            FROM users u
            WHERE u.email = ?
        `, [landlordEmail]);

        if (landlordRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Arrendador no encontrado.' });
        }

        const landlord = landlordRows[0];

        const [activeContracts] = await pool.query(`
            SELECT 
                a.id,
                a.contract_id,
                a.publication_id,
                p.title,
                a.start_date,
                a.end_date
            FROM agreements a
            JOIN publications p ON a.publication_id = p.id
            WHERE a.landlord_email = ?
            AND a.status = 'active'
        `, [landlordEmail]);

        const [expiredContracts] = await pool.query(`
            SELECT 
                a.id,
                a.contract_id,
                a.publication_id,
                p.title,
                a.start_date,
                a.end_date
            FROM agreements a
            JOIN publications p ON a.publication_id = p.id
            WHERE a.landlord_email = ?
            AND a.tenant_email = ?
            AND a.status = 'expired'
        `, [landlordEmail, tenantEmail]);

        const [ratingStats] = await pool.query(`
            SELECT 
                AVG(rating) as averageRating,
                COUNT(*) as ratingCount
            FROM landlord_ratings
            WHERE landlord_email = ?
        `, [landlordEmail]);

        const [recentComments] = await pool.query(`
            SELECT 
                lr.tenant_email,
                u.full_name as tenant_name,
                lr.rating,
                lr.comment,
                lr.created_at,
                a.contract_id,
                p.title as publication_title
            FROM landlord_ratings lr
            JOIN users u ON lr.tenant_email = u.email
            JOIN agreements a ON lr.agreement_id = a.id
            JOIN publications p ON a.publication_id = p.id
            WHERE lr.landlord_email = ?
            ORDER BY lr.created_at DESC
            LIMIT 5
        `, [landlordEmail]);

        res.json({
            success: true,
            landlord: {
                email: landlord.email,
                full_name: landlord.full_name,
                profile_picture: landlord.profile_picture,
                activeContracts: activeContracts,
                expiredContracts: expiredContracts,
                averageRating: parseFloat(ratingStats[0].averageRating) || 0,
                ratingCount: parseInt(ratingStats[0].ratingCount) || 0,
                recentComments: recentComments
            }
        });
    } catch (error) {
        console.error('Error fetching landlord details:', error);
        res.status(500).json({ success: false, message: 'Error al obtener detalles del arrendador: ' + error.message });
    }
});

// Ruta para enviar una calificación
router.post('/landlords/:email/rate', authenticateUser, async (req, res) => {
    try {
        const tenantEmail = req.user.email;
        const landlordEmail = req.params.email;
        const { agreement_id, rating, comment } = req.body;

        // Validar datos
        if (!agreement_id || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'El ID del acuerdo y una calificación válida (1-5) son requeridos.' });
        }
        if (comment && comment.length > 300) {
            return res.status(400).json({ success: false, message: 'El comentario no puede exceder los 300 caracteres.' });
        }

        // Verificar que el acuerdo existe, está asociado al arrendador y arrendatario, y su status es 'expired'
        const [agreement] = await pool.query(`
            SELECT a.*, p.title
            FROM agreements a
            JOIN publications p ON a.publication_id = p.id
            WHERE a.id = ? AND a.landlord_email = ? AND a.tenant_email = ?
        `, [agreement_id, landlordEmail, tenantEmail]);

        if (!agreement.length) {
            return res.status(400).json({ success: false, message: 'El acuerdo no existe o no tienes permiso para calificarlo.' });
        }

        if (agreement[0].status !== 'expired') {
            return res.status(400).json({ success: false, message: 'No puedes reseñar este contrato porque aún no ha finalizado. Debe estar en estado "expired".' });
        }

        // Verificar si ya existe una calificación para este acuerdo
        const [existingRating] = await pool.query(`
            SELECT id
            FROM landlord_ratings
            WHERE agreement_id = ?
        `, [agreement_id]);

        if (existingRating.length) {
            return res.status(400).json({ success: false, message: 'Ya has calificado este acuerdo.' });
        }

        // Obtener el nombre completo del arrendatario
        const [tenant] = await pool.query(`
            SELECT full_name
            FROM users
            WHERE email = ?
        `, [tenantEmail]);

        if (!tenant.length) {
            return res.status(400).json({ success: false, message: 'Arrendatario no encontrado.' });
        }

        const tenantName = tenant[0].full_name;
        const publicationTitle = agreement[0].title;
        const contractId = agreement[0].contract_id;

        // Guardar la calificación
        await pool.query(`
            INSERT INTO landlord_ratings (agreement_id, landlord_email, tenant_email, rating, comment)
            VALUES (?, ?, ?, ?, ?)
        `, [agreement_id, landlordEmail, tenantEmail, rating, comment || null]);

        // Enviar notificación al arrendador
        await pool.query(`
            INSERT INTO notifications (user_email, type, message, action_url, \`read\`, created_at)
            VALUES (?, 'rating_received', ?, ?, 0, NOW())
        `, [landlordEmail, `Has recibido una nueva calificación del arrendatario ${tenantName}.`, `/perfil/${landlordEmail}`]);

        // Enviar correo al arrendador
        try {
            await sendLandlordRatingReceivedEmail(landlordEmail, tenantName, contractId, publicationTitle, rating, comment || '');
        } catch (emailError) {
            console.error('Error al enviar el correo de notificación de calificación:', emailError);
        }

        res.status(201).json({ success: true, message: 'Calificación enviada correctamente.' });
    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).json({ success: false, message: 'Error al enviar la calificación: ' + error.message });
    }
});

// Ruta para obtener los detalles del arrendatario autenticado
router.get('/tenant/me', authenticateUser, async (req, res) => {
    try {
        const tenantEmail = req.user.email;

        // Datos básicos del arrendatario
        const [tenantData] = await pool.query(
            `SELECT full_name, email, profile_picture FROM users WHERE email = ?`,
            [tenantEmail]
        );

        if (!tenantData.length) {
            return res.status(404).json({ success: false, message: 'Arrendatario no encontrado' });
        }

        // Calificaciones
        const [ratingData] = await pool.query(
            `SELECT AVG(rating) AS averageRating, COUNT(*) AS ratingCount FROM tenant_ratings WHERE tenant_email = ?`,
            [tenantEmail]
        );

        // Últimos comentarios con LEFT JOINs
        const [recentComments] = await pool.query(`
            SELECT 
                tr.comment,
                tr.created_at,
                tr.rating,
                u.full_name AS landlord_name,
                a.contract_id,
                p.title AS publication_title
            FROM tenant_ratings tr
            LEFT JOIN users u ON tr.landlord_email = u.email
            LEFT JOIN agreements a ON tr.agreement_id = a.id
            LEFT JOIN publications p ON a.publication_id = p.id
            WHERE tr.tenant_email = ?
            ORDER BY tr.created_at DESC
            LIMIT 5
        `, [tenantEmail]);

        const formattedComments = recentComments.map(comment => ({
            comment: comment.comment || 'Sin comentario',
            created_at: comment.created_at,
            rating: comment.rating,
            landlord_name: comment.landlord_name || 'Arrendador desconocido',
            contract_id: comment.contract_id || 'No disponible',
            publication_title: comment.publication_title || 'No disponible'
        }));

        res.json({
            success: true,
            tenant: {
                full_name: tenantData[0].full_name,
                email: tenantData[0].email,
                profile_picture: tenantData[0].profile_picture,
                averageRating: parseFloat(ratingData[0].averageRating) || 0,
                ratingCount: parseInt(ratingData[0].ratingCount) || 0,
                recentComments: formattedComments
            }
        });

    } catch (error) {
        console.error('Error fetching tenant details:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

module.exports = router;