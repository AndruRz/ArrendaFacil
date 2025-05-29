const express = require('express');
const path = require('path');
const os = require('os');
const cors = require('cors');
const publicationRoutes = require('./routes/publicationRoutes'); 
const authRoutes = require('./routes/auth');
const loginRoutes = require('./routes/loginservice');
const indexRoutes = require('./routes/index');
const animationRoutes = require('./routes/animation');
const accountActionsRoutes = require('./routes/accountActions');
const landlordPublicationsRoutes = require('./routes/landlordPublications');
const adminActionsRoutes = require('./routes/adminActions');
const arrendatarioActions = require('./routes/arrendatarioActions');
const conversationRoutes = require('./routes/conversation');
const acuerdosService = require('./routes/acuerdosService'); 
const ratingsRoutes = require('./routes/ratingsRoutes'); // Nueva importación
const { initSocket } = require('./config/socket_io');

require('dotenv').config();

// Crear la aplicación Express
const app = express();

// Obtener la IP local automáticamente
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

// Variables
const localIP = getLocalIP();
const PORT = process.env.PORT || 3000;

// Determinar URLs dinámicamente
const socketUrlLocalhost = `http://localhost:${PORT}`;
const socketUrlLocalIP = `http://${localIP}:${PORT}`;
const socketUrlNgrok = process.env.SOCKET_URL_NGROK || 'https://<your-ngrok-url>.ngrok-free.app';

// Determinar si se usa ngrok
const environment = process.env.ENVIRONMENT || 'local';
const isNgrok = environment === 'ngrok';

// Configuración de CORS
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            socketUrlLocalhost,
            socketUrlLocalIP,
            socketUrlNgrok,
            'https://*.ngrok-free.app', // Permitir subdominios de ngrok
            'https://*.ngrok.io'
        ];
        if (!origin || allowedOrigins.some(allowed => allowed === origin || origin.includes('ngrok'))) {
            callback(null, true);
        } else {
            console.error(`CORS bloqueó origen: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Endpoint para que el frontend obtenga la URL del socket
app.get('/api/config', (req, res) => {
    let socketUrl;
    if (isNgrok) {
        socketUrl = socketUrlNgrok; // Usar la URL de ngrok para WebSocket
    } else {
        // Determinar si el cliente está accediendo desde localhost o la IP local
        const host = req.headers.host || '';
        if (host.includes('localhost') || host.includes('127.0.0.1')) {
            socketUrl = socketUrlLocalhost;
        } else {
            socketUrl = socketUrlLocalIP;
        }
    }
    res.json({
        socketUrl: socketUrl
    });
});

// Rutas específicas primero
app.use('/api/publications', publicationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', loginRoutes);
app.use('/api', animationRoutes);
app.use('/api', accountActionsRoutes);
app.use('/api/publications/landlord', landlordPublicationsRoutes);
app.use('/api/publications/admin', adminActionsRoutes);
app.use('/api', arrendatarioActions);
app.use('/api/conversations', conversationRoutes);
app.use('/api/ratings', ratingsRoutes); 
app.use('/api/acuerdos', acuerdosService);
app.use('/', indexRoutes);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'data')));

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor disponible en:`);
    console.log(`👉 Localhost:    ${socketUrlLocalhost}`);
    console.log(`👉 Red local:    ${socketUrlLocalIP}`);
    if (isNgrok) {
        console.log(`👉 Ngrok:        ${socketUrlNgrok}`);
    }
});

// Inicializar Socket.io
const io = initSocket(server);

// Manejar cierre del servidor
process.on('SIGTERM', () => {
    console.log('Cerrando servidor...');
    server.close(() => {
        console.log('Servidor cerrado.');
        process.exit(0);
    });
});