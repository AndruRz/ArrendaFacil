const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const cloudinary = require('../config/cloudinary');
const { sendPublicationSuccessEmail, sendPublicationReviewEmail } = require('../utils/email');
const multer = require('multer');
const sharp = require('sharp'); // Añadido para compresión de imágenes
const fs = require('fs').promises;
const path = require('path');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedFormats = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedFormats.includes(file.mimetype)) {
            return cb(new Error('Solo se permiten archivos PNG, JPG o JPEG'));
        }
        cb(null, true);
    }
});

// Middleware para verificar autenticación
const isAuthenticated = (req, res, next) => {
    if (!req.headers['x-user-email'] && !req.body.email) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }
    next();
};

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: `Error en la carga de archivos: ${err.message}` });
    }
    if (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
    next();
};

// Route para crear una publicación
router.post('/create', isAuthenticated, upload.array('images', 10), handleMulterError, async (req, res) => {
    try {
        const landlordEmail = req.headers['x-user-email'] || req.body.email;
        const { 
            type, title, description, price, availability, conditions,
            barrio, calle_carrera, numero, conjunto_torre, apartamento, piso,
            conjunto_edificio, en_edificio
        } = req.body;

        // Validar campos requeridos básicos
        if (!type || !title || !description || !price || !availability) {
            return res.status(400).json({ success: false, message: 'Todos los campos obligatorios deben ser proporcionados' });
        }

        // Validar space_type
        const validTypes = ['apartamento', 'casa', 'habitacion', 'parqueo', 'bodega'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ success: false, message: 'Tipo de espacio inválido' });
        }

        // Validar título
        if (title.length > 100) {
            return res.status(400).json({ success: false, message: 'El título no debe exceder 100 caracteres' });
        }

        // Validar descripción
        if (description.length > 500) {
            return res.status(400).json({ success: false, message: 'La descripción no debe exceder 500 caracteres' });
        }

        // Validar precio
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            return res.status(400).json({ success: false, message: 'El precio debe ser un número positivo mayor a 0' });
        }

        // Validar disponibilidad
        const validAvailabilities = ['inmediata', 'futura_1mes', 'futura_3meses', 'no_disponible'];
        if (!validAvailabilities.includes(availability)) {
            return res.status(400).json({ success: false, message: 'Disponibilidad inválida' });
        }

        // Validar condiciones
        if (conditions && conditions.length > 500) {
            return res.status(400).json({ success: false, message: 'Las condiciones no deben exceder 500 caracteres' });
        }

        // Validar imágenes
        const files = req.files || [];
        const maxImages = 10;
        if (files.length > maxImages) {
            return res.status(400).json({ success: false, message: `Solo puedes subir un máximo de ${maxImages} imágenes` });
        }

        // Cargar listas de barrios y conjuntos
        const barriosData = await fs.readFile(path.join(__dirname, '../data/cali_neighborhoods.json'), 'utf8');
        const conjuntosData = await fs.readFile(path.join(__dirname, '../data/cali_conjuntos.json'), 'utf8');
        const barrios = JSON.parse(barriosData).neighborhoods.map(n => n.name);
        const conjuntos = JSON.parse(conjuntosData).conjuntos.map(c => c.name);

        // Validar campos de dirección requeridos
        if (!barrio || !calle_carrera || !numero) {
            return res.status(400).json({ success: false, message: 'Barrio, calle/carrera y número son obligatorios' });
        }

        // Validar barrio contra la lista
        if (!barrios.includes(barrio)) {
            return res.status(400).json({ success: false, message: 'Aún no has seleccionado un barrio de forma correcta' });
        }

        // Validar calle_carrera
        if (!/^Calle|Carrera\s\d+[A-Z]?$/.test(calle_carrera)) {
            return res.status(400).json({ success: false, message: 'Formato inválido para calle/carrera (ej. Calle 5, Carrera 100A)' });
        }

        // Validar número
        if (!/^[0-9]+[A-Z0-9]*-[0-9]+[A-Z]?$/.test(numero)) {
            return res.status(400).json({ success: false, message: 'Formato inválido para número (ej. 41E3-84, 45-67, 45A-12)' });
        }

        // Preparar datos de la dirección
        let addressData = {
            barrio,
            calle_carrera,
            numero,
            conjunto_torre: null,
            apartamento: null,
            piso: null
        };

        if (type === 'apartamento') {
            // Campos requeridos: conjunto_torre, apartamento, piso
            if (!conjunto_torre || !apartamento || !piso) {
                return res.status(400).json({ success: false, message: 'Conjunto/torre, apartamento y piso son obligatorios para apartamentos' });
            }
            if (!conjuntos.includes(conjunto_torre)) {
                return res.status(400).json({ success: false, message: 'Aún no has seleccionado un conjunto de forma correcta' });
            }
            if (conjunto_torre.length > 100) {
                return res.status(400).json({ success: false, message: 'El conjunto/torre no debe exceder 100 caracteres' });
            }
            if (apartamento.length > 20) {
                return res.status(400).json({ success: false, message: 'El número de apartamento no debe exceder 20 caracteres' });
            }
            const parsedPiso = parseInt(piso);
            if (isNaN(parsedPiso) || parsedPiso <= 0) {
                return res.status(400).json({ success: false, message: 'El piso debe ser un número positivo' });
            }
            addressData.conjunto_torre = conjunto_torre;
            addressData.apartamento = apartamento;
            addressData.piso = parsedPiso;
        } else if (type === 'casa') {
            // No se requieren campos adicionales para casa
        } else if (type === 'habitacion') {
            // Campos opcionales si está en edificio
            if (en_edificio === 'true') {
                if (!conjunto_torre || !piso) {
                    return res.status(400).json({ success: false, message: 'Conjunto/torre y piso son obligatorios si la habitación está en un edificio' });
                }
                if (!conjuntos.includes(conjunto_torre)) {
                    return res.status(400).json({ success: false, message: 'Aún no has seleccionado un conjunto de forma correcta' });
                }
                if (conjunto_torre.length > 100) {
                    return res.status(400).json({ success: false, message: 'El conjunto/torre no debe exceder 100 caracteres' });
                }
                const parsedPiso = parseInt(piso);
                if (isNaN(parsedPiso) || parsedPiso <= 0) {
                    return res.status(400).json({ success: false, message: 'El piso debe ser un número positivo' });
                }
                addressData.conjunto_torre = conjunto_torre;
                addressData.piso = parsedPiso;
            }
        } else if (type === 'parqueo' || type === 'bodega') {
            // Campo opcional: conjunto_edificio
            if (conjunto_edificio) {
                if (!conjuntos.includes(conjunto_edificio)) {
                    return res.status(400).json({ success: false, message: 'Aún no has seleccionado un conjunto de forma correcta' });
                }
                if (conjunto_edificio.length > 100) {
                    return res.status(400).json({ success: false, message: 'El conjunto/edificio no debe exceder 100 caracteres' });
                }
                addressData.conjunto_torre = conjunto_edificio; // Usamos conjunto_torre para almacenar conjunto_edificio
            }
        }

        // Verificar unicidad de la dirección antes de insertar
        const [existingRows] = await pool.query(
            `SELECT COUNT(*) as count FROM publication_addresses 
             WHERE barrio = ? AND calle_carrera = ? AND numero = ? 
             AND (conjunto_torre = ? OR conjunto_torre IS NULL) 
             AND (apartamento = ? OR apartamento IS NULL) 
             AND (piso = ? OR piso IS NULL)`,
            [addressData.barrio, addressData.calle_carrera, addressData.numero, addressData.conjunto_torre || null, addressData.apartamento || null, addressData.piso || null]
        );

        if (existingRows[0].count > 0) {
            return res.status(400).json({ success: false, message: 'Esta dirección ya está registrada. Por favor, elige otra ubicación.' });
        }

        // Iniciar transacción
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Insertar publicación con status 'pending' y rental_status 'disponible'
            const [result] = await connection.query(
                `INSERT INTO publications (landlord_email, space_type, title, description, price, conditions, availability, status, rental_status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'disponible', NOW(), NOW())`,
                [landlordEmail, type, title, description, parsedPrice, conditions || null, availability]
            );
            const publicationId = result.insertId;

            // Insertar dirección en publication_addresses
            await connection.query(
                `INSERT INTO publication_addresses (
                    publication_id, barrio, calle_carrera, numero, conjunto_torre, apartamento, piso, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    publicationId,
                    addressData.barrio,
                    addressData.calle_carrera,
                    addressData.numero,
                    addressData.conjunto_torre,
                    addressData.apartamento,
                    addressData.piso
                ]
            );

            // Insertar notificación
            await connection.query(
                `INSERT INTO notifications (user_email, type, message, action_url, \`read\`, created_at)
                VALUES (?, 'publication_status', ?, ?, 0, NOW())`,
                [landlordEmail, `Tu publicación "${title}" ha sido creada y está en revisión, con estado de arrendamiento disponible.`, `/publications/${publicationId}`]
            );

            // Manejar subida de imágenes a Cloudinary con compresión y reintentos
            const imageUrls = [];
            for (let file of files) {
                let uploadSuccess = false;
                let attempt = 0;
                const maxAttempts = 3;

                while (!uploadSuccess && attempt < maxAttempts) {
                    try {
                        // Comprimir la imagen con sharp
                        const compressedImage = await sharp(file.buffer)
                            .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
                            .jpeg({ quality: 60 })
                            .toBuffer();

                        // Convertir la imagen comprimida a base64
                        const base64Image = `data:${file.mimetype};base64,${compressedImage.toString('base64')}`;

                        // Subir la imagen comprimida a Cloudinary
                        const result = await cloudinary.uploader.upload(base64Image, {
                            folder: 'arrendafacil/publications',
                            resource_type: 'image'
                        });

                        imageUrls.push(result.secure_url);
                        await connection.query(
                            `INSERT INTO publication_images (publication_id, image_url, created_at)
                            VALUES (?, ?, NOW())`,
                            [publicationId, result.secure_url]
                        );
                        uploadSuccess = true;
                    } catch (uploadError) {
                        attempt++;
                        console.error(`Intento ${attempt} de subida fallido para ${file.originalname}:`, uploadError);
                        if (attempt === maxAttempts) {
                            console.warn('Máximo número de reintentos alcanzado. Continuando sin esta imagen.');
                            break;
                        }
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Esperar antes de reintentar
                    }
                }
            }

            // Confirmar transacción
            await connection.commit();

            // Enviar correo de éxito
            await sendPublicationSuccessEmail(landlordEmail, title);

            // Programar correo de revisión
            setTimeout(async () => {
                try {
                    await sendPublicationReviewEmail(landlordEmail, title);
                } catch (error) {
                    console.error('Error enviando correo de revisión:', error);
                }
            }, 15000);

            res.status(201).json({ success: true, message: 'Publicación creada exitosamente' });
        } catch (error) {
            await connection.rollback();
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: 'La dirección proporcionada ya está registrada para otra publicación' });
            }
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error creando publicación:', error);
        res.status(500).json({ success: false, message: 'Error al crear la publicación' });
    }
});

