const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Usar el pool de mysql2/promise
const { sendConversationStartedEmail } = require('../utils/email');

// Crear o recuperar una conversación
router.post('/', async (req, res) => {
    try {
        const userEmail = req.headers['x-user-email'];
        if (!userEmail) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        const { publicationId, landlordEmail } = req.body;
        if (!publicationId || !landlordEmail) {
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos' });
        }

        // Verificar si la conversación ya existe
        const [existing] = await pool.query(
            'SELECT id FROM conversations WHERE publication_id = ? AND landlord_email = ? AND tenant_email = ?',
            [publicationId, landlordEmail, userEmail]
        );

        if (existing.length > 0) {
            return res.json({ success: true, conversationId: existing[0].id });
        }

        // Obtener datos para el correo y notificación
        const [tenantData] = await pool.query('SELECT full_name FROM users WHERE email = ?', [userEmail]);
        const [publicationData] = await pool.query('SELECT title FROM publications WHERE id = ?', [publicationId]);
        if (!tenantData.length || !publicationData.length) {
            return res.status(400).json({ success: false, message: 'Usuario o publicación no encontrados' });
        }
        const tenantName = tenantData[0].full_name;
        const publicationTitle = publicationData[0].title;

        // Iniciar transacción
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Crear nueva conversación
            const [result] = await connection.query(
                'INSERT INTO conversations (publication_id, landlord_email, tenant_email, created_at) VALUES (?, ?, ?, ?)',
                [publicationId, landlordEmail, userEmail, new Date()]
            );
            const conversationId = result.insertId;

            // Insertar mensaje automático
            const autoMessage = 'Hola, estoy interesado en esta publicación';
            await connection.query(
                'INSERT INTO messages (conversation_id, sender_email, receiver_email, content, sent_at, is_read) VALUES (?, ?, ?, ?, ?, FALSE)',
                [conversationId, userEmail, landlordEmail, autoMessage, new Date()]
            );

            // Crear notificación para el arrendador
            const notificationMessage = `Nuevo mensaje de ${tenantName} en "${publicationTitle}".`;
            await connection.query(
                'INSERT INTO notifications (user_email, type, message, action_url, `read`, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                [landlordEmail, 'message', notificationMessage, `/conversations/${conversationId}`, 0, new Date()]
            );

            // Confirmar transacción
            await connection.commit();

            // Enviar correo al arrendador (fuera de la transacción para no bloquear)
            await sendConversationStartedEmail(landlordEmail, tenantName, publicationTitle, conversationId);

            res.json({ success: true, conversationId });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error en POST /api/conversations:', error);
        res.status(500).json({ success: false, message: 'Error al iniciar la conversación' });
    }
});

// Obtener mensajes de una conversación
router.get('/:conversationId/messages', async (req, res) => {
    try {
        const userEmail = req.headers['x-user-email'];
        if (!userEmail) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        const { conversationId } = req.params;
        const [messages] = await pool.query(
            'SELECT id, conversation_id, sender_email, receiver_email, content, sent_at, is_read FROM messages WHERE conversation_id = ? ORDER BY sent_at ASC',
            [conversationId]
        );

        // Convertir sent_at a ISO 8601 (UTC)
        const formattedMessages = messages.map(message => ({
            ...message,
            sent_at: message.sent_at.toISOString()
        }));

        res.json({ success: true, messages: formattedMessages });
    } catch (error) {
        console.error('Error en GET /api/conversations/:conversationId/messages:', error);
        res.status(500).json({ success: false, message: 'Error al obtener mensajes' });
    }
});

// Obtener conversaciones del arrendatario
router.get('/', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) {
        return res.status(401).json({ success: false, message: 'No se proporcionó el email del usuario.' });
    }

    try {
        const searchQuery = req.query.search || '';
        const queryParams = [userEmail];
        let searchCondition = '';
        if (searchQuery) {
            searchCondition = 'AND (p.title LIKE ? OR u.full_name LIKE ?)';
            queryParams.push(`%${searchQuery}%`, `%${searchQuery}%`);
        }

        const [result] = await pool.query(
            `
            SELECT 
                c.id AS conversation_id,
                c.publication_id,
                u.full_name AS landlord_name,
                u.profile_picture AS landlord_profile_picture,
                p.title AS publication_title,
                m.content AS last_message_content,
                m.sent_at AS last_message_sent_at,
                m.sender_email AS last_message_sender_email,
                u.email AS landlord_email
            FROM conversations c
            JOIN users u ON c.landlord_email = u.email
            JOIN publications p ON c.publication_id = p.id
            LEFT JOIN messages m ON c.id = m.conversation_id 
                AND m.sent_at = (SELECT MAX(sent_at) FROM messages WHERE conversation_id = c.id)
            WHERE c.tenant_email = ? ${searchCondition}
            ORDER BY m.sent_at DESC
            `,
            queryParams
        );
        const conversations = result.map(row => ({
            id: row.conversation_id,
            publication_id: row.publication_id,
            landlord_name: row.landlord_name,
            landlord_profile_picture: row.landlord_profile_picture || '/img/default-profile.png',
            publication_title: row.publication_title,
            last_message: {
                content: row.last_message_content || 'Sin mensajes aún',
                sent_at: row.last_message_sent_at ? row.last_message_sent_at.toISOString() : null,
                sender_email: row.last_message_sender_email
            },
            landlord_email: row.landlord_email
        }));

        res.json({ success: true, conversations });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener las conversaciones.' });
    }
});

