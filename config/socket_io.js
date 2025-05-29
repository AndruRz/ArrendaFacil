const { Server } = require('socket.io');
const pool = require('../config/db'); // Usar el pool de mysql2/promise
const os = require('os');

function initSocket(server) {
    // Obtener la IP local dinámicamente
    function getLocalIP() {
        const interfaces = os.networkInterfaces();
        for (const name in interfaces) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
        return 'localhost';
    }

    const localIP = getLocalIP();
    const PORT = process.env.PORT || 3000;
    const socketUrlLocalhost = `http://localhost:${PORT}`;
    const socketUrlLocalIP = `http://${localIP}:${PORT}`;
    const socketUrlNgrok = process.env.SOCKET_URL_NGROK || 'https://<your-ngrok-url>.ngrok-free.app';

    const io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                const allowedOrigins = [
                    socketUrlLocalhost,
                    socketUrlLocalIP,
                    socketUrlNgrok,
                    'https://*.ngrok-free.app',
                    'https://*.ngrok.io'
                ];
                if (!origin || allowedOrigins.some(allowed => allowed === origin || origin.includes('ngrok'))) {
                    console.log(`Socket.IO permitió origen: ${origin || 'sin origen'}`);
                    callback(null, true);
                } else {
                    console.error(`Socket.IO bloqueó origen: ${origin}`);
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['websocket', 'polling'], // Priorizar WebSocket, con fallback a polling
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        timeout: 30000
    });

    io.on('connection', (socket) => {
        console.log('Usuario conectado:', socket.id, 'Origen:', socket.handshake.headers.origin);

        socket.on('join_conversation', async ({ conversationId, userEmail }) => {
            console.log(`Intento de unirse a conversación ${conversationId} por ${userEmail}`);
            try {
                const [conversation] = await pool.query(
                    'SELECT id FROM conversations WHERE id = ? AND (landlord_email = ? OR tenant_email = ?)',
                    [conversationId, userEmail, userEmail]
                );
                if (conversation.length === 0) {
                    socket.emit('error', { message: 'Conversación no encontrada o acceso denegado' });
                    return;
                }
                socket.join(`conversation_${conversationId}`);
                console.log(`Usuario ${userEmail} se unió a la conversación ${conversationId}`);
            } catch (error) {
                console.error('Error en join_conversation:', error);
                socket.emit('error', { message: 'Error al unirse a la conversación', details: error.message });
            }
        });

        socket.on('send_message', async ({ conversationId, content, senderEmail, receiverEmail, sent_at }) => {
            try {
                console.log(`Enviando mensaje en conversación ${conversationId} de ${senderEmail} a ${receiverEmail}`);
                const [conversation] = await pool.query(
                    'SELECT id FROM conversations WHERE id = ? AND (landlord_email = ? OR tenant_email = ?)',
                    [conversationId, senderEmail, senderEmail]
                );
                if (conversation.length === 0) {
                    socket.emit('error', { message: 'Conversación no encontrada o acceso denegado' });
                    return;
                }

                const [senderData] = await pool.query('SELECT full_name FROM users WHERE email = ?', [senderEmail]);
                const [conversationData] = await pool.query(
                    'SELECT p.title FROM conversations c JOIN publications p ON c.publication_id = p.id WHERE c.id = ?',
                    [conversationId]
                );
                if (!senderData.length || !conversationData.length) {
                    socket.emit('error', { message: 'Usuario o publicación no encontrados' });
                    return;
                }
                const senderName = senderData[0].full_name;
                const publicationTitle = conversationData[0].title;

                const clientSentAt = new Date(sent_at);
                if (isNaN(clientSentAt)) {
                    throw new Error('Formato de fecha inválido');
                }

                const [result] = await pool.query(
                    'INSERT INTO messages (conversation_id, sender_email, receiver_email, content, sent_at, is_read) VALUES (?, ?, ?, ?, ?, FALSE)',
                    [conversationId, senderEmail, receiverEmail, content, clientSentAt]
                );
                const messageId = result.insertId;

                const [message] = await pool.query(
                    'SELECT id, conversation_id, sender_email, receiver_email, content, sent_at, is_read FROM messages WHERE id = ?',
                    [messageId]
                );
                message[0].sent_at = message[0].sent_at.toISOString();

                const shortContent = content.length > 50 ? content.substring(0, 47) + '...' : content;
                const sentAtFormatted = new Date(clientSentAt).toLocaleString('es-CO', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const notificationMessage = `Nuevo mensaje de ${senderName} en "${publicationTitle}": "${shortContent}" (${sentAtFormatted})`;
                await pool.query(
                    'INSERT INTO notifications (user_email, type, message, action_url, `read`, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [receiverEmail, 'message', notificationMessage, `/conversations/${conversationId}`, 0, new Date()]
                );

                io.to(`conversation_${conversationId}`).emit('new_message', message[0]);
            } catch (error) {
                console.error('Error en send_message:', error);
                socket.emit('error', { message: 'Error al enviar el mensaje', details: error.message });
            }
        });

        socket.on('mark_as_read', async ({ conversationId, userEmail }) => {
            try {
                console.log(`Marcando mensajes como leídos en conversación ${conversationId} para ${userEmail}`);
                await pool.query(
                    'UPDATE messages SET is_read = TRUE WHERE conversation_id = ? AND receiver_email = ? AND is_read = FALSE',
                    [conversationId, userEmail]
                );
                io.to(`conversation_${conversationId}`).emit('message_read', { conversationId });
            } catch (error) {
                console.error('Error en mark_as_read:', error);
                socket.emit('error', { message: 'Error al marcar mensajes como leídos', details: error.message });
            }
        });

        socket.on('disconnect', () => {
            console.log('Usuario desconectado:', socket.id);
        });

        socket.on('error', (error) => {
            console.error('Error de Socket.IO en el cliente:', error);
        });
    });

    return io;
}

module.exports = { initSocket };