// Obtener todas las notificaciones del usuario
router.get('/notifications', isAuthenticated, async (req, res) => {
    try {
        const userEmail = req.headers['x-user-email'] || req.body.email;
        const [notifications] = await pool.query(
            `SELECT id, type, message, action_url, \`read\`, created_at
             FROM notifications
             WHERE user_email = ?
             ORDER BY created_at DESC`,
            [userEmail]
        );

        if (notifications.length === 0) {
            return res.status(200).json({
                success: true,
                notifications: [],
                message: 'Aún no hay notificaciones para ti'
            });
        }

        res.status(200).json({
            success: true,
            notifications
        });
    } catch (error) {
        console.error('Error obteniendo notificaciones:', error);
        res.status(500).json({ success: false, message: 'Error al obtener notificaciones' });
    }
});

// Marcar una notificación como leída
router.patch('/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
        const userEmail = req.headers['x-user-email'] || req.body.email;
        const notificationId = req.params.id;

        const [result] = await pool.query(
            `UPDATE notifications
             SET \`read\` = 1
             WHERE id = ? AND user_email = ?`,
            [notificationId, userEmail]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notificación no encontrada o no pertenece al usuario'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notificación marcada como leída'
        });
    } catch (error) {
        console.error('Error marcando notificación como leída:', error);
        res.status(500).json({ success: false, message: 'Error al marcar notificación como leída' });
    }
});

