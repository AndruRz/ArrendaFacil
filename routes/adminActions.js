const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Middleware para verificar autenticación
const isAuthenticated = (req, res, next) => {
    if (!req.headers['x-user-email'] && !req.body.email) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }
    next();
};

// Ruta para obtener todas las publicaciones (para el administrador) con filtros
router.get('/all', isAuthenticated, async (req, res) => {
    try {
        const adminEmail = req.headers['x-user-email'] || req.body.email;

        // Verificar si el usuario es administrador consultando la tabla 'admins'
        const [admin] = await pool.query(
            `SELECT email FROM admins WHERE email = ?`,
            [adminEmail]
        );

        if (!admin.length) {
            return res.status(403).json({ success: false, message: 'Acceso denegado: solo administradores' });
        }

        // Obtener parámetros de consulta para los filtros
        const { status, title, type } = req.query;

        // Construir la consulta SQL base
        let query = `
            SELECT 
                p.id, 
                p.space_type AS type, 
                p.title, 
                p.description, 
                p.price, 
                p.availability, 
                p.status, 
                p.landlord_email AS owner_email, 
                u.full_name AS owner_name, 
                p.created_at, 
                p.updated_at,
                (SELECT pi.image_url 
                 FROM publication_images pi 
                 WHERE pi.publication_id = p.id 
                 ORDER BY pi.created_at ASC 
                 LIMIT 1) AS image_url
            FROM publications p
            LEFT JOIN users u ON p.landlord_email = u.email
        `;

        // Array para los parámetros de la consulta
        const queryParams = [];

        // Añadir condiciones de filtrado si los parámetros están presentes
        const conditions = [];
        if (status) {
            conditions.push('p.status = ?');
            queryParams.push(status);
        }
        if (title) {
            conditions.push('p.title LIKE ?');
            queryParams.push(`%${title}%`);
        }
        if (type) {
            conditions.push('p.space_type = ?');
            queryParams.push(type);
        }

        // Si hay condiciones, añadirlas a la consulta
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        // Añadir ordenamiento
        query += ' ORDER BY p.created_at DESC';

        // Ejecutar la consulta
        const [publications] = await pool.query(query, queryParams);

        // Si no hay publicaciones, devolvemos un array vacío
        if (!publications || publications.length === 0) {
            return res.status(200).json({ success: true, publications: [] });
        }

        // Devolver las publicaciones con la URL de la primera imagen
        res.status(200).json({ success: true, publications });
    } catch (error) {
        console.error('Error al obtener todas las publicaciones:', error);
        res.status(500).json({ success: false, message: 'Error al obtener las publicaciones' });
    }
});

// Ruta para obtener los detalles completos de una publicación específica
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const adminEmail = req.headers['x-user-email'] || req.body.email;
        const publicationId = req.params.id;

        // Verificar si el usuario es administrador
        const [admin] = await pool.query(
            `SELECT email FROM admins WHERE email = ?`,
            [adminEmail]
        );

        if (!admin.length) {
            return res.status(403).json({ success: false, message: 'Acceso denegado: solo administradores' });
        }

        // Obtener los detalles de la publicación, incluyendo el profile_picture del propietario, los datos de dirección y rental_status
        const [publication] = await pool.query(
            `
            SELECT 
                p.id, 
                p.space_type AS type, 
                p.title, 
                p.description, 
                p.price, 
                p.conditions, 
                p.availability, 
                p.status, 
                p.rental_status, 
                p.landlord_email AS owner_email, 
                u.full_name AS owner_name, 
                u.profile_picture AS owner_profile_picture, 
                p.created_at, 
                p.updated_at,
                pa.barrio, 
                pa.calle_carrera, 
                pa.numero, 
                pa.conjunto_torre, 
                pa.apartamento, 
                pa.piso
            FROM publications p
            LEFT JOIN users u ON p.landlord_email = u.email
            LEFT JOIN publication_addresses pa ON p.id = pa.publication_id
            WHERE p.id = ?
            `,
            [publicationId]
        );

        if (!publication.length) {
            return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
        }

        // Obtener todas las imágenes asociadas a la publicación
        const [images] = await pool.query(
            `
            SELECT image_url
            FROM publication_images
            WHERE publication_id = ?
            ORDER BY created_at ASC
            `,
            [publicationId]
        );

        // Devolver la publicación con todas sus imágenes
        res.status(200).json({
            success: true,
            publication: {
                ...publication[0],
                address: {
                    barrio: publication[0].barrio,
                    calle_carrera: publication[0].calle_carrera,
                    numero: publication[0].numero,
                    conjunto_torre: publication[0].conjunto_torre,
                    apartamento: publication[0].apartamento,
                    piso: publication[0].piso
                }
            },
            images: images.map(img => img.image_url)
        });
    } catch (error) {
        console.error('Error al obtener los detalles de la publicación:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los detalles de la publicación' });
    }
});