// Obtener conversaciones del arrendador
router.get('/landlord', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) {
        return res.status(401).json({ success: false, message: 'No se proporcionó el email del usuario.' });
    }

    try {
        const searchQuery = req.query.search || '';
        const queryParams = [userEmail];
        let searchCondition = '';
        if (searchQuery) {
            searchCondition = 'AND (p.title LIKE ? OR u.full_name LIKE ?)';
            queryParams.push(`%${searchQuery}%`, `%${searchQuery}%`);
        }

        const [result] = await pool.query(
            `
            SELECT 
                c.id AS conversation_id,
                c.publication_id,
                u.full_name AS tenant_name,
                u.profile_picture AS tenant_profile_picture,
                p.title AS publication_title,
                m.content AS last_message_content,
                m.sent_at AS last_message_sent_at,
                m.sender_email AS last_message_sender_email,
                u.email AS tenant_email
            FROM conversations c
            JOIN users u ON c.tenant_email = u.email
            JOIN publications p ON c.publication_id = p.id
            LEFT JOIN messages m ON c.id = m.conversation_id 
                AND m.sent_at = (SELECT MAX(sent_at) FROM messages WHERE conversation_id = c.id)
            WHERE c.landlord_email = ? ${searchCondition}
            ORDER BY m.sent_at DESC
            `,
            queryParams
        );
        const conversations = result.map(row => ({
            id: row.conversation_id,
            publication_id: row.publication_id,
            tenant_name: row.tenant_name,
            tenant_profile_picture: row.tenant_profile_picture || '/img/default-profile.png',
            publication_title: row.publication_title,
            last_message: {
                content: row.last_message_content || 'Sin mensajes aún',
                sent_at: row.last_message_sent_at ? row.last_message_sent_at.toISOString() : null,
                sender_email: row.last_message_sender_email
            },
            tenant_email: row.tenant_email
        }));

        res.json({ success: true, conversations });
    } catch (error) {
        console.error('Error en GET /api/conversations/landlord:', error);
        res.status(500).json({ success: false, message: 'Error al obtener las conversaciones.' });
    }
});

// Obtener detalles de una conversación específica
router.get('/:conversationId', async (req, res) => {
    try {
        const userEmail = req.headers['x-user-email'];
        if (!userEmail) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        const { conversationId } = req.params;

        const [result] = await pool.query(
            `
            SELECT 
                c.id,
                c.publication_id,
                u.full_name AS tenant_name,
                u.profile_picture AS tenant_profile_picture,
                p.title AS publication_title,
                u.email AS tenant_email
            FROM conversations c
            JOIN users u ON c.tenant_email = u.email
            JOIN publications p ON c.publication_id = p.id
            WHERE c.id = ? AND c.landlord_email = ?
            `,
            [conversationId, userEmail]
        );

        if (!result.length) {
            return res.status(404).json({ 
                success: false, 
                message: 'Conversación no encontrada o no tienes permiso para acceder a ella' 
            });
        }

        const conversation = {
            id: result[0].id,
            publication_id: result[0].publication_id,
            tenant_name: result[0].tenant_name,
            tenant_profile_picture: result[0].tenant_profile_picture || '/img/default-profile.png',
            publication_title: result[0].publication_title,
            tenant_email: result[0].tenant_email
        };

        res.json({ success: true, conversation });
    } catch (error) {
        console.error('Error en GET /api/conversations/:conversationId:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los detalles de la conversación' });
    }
});

// Obtener detalles de una conversación específica para el arrendatario
router.get('/tenant/:conversationId', async (req, res) => {
    try {
        const userEmail = req.headers['x-user-email'];
        if (!userEmail) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        const { conversationId } = req.params;

        const [result] = await pool.query(
            `
            SELECT 
                c.id,
                c.publication_id,
                c.landlord_email,
                c.tenant_email,
                u.full_name AS landlord_name,
                u.profile_picture AS landlord_profile_picture,
                p.title AS publication_title
            FROM conversations c
            JOIN users u ON c.landlord_email = u.email
            JOIN publications p ON c.publication_id = p.id
            WHERE c.id = ? AND c.tenant_email = ?
            `,
            [conversationId, userEmail]
        );

        if (!result.length) {
            return res.status(404).json({ 
                success: false, 
                message: 'Conversación no encontrada o no tienes permiso para acceder a ella' 
            });
        }

        const conversation = {
            id: result[0].id,
            publication_id: result[0].publication_id,
            landlord_email: result[0].landlord_email,
            landlord_name: result[0].landlord_name,
            landlord_profile_picture: result[0].landlord_profile_picture || '/img/default-profile.png',
            publication_title: result[0].publication_title,
            tenant_email: result[0].tenant_email
        };

        res.json({ success: true, conversation });
    } catch (error) {
        console.error('Error en GET /api/conversations/tenant/:conversationId:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los detalles de la conversación' });
    }
});

module.exports = router;