// Ruta para obtener las publicaciones del usuario autenticado
router.get('/my-publications', async (req, res) => {
    try {
        const userEmail = req.headers['x-user-email'];

        if (!userEmail) {
            return res.status(400).json({ success: false, message: 'Correo del usuario no proporcionado' });
        }

        const { status, title, type, barrio, calle_carrera, numero, conjunto_torre, apartamento, piso } = req.query;

        let query = `
            SELECT 
                p.id, 
                p.space_type AS type, 
                p.title, 
                p.description, 
                p.price, 
                p.availability, 
                p.status, 
                p.rental_status,  -- Añadimos rental_status aquí
                p.created_at, 
                p.updated_at,
                pa.barrio, 
                pa.calle_carrera, 
                pa.numero, 
                pa.conjunto_torre, 
                pa.apartamento, 
                pa.piso,
                (SELECT pi.image_url 
                 FROM publication_images pi 
                 WHERE pi.publication_id = p.id 
                 ORDER BY pi.created_at ASC 
                 LIMIT 1) AS image_url
            FROM publications p
            LEFT JOIN publication_addresses pa ON p.id = pa.publication_id
            WHERE p.landlord_email = ?
        `;
        const queryParams = [userEmail];

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

        if (barrio) {
            conditions.push('pa.barrio LIKE ?');
            queryParams.push(`%${barrio}%`);
        }

        if (calle_carrera) {
            conditions.push('pa.calle_carrera LIKE ?');
            queryParams.push(`%${calle_carrera}%`);
        }

        if (numero) {
            conditions.push('pa.numero LIKE ?');
            queryParams.push(`%${numero}%`);
        }

        if (conjunto_torre) {
            conditions.push('pa.conjunto_torre LIKE ?');
            queryParams.push(`%${conjunto_torre}%`);
        }

        if (apartamento) {
            conditions.push('pa.apartamento LIKE ?');
            queryParams.push(`%${apartamento}%`);
        }

        if (piso) {
            conditions.push('pa.piso = ?');
            queryParams.push(piso);
        }

        if (conditions.length > 0) {
            query += ' AND ' + conditions.join(' AND ');
        }

        query += ' ORDER BY p.created_at DESC';

        const [publications] = await pool.query(query, queryParams);

        if (!publications || publications.length === 0) {
            return res.status(200).json({ success: true, publications: [] });
        }

        res.status(200).json({ success: true, publications });
    } catch (error) {
        console.error('Error al obtener las publicaciones:', error);
        res.status(500).json({ success: false, message: 'Error al obtener las publicaciones' });
    }
});