// Ruta para actualizar el estado de una publicación (aprobar o rechazar)
router.put('/:id/status', isAuthenticated, async (req, res) => {
    try {
        const adminEmail = req.headers['x-user-email'] || req.body.email;
        const publicationId = req.params.id;
        const { status, reason, rejectionDetails } = req.body;

        // Verificar si el usuario es administrador
        const [admin] = await pool.query(
            `SELECT email FROM admins WHERE email = ?`,
            [adminEmail]
        );

        if (!admin.length) {
            return res.status(403).json({ success: false, message: 'Acceso denegado: solo administradores' });
        }

        // Validar el estado
        if (!['available', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Estado no válido' });
        }

        // Si el estado es 'rejected', asegurarse de que reason y rejectionDetails estén presentes
        if (status === 'rejected' && (!reason || !rejectionDetails)) {
            return res.status(400).json({ success: false, message: 'Motivo y descripción del rechazo son requeridos' });
        }

        // Obtener el email del propietario y el título de la publicación
        const [publication] = await pool.query(
            `
            SELECT 
                p.title,
                p.landlord_email AS owner_email
            FROM publications p
            WHERE p.id = ?
            `,
            [publicationId]
        );

        if (!publication.length) {
            return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
        }

        const { title, owner_email } = publication[0];

        // Actualizar el estado de la publicación
        await pool.query(
            `
            UPDATE publications
            SET status = ?, updated_at = NOW()
            WHERE id = ?
            `,
            [status, publicationId]
        );

        // Si la publicación es aprobada (status = 'available'), crear una notificación y enviar un correo
        if (status === 'available') {
            // Insertar la notificación en la tabla notifications
            await pool.query(
                `
                INSERT INTO notifications (user_email, type, message, action_url, \`read\`, created_at)
                VALUES (?, 'publication_status', ?, ?, 0, NOW())
                `,
                [
                    owner_email,
                    `Tu publicación "${title}" ha sido aprobada.`,
                    `/publications/${publicationId}`
                ]
            );

            // Enviar correo de notificación al usuario
            const { sendPublicationApprovedEmail } = require('../utils/email');
            await sendPublicationApprovedEmail(owner_email, title);
        }

        // Si la publicación es rechazada (status = 'rejected'), crear una notificación y enviar un correo
        if (status === 'rejected') {
            // Insertar la notificación en la tabla notifications
            await pool.query(
                `
                INSERT INTO notifications (user_email, type, message, action_url, \`read\`, created_at)
                VALUES (?, 'publication_status', ?, ?, 0, NOW())
                `,
                [
                    owner_email,
                    `Tu publicación "${title}" ha sido rechazada por el motivo de (${reason}).`,
                    `/publications/${publicationId}/edit`
                ]
            );

            // Enviar correo de notificación al usuario con el motivo y la descripción
            const { sendPublicationRejectedEmail } = require('../utils/email');
            await sendPublicationRejectedEmail(owner_email, title, reason, rejectionDetails);
        }

        res.status(200).json({ success: true, message: 'Estado de la publicación actualizado' });
    } catch (error) {
        console.error('Error al actualizar el estado de la publicación:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el estado de la publicación' });
    }
});

