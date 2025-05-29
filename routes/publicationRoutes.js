const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Ruta pública para obtener publicaciones disponibles con filtros
router.get('/public/available', async (req, res) => {
    try {
        const { title, type, minPrice, maxPrice, availability, status } = req.query;

        let query = `
            SELECT p.id, p.title, p.space_type, p.price, p.availability, p.description,
                   pi.image_url
            FROM publications p
            LEFT JOIN publication_images pi ON p.id = pi.publication_id
            WHERE p.status = ?
        `;
        const queryParams = [status || 'available'];

        if (title) {
            query += ' AND p.title LIKE ?';
            queryParams.push(`%${title}%`);
        }
        if (type) {
            query += ' AND p.space_type = ?';
            queryParams.push(type);
        }
        if (minPrice) {
            query += ' AND p.price >= ?';
            queryParams.push(Number(minPrice));
        }
        if (maxPrice) {
            query += ' AND p.price <= ?';
            queryParams.push(Number(maxPrice));
        }
        if (availability) {
            query += ' AND p.availability = ?';
            queryParams.push(availability);
        }

        const [rows] = await pool.query(query, queryParams);

        // Agrupar imágenes por publicación
        const publications = {};
        rows.forEach(row => {
            if (!publications[row.id]) {
                publications[row.id] = {
                    id: row.id,
                    title: row.title,
                    space_type: row.space_type,
                    price: row.price,
                    availability: row.availability,
                    description: row.description,
                    images: []
                };
            }
            if (row.image_url) {
                publications[row.id].images.push(row.image_url);
            }
        });

        const result = Object.values(publications);

        res.json({ success: true, publications: result });
    } catch (error) {
        console.error('Error fetching public publications:', error);
        res.status(500).json({ success: false, message: 'Error al obtener publicaciones' });
    }
});

// Ruta pública para obtener los detalles de una publicación por ID
router.get('/public/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT p.id, p.title, p.space_type, p.price, p.availability, p.description,
                   p.conditions, p.created_at, p.rental_status,
                   pi.image_url, u.full_name, u.profile_picture, u.created_at AS user_created_at,
                   pa.barrio, pa.calle_carrera, pa.numero, pa.conjunto_torre, pa.apartamento, pa.piso
            FROM publications p
            LEFT JOIN publication_images pi ON p.id = pi.publication_id
            LEFT JOIN users u ON p.landlord_email = u.email
            LEFT JOIN publication_addresses pa ON p.id = pa.publication_id
            WHERE p.id = ? AND p.status = 'available'
        `;
        const [rows] = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Publicación no encontrada o no disponible' });
        }

        // Construir objeto de publicación
        const publication = {
            id: rows[0].id,
            title: rows[0].title,
            space_type: rows[0].space_type,
            price: rows[0].price,
            availability: rows[0].availability,
            description: rows[0].description,
            conditions: rows[0].conditions,
            created_at: rows[0].created_at,
            rental_status: rows[0].rental_status,
            full_name: rows[0].full_name,
            profile_picture: rows[0].profile_picture,
            user_created_at: rows[0].user_created_at,
            address: {
                barrio: rows[0].barrio,
                calle_carrera: rows[0].calle_carrera,
                numero: rows[0].numero,
                conjunto_torre: rows[0].conjunto_torre,
                apartamento: rows[0].apartamento,
                piso: rows[0].piso
            },
            images: []
        };

        // Agregar imágenes
        rows.forEach(row => {
            if (row.image_url && !publication.images.includes(row.image_url)) {
                publication.images.push(row.image_url);
            }
        });

        res.json({ success: true, publication });
    } catch (error) {
        console.error('Error fetching publication details:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los detalles de la publicación' });
    }
});

module.exports = router;