// Ruta para obtener los detalles de una publicación específica
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const userEmail = req.headers['x-user-email'];
        const publicationId = req.params.id;

        if (!userEmail) {
            return res.status(400).json({ success: false, message: 'Correo del usuario no proporcionado' });
        }

        // Obtener los detalles de la publicación
        const [publications] = await pool.query(
            `SELECT 
                p.id, 
                p.landlord_email,
                p.space_type, 
                p.title, 
                p.description, 
                p.price, 
                p.availability, 
                p.conditions, 
                p.status, 
                p.created_at, 
                p.updated_at,
                p.rental_status
            FROM publications p
            WHERE p.id = ?`,
            [publicationId]
        );

        if (!publications || publications.length === 0) {
            return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
        }

        const publication = publications[0];

        // Verificar que el usuario sea el propietario de la publicación
        if (publication.landlord_email !== userEmail) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para acceder a esta publicación' });
        }

        // Obtener las imágenes de la publicación
        const [images] = await pool.query(
            `SELECT image_url
             FROM publication_images
             WHERE publication_id = ?
             ORDER BY created_at ASC`,
            [publicationId]
        );

        const imageUrls = images.map(img => img.image_url);

        // Obtener la dirección de la publicación
        const [addresses] = await pool.query(
            `SELECT 
                barrio, 
                calle_carrera, 
                numero, 
                conjunto_torre, 
                apartamento, 
                piso
            FROM publication_addresses
            WHERE publication_id = ?`,
            [publicationId]
        );

        const address = addresses.length > 0 ? addresses[0] : {};

        // Devolver los detalles de la publicación, las imágenes y la dirección
        res.status(200).json({
            success: true,
            publication: {
                id: publication.id,
                space_type: publication.space_type,
                title: publication.title,
                description: publication.description,
                price: publication.price,
                availability: publication.availability,
                conditions: publication.conditions,
                status: publication.status,
                rental_status: publication.rental_status,
                created_at: publication.created_at,
                updated_at: publication.updated_at,
                address: {
                    barrio: address.barrio || '',
                    calle_carrera: address.calle_carrera || '',
                    numero: address.numero || '',
                    conjunto_torre: address.conjunto_torre || '',
                    apartamento: address.apartamento || '',
                    piso: address.piso || null
                }
            },
            images: imageUrls
        });
    } catch (error) {
        console.error('Error al obtener los detalles de la publicación:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los detalles de la publicación' });
    }
});