// Ruta para eliminar una publicación
router.delete('/:id', isAuthenticated, async (req, res) => {
    let connection;
    try {
        const adminEmail = req.headers['x-user-email'] || req.body.email;
        const publicationId = req.params.id;
        const { reason, deletionDetails, reportId } = req.body;

        // Verificar si el usuario es administrador
        const [admin] = await pool.query(
            `SELECT email FROM admins WHERE email = ?`,
            [adminEmail]
        );

        if (!admin.length) {
            return res.status(403).json({ success: false, message: 'Acceso denegado: solo administradores' });
        }

        // Validar que se proporcionen motivo, detalles y reportId
        if (!reason || !deletionDetails || !reportId) {
            return res.status(400).json({
                success: false,
                message: 'Motivo, detalles de la eliminación y ID del reporte son requeridos'
            });
        }

        // Obtener conexión para transacción
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Obtener el email del propietario y el título de la publicación
        const [publication] = await connection.query(
            `
            SELECT 
                p.title,
                p.landlord_email AS owner_email
            FROM publications p
            WHERE p.id = ?
            `,
            [publicationId]
        );

        if (!publication.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
        }

        const { title, owner_email } = publication[0];

        // Obtener todos los reportes asociados a la publicación
        const [reports] = await connection.query(
            `
            SELECT id, tenant_email, case_number
            FROM reports
            WHERE publication_id = ?
            `,
            [publicationId]
        );

        // Validar que el reportId proporcionado exista
        const acceptedReport = reports.find(report => report.id === parseInt(reportId));
        if (!acceptedReport) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'El ID del reporte proporcionado no es válido'
            });
        }

        // Verificar si hay acuerdos asociados con la publicación
        const [agreements] = await connection.query(
            `
            SELECT id, tenant_email, contract_id, start_date, end_date, status
            FROM agreements
            WHERE publication_id = ?
            `,
            [publicationId]
        );

        // Definir razón genérica para la cancelación del contrato
        const genericCancellationReason = 'Por decisión administrativa de la plataforma';

        // Notificar a los arrendatarios con acuerdos activos o en proceso
        const { sendContractCancelledEmailTenant } = require('../utils/email');
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
                        title,
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
                        `Tu contrato ${contractId} para la publicación "${title}" ha sido cancelado ${genericCancellationReason}.`,
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

        // Obtener y eliminar todas las conversaciones asociadas con la publicación
        const [conversations] = await connection.query(
            `
            SELECT id
            FROM conversations
            WHERE publication_id = ?
            `,
            [publicationId]
        );

        for (const conversation of conversations) {
            // Eliminar los mensajes asociados con cada conversación
            await connection.query(
                `
                DELETE FROM messages
                WHERE conversation_id = ?
                `,
                [conversation.id]
            );
        }

        // Eliminar las conversaciones
        await connection.query(
            `
            DELETE FROM conversations
            WHERE publication_id = ?
            `,
            [publicationId]
        );

        // Eliminar todos los reportes asociados a la publicación
        await connection.query(
            `
            DELETE FROM reports
            WHERE publication_id = ?
            `,
            [publicationId]
        );

        // Eliminar las imágenes asociadas a la publicación
        await connection.query(
            `
            DELETE FROM publication_images
            WHERE publication_id = ?
            `,
            [publicationId]
        );

        // Eliminar la publicación
        const [result] = await connection.query(
            `
            DELETE FROM publications
            WHERE id = ?
            `,
            [publicationId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
        }

        // Confirmar la transacción
        await connection.commit();

        // Crear notificación para el propietario
        await pool.query(
            `
            INSERT INTO notifications (user_email, type, message, action_url, \`read\`, created_at)
            VALUES (?, 'publication_deleted', ?, ?, 0, NOW())
            `,
            [
                owner_email,
                `Tu publicación "${title}" ha sido eliminada por el motivo: ${reason}.`,
                `/contact`
            ]
        );

        // Crear notificaciones para los arrendatarios que reportaron
        for (const report of reports) {
            const notificationMessage = `Tu reporte #${report.case_number} fue procesado y la publicación "${title}" ha sido eliminada.`;

            await pool.query(
                `
                INSERT INTO notifications (user_email, type, message, action_url, \`read\`, created_at)
                VALUES (?, 'report_accepted', ?, ?, 0, NOW())
                `,
                [
                    report.tenant_email,
                    notificationMessage,
                    `/reports`
                ]
            );
        }

        // Enviar correo de notificación al propietario
        const { sendPublicationDeletedEmail } = require('../utils/email');
        await sendPublicationDeletedEmail(owner_email, title, reason, deletionDetails);

        // Enviar correo solo al arrendatario cuyo reporte fue aceptado
        const { sendReportAcceptedEmail } = require('../utils/email');
        await sendReportAcceptedEmail(acceptedReport.tenant_email, title, acceptedReport.case_number);

        res.status(200).json({
            success: true,
            message: 'Publicación eliminada correctamente'
        });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al eliminar la publicación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la publicación'
        });
    } finally {
        if (connection) connection.release();
    }
});

// Ruta para obtener todos los reportes pendientes (para el administrador)
router.get('/reports/admin/all', isAuthenticated, async (req, res) => {
    try {
        const adminEmail = req.headers['x-user-email'] || req.body.email;

        // Verificar si el usuario es administrador
        const [admin] = await pool.query(
            `SELECT email FROM admins WHERE email = ?`,
            [adminEmail]
        );

        if (!admin.length) {
            return res.status(403).json({ success: false, message: 'Acceso denegado: solo administradores' });
        }

        // Obtener solo reportes con status 'Pendiente'
        const [reports] = await pool.query(
            `
            SELECT 
                r.id,
                r.publication_id,
                r.tenant_email,
                r.reason,
                r.description,
                r.status,
                r.case_number,
                r.created_at,
                p.title AS publication_title,
                u.full_name AS tenant_name
            FROM reports r
            LEFT JOIN publications p ON r.publication_id = p.id
            LEFT JOIN users u ON r.tenant_email = u.email
            WHERE r.status = 'Pendiente'
            ORDER BY r.created_at DESC
            `
        );

        // Si no hay reportes, devolver un array vacío
        if (!reports || reports.length === 0) {
            return res.status(200).json({ success: true, reports: [] });
        }

        // Devolver los reportes
        res.status(200).json({ success: true, reports });
    } catch (error) {
        console.error('Error al obtener los reportes:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los reportes' });
    }
});

// Ruta para desestimar (rechazar reporte)
router.post('/reports/admin/:id/reject', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    
    // ✅ Obtener email del administrador desde headers o body
    const adminEmail = req.headers['x-user-email'] || req.body.email;
    
    // Validaciones iniciales
    if (!adminEmail) {
        return res.status(401).json({ 
            success: false, 
            message: 'Usuario no autenticado' 
        });
    }

    if (!rejection_reason || rejection_reason.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'La razón del rechazo es obligatoria'
        });
    }

    if (rejection_reason.length > 500) {
        return res.status(400).json({
            success: false,
            message: 'La razón del rechazo no debe exceder 500 caracteres'
        });
    }

    try {
        // 🔐 Verificar que el usuario sea administrador
        const [admin] = await pool.query(
            `SELECT email FROM admins WHERE email = ?`,
            [adminEmail]
        );
        
        if (!admin.length) {
            return res.status(403).json({ 
                success: false, 
                message: 'Acceso denegado: solo administradores' 
            });
        }

        // Verificar si el reporte existe y está pendiente
        const [reportRows] = await pool.query(
            'SELECT tenant_email, case_number, publication_id FROM reports WHERE id = ? AND status = ?',
            [id, 'Pendiente']
        );
        
        if (reportRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reporte no encontrado o no está pendiente'
            });
        }

        const { tenant_email, case_number, publication_id } = reportRows[0];
        
        // Obtener título de la publicación
        const [publicationRows] = await pool.query(
            'SELECT title FROM publications WHERE id = ?',
            [publication_id]
        );
        
        const publicationTitle = publicationRows.length > 0 
            ? publicationRows[0].title 
            : 'No disponible';

        // Iniciar transacción
        await pool.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
        await pool.query('START TRANSACTION');

        try {
            // Actualizar estado del reporte
            await pool.query(
                'UPDATE reports SET status = ?, rejection_reason = ?, updated_at = NOW() WHERE id = ?',
                ['Rechazado', rejection_reason, id]
            );

            // Crear notificación
            const notificationMessage = `Tu reporte #${case_number} sobre la publicación "${publicationTitle}" ha sido rechazado. Razón: ${rejection_reason}`;
            
            await pool.query(
                'INSERT INTO notifications (user_email, type, message, action_url, `read`, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                [tenant_email, 'report_rejected', notificationMessage, null, 0]
            );

            // Enviar correo
            const { sendReportRejectionEmail } = require('../utils/email');
            await sendReportRejectionEmail(tenant_email, publicationTitle, case_number, rejection_reason);
            
            await pool.query('COMMIT');
            
            res.json({
                success: true,
                message: 'Reporte rechazado correctamente'
            });
        } catch (innerError) {
            await pool.query('ROLLBACK');
            console.error('Error en la transacción:', innerError);
            throw innerError;
        }
    } catch (error) {
        console.error('Error al rechazar el reporte:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar la solicitud'
        });
    }
});

module.exports = router;