// Ruta para actualizar una publicación específica
router.put('/:id', isAuthenticated, upload.array('images', 10), handleMulterError, async (req, res) => {
    try {
        const userEmail = req.headers['x-user-email'] || req.body.email;
        const publicationId = req.params.id;
        const { 
            title, description, price, availability, conditions, existingImages, removedImages,
            barrio, calle_carrera, numero, conjunto_torre, apartamento, piso, conjunto_edificio, en_edificio 
        } = req.body;

        // Validar campos requeridos básicos
        if (!title || !description || !price || !availability) {
            return res.status(400).json({ success: false, message: 'Título, descripción, precio y disponibilidad son obligatorios' });
        }

        // Validar título
        if (title.length > 100) {
            return res.status(400).json({ success: false, message: 'El título no debe exceder 100 caracteres' });
        }

        // Validar descripción
        if (description.length > 500) {
            return res.status(400).json({ success: false, message: 'La descripción no debe exceder 500 caracteres' });
        }

        // Validar precio
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            return res.status(400).json({ success: false, message: 'El precio debe ser un número positivo mayor a 0' });
        }

        // Validar disponibilidad
        const validAvailabilities = ['inmediata', 'futura_1mes', 'futura_3meses', 'no_disponible'];
        if (!validAvailabilities.includes(availability)) {
            return res.status(400).json({ success: false, message: 'Disponibilidad inválida' });
        }

        // Validar condiciones
        if (conditions && conditions.length > 500) {
            return res.status(400).json({ success: false, message: 'Las condiciones no deben exceder 500 caracteres' });
        }

        // Obtener la publicación actual para verificar permisos, estado, tipo y datos de dirección
        const [publications] = await pool.query(
            `SELECT landlord_email, status, space_type, 
                    (SELECT barrio FROM publication_addresses WHERE publication_id = publications.id) as current_barrio,
                    (SELECT calle_carrera FROM publication_addresses WHERE publication_id = publications.id) as current_calle_carrera,
                    (SELECT numero FROM publication_addresses WHERE publication_id = publications.id) as current_numero,
                    (SELECT conjunto_torre FROM publication_addresses WHERE publication_id = publications.id) as current_conjunto_torre,
                    (SELECT apartamento FROM publication_addresses WHERE publication_id = publications.id) as current_apartamento,
                    (SELECT piso FROM publication_addresses WHERE publication_id = publications.id) as current_piso
             FROM publications
             WHERE id = ?`,
            [publicationId]
        );

        if (!publications || publications.length === 0) {
            return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
        }

        const publication = publications[0];
        const type = publication.space_type;

        // Verificar que el usuario sea el propietario de la publicación
        if (publication.landlord_email !== userEmail) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para editar esta publicación' });
        }

        // Cargar listas de barrios y conjuntos
        const barriosData = await fs.readFile(path.join(__dirname, '../data/cali_neighborhoods.json'), 'utf8');
        const conjuntosData = await fs.readFile(path.join(__dirname, '../data/cali_conjuntos.json'), 'utf8');
        const barrios = JSON.parse(barriosData).neighborhoods.map(n => n.name);
        const conjuntos = JSON.parse(conjuntosData).conjuntos.map(c => c.name);

        // Usar valores actuales si no se envían nuevos
        const addressData = {
            barrio: barrio || publication.current_barrio,
            calle_carrera: calle_carrera || publication.current_calle_carrera,
            numero: numero || publication.current_numero,
            conjunto_torre: conjunto_torre || publication.current_conjunto_torre,
            apartamento: apartamento || publication.current_apartamento,
            piso: piso || publication.current_piso
        };

        // Validar campos de dirección requeridos
        if (!addressData.barrio || !addressData.calle_carrera || !addressData.numero) {
            return res.status(400).json({ success: false, message: 'Barrio, calle/carrera y número son obligatorios' });
        }

        // Validar barrio contra la lista
        if (!barrios.includes(addressData.barrio)) {
            return res.status(400).json({ success: false, message: 'Aún no has seleccionado un barrio de forma correcta' });
        }

        // Validar calle_carrera
        if (!/^Calle|Carrera\s\d+[A-Z]?$/.test(addressData.calle_carrera)) {
            return res.status(400).json({ success: false, message: 'Formato inválido para calle/carrera (ej. Calle 5, Carrera 100A)' });
        }

        // Validar número
        if (!/^[0-9]+[A-Z0-9]*-[0-9]+[A-Z]?$/.test(addressData.numero)) {
            return res.status(400).json({ success: false, message: 'Formato inválido para número (ej. 41E3-84, 45-67, 45A-12)' });
        }

        // Validar campos específicos por tipo
        if (type === 'apartamento') {
            if (!addressData.conjunto_torre || !addressData.apartamento || !addressData.piso) {
                return res.status(400).json({ success: false, message: 'Conjunto/torre, apartamento y piso son obligatorios para apartamentos' });
            }
            if (!conjuntos.includes(addressData.conjunto_torre)) {
                return res.status(400).json({ success: false, message: 'Aún no has seleccionado un conjunto de forma correcta' });
            }
            if (addressData.conjunto_torre.length > 100) {
                return res.status(400).json({ success: false, message: 'El conjunto/torre no debe exceder 100 caracteres' });
            }
            if (addressData.apartamento.length > 20) {
                return res.status(400).json({ success: false, message: 'El número de apartamento no debe exceder 20 caracteres' });
            }
            const parsedPiso = parseInt(addressData.piso);
            if (isNaN(parsedPiso) || parsedPiso <= 0) {
                return res.status(400).json({ success: false, message: 'El piso debe ser un número positivo' });
            }
        } else if (type === 'casa') {
            // No se requieren campos adicionales para casa
        } else if (type === 'habitacion') {
            if (en_edificio === 'true') {
                if (!addressData.conjunto_torre || !addressData.piso) {
                    return res.status(400).json({ success: false, message: 'Conjunto/torre y piso son obligatorios si la habitación está en un edificio' });
                }
                if (!conjuntos.includes(addressData.conjunto_torre)) {
                    return res.status(400).json({ success: false, message: 'Aún no has seleccionado un conjunto de forma correcta' });
                }
                if (addressData.conjunto_torre.length > 100) {
                    return res.status(400).json({ success: false, message: 'El conjunto/torre no debe exceder 100 caracteres' });
                }
                const parsedPiso = parseInt(addressData.piso);
                if (isNaN(parsedPiso) || parsedPiso <= 0) {
                    return res.status(400).json({ success: false, message: 'El piso debe ser un número positivo' });
                }
            }
        } else if (type === 'parqueo' || type === 'bodega') {
            if (addressData.conjunto_torre && !conjuntos.includes(addressData.conjunto_torre)) {
                return res.status(400).json({ success: false, message: 'Aún no has seleccionado un conjunto de forma correcta' });
            }
            if (addressData.conjunto_torre && addressData.conjunto_torre.length > 100) {
                return res.status(400).json({ success: false, message: 'El conjunto/edificio no debe exceder 100 caracteres' });
            }
        }

        // Verificar unicidad de la dirección antes de actualizar
        const [existingRows] = await pool.query(
            `SELECT COUNT(*) as count FROM publication_addresses 
             WHERE barrio = ? AND calle_carrera = ? AND numero = ? 
             AND (conjunto_torre = ? OR conjunto_torre IS NULL) 
             AND (apartamento = ? OR apartamento IS NULL) 
             AND (piso = ? OR piso IS NULL)
             AND publication_id != ?`,
            [addressData.barrio, addressData.calle_carrera, addressData.numero, addressData.conjunto_torre || null, addressData.apartamento || null, addressData.piso || null, publicationId]
        );

        if (existingRows[0].count > 0) {
            return res.status(400).json({ success: false, message: 'Esta dirección ya está registrada para otra publicación. Por favor, elige otra ubicación.' });
        }

        // Determinar el nuevo estado
        let newStatus = publication.status;
        if (publication.status === 'rejected') {
            newStatus = 'pending';
        }

        // Iniciar transacción
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Actualizar la publicación
            await connection.query(
                `UPDATE publications
                 SET title = ?, description = ?, price = ?, availability = ?, conditions = ?, status = ?, updated_at = NOW()
                 WHERE id = ?`,
                [title, description, parsedPrice, availability, conditions || null, newStatus, publicationId]
            );

            // Actualizar la dirección en publication_addresses
            await connection.query(
                `UPDATE publication_addresses
                 SET barrio = ?, calle_carrera = ?, numero = ?, conjunto_torre = ?, apartamento = ?, piso = ?, updated_at = NOW()
                 WHERE publication_id = ?`,
                [
                    addressData.barrio,
                    addressData.calle_carrera,
                    addressData.numero,
                    addressData.conjunto_torre,
                    addressData.apartamento,
                    addressData.piso,
                    publicationId
                ]
            );

            // Manejar imágenes eliminadas
            const removedImagesArray = removedImages ? (Array.isArray(removedImages) ? removedImages : [removedImages]) : [];
            for (let url of removedImagesArray) {
                await connection.query(
                    `DELETE FROM publication_images
                     WHERE publication_id = ? AND image_url = ?`,
                    [publicationId, url]
                );
                // Eliminar de Cloudinary
                const publicId = url.split('/').slice(-1)[0].split('.')[0];
                await cloudinary.uploader.destroy(`arrendafacil/publications/${publicId}`);
            }

            // Manejar nuevas imágenes
            const files = req.files || [];
            const existingImagesArray = existingImages ? (Array.isArray(existingImages) ? existingImages : [existingImages]) : [];
            const totalImages = existingImagesArray.length + files.length;
            const maxImages = 10;
            if (totalImages > maxImages) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: `Solo puedes tener un máximo de ${maxImages} imágenes` });
            }

            for (let file of files) {
                // Comprimir la imagen con sharp
                const compressedImage = await sharp(file.buffer)
                    .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 60 })
                    .toBuffer();

                // Convertir la imagen comprimida a base64
                const base64Image = `data:${file.mimetype};base64,${compressedImage.toString('base64')}`;

                // Subir la imagen comprimida a Cloudinary
                const result = await cloudinary.uploader.upload(base64Image, {
                    folder: 'arrendafacil/publications',
                    resource_type: 'image'
                });

                await connection.query(
                    `INSERT INTO publication_images (publication_id, image_url, created_at)
                     VALUES (?, ?, NOW())`,
                    [publicationId, result.secure_url]
                );
            }

            // Si la publicación estaba rechazada, enviar notificación y correo
            if (publication.status === 'rejected') {
                await connection.query(
                    `INSERT INTO notifications (user_email, type, message, action_url, \`read\`, created_at)
                     VALUES (?, 'publication_status', ?, ?, 0, NOW())`,
                    [userEmail, `Tu publicación "${title}" está en revisión.`, `/publications/${publicationId}`]
                );

                setTimeout(async () => {
                    try {
                        await sendPublicationReviewEmail(userEmail, title);
                    } catch (error) {
                        console.error('Error enviando correo de revisión:', error);
                    }
                }, 15000);
            }

            // Confirmar transacción
            await connection.commit();

            res.status(200).json({ success: true, message: 'Publicación actualizada exitosamente' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error actualizando publicación:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar la publicación' });
    }
});

// Ruta para eliminar una publicación (para el arrendador)
router.delete('/:id', isAuthenticated, async (req, res) => {
    let connection;
    try {
        const arrendadorEmail = req.headers['x-user-email'] || req.body.email;
        const publicationId = req.params.id;
        const { reason, deletionDetails, reportId } = req.body;

        // Validar que se proporcionen motivo y detalles
        if (!reason || !deletionDetails) {
            return res.status(400).json({
                success: false,
                message: 'Motivo y detalles de la eliminación son requeridos'
            });
        }

        // Iniciar transacción para asegurar consistencia
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Verificar que la publicación pertenece al arrendador
        const [publication] = await connection.query(
            `
            SELECT 
                p.title,
                p.landlord_email AS owner_email
            FROM publications p
            WHERE p.id = ? AND p.landlord_email = ?
            `,
            [publicationId, arrendadorEmail]
        );

        if (!publication.length) {
            await connection.rollback();
            return res.status(404).json({ 
                success: false, 
                message: 'Publicación no encontrada o no tienes permiso para eliminarla' 
            });
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
        console.log(`Reportes encontrados para publication_id ${publicationId}:`, reports);

        // Validar reportId si se proporciona (opcional, para compatibilidad hacia atrás)
        if (reportId) {
            const acceptedReport = reports.find(report => report.id === parseInt(reportId));
            if (!acceptedReport) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'El ID del reporte proporcionado no es válido'
                });
            }
            console.log(`Reporte especificado (reportId ${reportId}):`, acceptedReport);
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

        // Eliminar todos los reportes asociados a la publicación (para evitar error de FK)
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
            WHERE id = ? AND landlord_email = ?
            `,
            [publicationId, arrendadorEmail]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ 
                success: false, 
                message: 'Publicación no encontrada o no tienes permiso para eliminarla' 
            });
        }

        // Crear notificación para el arrendador
        await connection.query(
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

        // Crear notificaciones para todos los arrendatarios que reportaron
        if (reports.length > 0) {
            for (const report of reports) {
                try {
                    const notificationMessage = `Tu reporte #${report.case_number} fue procesado y la publicación "${title}" ha sido eliminada.`;
                    const [notificationResult] = await connection.query(
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
                    console.log(`Notificación creada para tenant_email ${report.tenant_email}:`, {
                        notificationId: notificationResult.insertId,
                        message: notificationMessage
                    });
                } catch (notificationError) {
                    console.error(`Error al crear notificación para tenant_email ${report.tenant_email}:`, notificationError);
                    // Continuamos para no interrumpir la eliminación
                }
            }
        } else {
            console.log(`No hay reportes asociados a la publicación ${publicationId}, no se crearon notificaciones para arrendatarios.`);
        }

        // Confirmar transacción
        await connection.commit();

        // Enviar correo de notificación al arrendador
        const { sendPublicationDeletedByArrendadorEmail } = require('../utils/email');
        await sendPublicationDeletedByArrendadorEmail(owner_email, title, reason, deletionDetails);

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

module.exports = router;