const cron = require('node-cron');
const db = require('../config/db');
const fs = require('fs').promises; // Usamos fs.promises para trabajar con archivos de forma asíncrona
const path = require('path');
const { 
    sendContractExpiredEmailLandlord, 
    sendContractExpiredEmailTenant, 
    sendContractExpiringEmailTenant, 
    sendRatingAvailableEmailTenant, 
    sendRatingAvailableEmailLandlord 
} = require('../utils/email');

// Ruta del archivo JSON
const notificationsFilePath = path.join(__dirname, '../data/notifications.json');

// Función para leer el archivo JSON
async function readNotifications() {
    try {
        const data = await fs.readFile(notificationsFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Si el archivo no existe, lo creamos con un arreglo vacío
            await fs.writeFile(notificationsFilePath, JSON.stringify([]));
            return [];
        }
        console.error('Error al leer notifications.json:', error);
        return [];
    }
}

// Función para escribir en el archivo JSON
async function writeNotifications(notifications) {
    try {
        await fs.writeFile(notificationsFilePath, JSON.stringify(notifications, null, 2));
    } catch (error) {
        console.error('Error al escribir en notifications.json:', error);
    }
}

// Función para verificar si ya se envió una notificación
async function hasNotificationBeenSent(agreementId, type, userEmail) {
    const notifications = await readNotifications();
    return notifications.some(
        notification =>
            notification.agreement_id === agreementId &&
            notification.type === type &&
            notification.user_email === userEmail
    );
}

// Función para registrar una notificación enviada
async function logNotification(agreementId, type, userEmail) {
    const notifications = await readNotifications();
    notifications.push({
        agreement_id: agreementId,
        type,
        user_email: userEmail,
        created_at: new Date().toISOString()
    });
    await writeNotifications(notifications);
}

// Función para notificar 1 día antes de la expiración
async function notifyBeforeExpiration() {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const [agreements] = await connection.query(`
            SELECT a.*, p.title AS publication_title
            FROM agreements a
            JOIN publications p ON a.publication_id = p.id
            WHERE a.status = 'active' AND DATE(a.end_date) = ?
        `, [tomorrowStr]);

        if (agreements.length === 0) {
            console.log('No hay acuerdos que expiren mañana.');
            return;
        }

        for (const agreement of agreements) {
            const endDateStr = new Date(agreement.end_date).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' });

            // Verificar si ya se envió la notificación
            const alreadyNotified = await hasNotificationBeenSent(agreement.id, 'agreement_expiring', agreement.tenant_email);
            if (alreadyNotified) {
                console.log(`Notificación ya enviada para el acuerdo ${agreement.contract_id} (expirando).`);
                continue;
            }

            // Notificación al arrendatario
            await connection.query(`
                INSERT INTO notifications (user_email, type, message, created_at)
                VALUES (?, 'agreement_expiring', ?, NOW())
            `, [agreement.tenant_email, `Ey, tu acuerdo ${agreement.contract_id} con la publicación "${agreement.publication_title}" está por expirar mañana (${endDateStr}). Habla con el arrendador para ampliar el plazo o darlo por terminado.`]);

            // Enviar correo al arrendatario
            await sendContractExpiringEmailTenant(
                agreement.tenant_email,
                agreement.contract_id,
                agreement.publication_title,
                endDateStr
            );

            // Registrar la notificación en el archivo JSON
            await logNotification(agreement.id, 'agreement_expiring', agreement.tenant_email);
        }

        await connection.commit();
        console.log(`Notificaciones enviadas para ${agreements.length} acuerdos que expiran mañana.`);
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error en notificación de expiración:', error);
    } finally {
        if (connection) connection.release();
    }
}

// Función para manejar la expiración de acuerdos
async function expireAgreements() {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        const [activeAgreements] = await connection.query(`
            SELECT a.*, p.title AS publication_title
            FROM agreements a
            JOIN publications p ON a.publication_id = p.id
            WHERE a.status = 'active' AND DATE(a.end_date) <= ?
        `, [todayStr]);

        if (activeAgreements.length === 0) {
            console.log('No hay acuerdos para expirar en este momento.');
            return;
        }

        for (const agreement of activeAgreements) {
            const endDateStr = new Date(agreement.end_date).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' });

            await connection.query('UPDATE agreements SET status = ? WHERE id = ?', ['expired', agreement.id]);
            await connection.query('UPDATE publications SET rental_status = ? WHERE id = ?', ['disponible', agreement.publication_id]);
            await connection.query('INSERT INTO agreement_history (agreement_id, action) VALUES (?, ?)', [agreement.id, 'expired']);

            // Notificación de expiración para el arrendador
            let alreadyNotified = await hasNotificationBeenSent(agreement.id, 'agreement_expired', agreement.landlord_email);
            if (!alreadyNotified) {
                await connection.query('INSERT INTO notifications (user_email, type, message, created_at) VALUES (?, ?, ?, NOW())', [agreement.landlord_email, 'agreement_expired', `El contrato ${agreement.contract_id} ha expirado el ${endDateStr}. Revisa los detalles en tu cuenta.`]);
                await logNotification(agreement.id, 'agreement_expired', agreement.landlord_email);
            }

            // Notificación de expiración para el arrendatario
            alreadyNotified = await hasNotificationBeenSent(agreement.id, 'agreement_expired', agreement.tenant_email);
            if (!alreadyNotified) {
                await connection.query('INSERT INTO notifications (user_email, type, message, created_at) VALUES (?, ?, ?, NOW())', [agreement.tenant_email, 'agreement_expired', `El contrato ${agreement.contract_id} ha expirado el ${endDateStr}. Revisa los detalles en tu cuenta.`]);
                await logNotification(agreement.id, 'agreement_expired', agreement.tenant_email);
            }

            // Notificaciones para calificación
            alreadyNotified = await hasNotificationBeenSent(agreement.id, 'rating_available', agreement.tenant_email);
            if (!alreadyNotified) {
                await connection.query('INSERT INTO notifications (user_email, type, message, created_at) VALUES (?, ?, ?, NOW())', [agreement.tenant_email, 'rating_available', `Ya puedes calificar al arrendador del contrato ${agreement.contract_id} con la publicación "${agreement.publication_title}".`]);
                await logNotification(agreement.id, 'rating_available', agreement.tenant_email);
            }

            alreadyNotified = await hasNotificationBeenSent(agreement.id, 'rating_available', agreement.landlord_email);
            if (!alreadyNotified) {
                await connection.query('INSERT INTO notifications (user_email, type, message, created_at) VALUES (?, ?, ?, NOW())', [agreement.landlord_email, 'rating_available', `Ya puedes calificar al arrendatario del contrato ${agreement.contract_id} con la publicación "${agreement.publication_title}".`]);
                await logNotification(agreement.id, 'rating_available', agreement.landlord_email);
            }

            // Enviar correos
            try {
                if (!await hasNotificationBeenSent(agreement.id, 'agreement_expired', agreement.landlord_email)) {
                    await sendContractExpiredEmailLandlord(
                        agreement.landlord_email,
                        agreement.publication_title,
                        agreement.contract_id,
                        endDateStr
                    );
                }
                if (!await hasNotificationBeenSent(agreement.id, 'agreement_expired', agreement.tenant_email)) {
                    await sendContractExpiredEmailTenant(
                        agreement.tenant_email,
                        agreement.publication_title,
                        agreement.contract_id,
                        endDateStr
                    );
                }
                if (!await hasNotificationBeenSent(agreement.id, 'rating_available', agreement.tenant_email)) {
                    await sendRatingAvailableEmailTenant(
                        agreement.tenant_email,
                        agreement.contract_id,
                        agreement.publication_title
                    );
                }
                if (!await hasNotificationBeenSent(agreement.id, 'rating_available', agreement.landlord_email)) {
                    await sendRatingAvailableEmailLandlord(
                        agreement.landlord_email,
                        agreement.contract_id,
                        agreement.publication_title
                    );
                }
                console.log(`Correos enviados para el acuerdo ${agreement.contract_id}`);
            } catch (emailError) {
                console.error(`Error al enviar correos para el acuerdo ${agreement.contract_id}:`, emailError);
            }
        }

        await connection.commit();
        console.log(`Tarea de expiración ejecutada a las ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}. ${activeAgreements.length} acuerdos expirados.`);
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error en la tarea de expiración:', error);
    } finally {
        if (connection) connection.release();
    }
}

// Programar las tareas
cron.schedule('0 * * * *', async () => {
    console.log('Iniciando tarea de expiración de acuerdos...');
    await expireAgreements();
}, { timezone: 'America/Bogota' });

cron.schedule('0 8 * * *', async () => {
    console.log('Iniciando tarea de notificación de contratos por expirar...');
    await notifyBeforeExpiration();
}, { timezone: 'America/Bogota' });

// Ejecutar las tareas al iniciar el servidor
expireAgreements().then(() => {
    console.log('Tarea de expiración inicial completada al iniciar el servidor.');
});
notifyBeforeExpiration().then(() => {
    console.log('Tarea de notificación inicial completada al iniciar el servidor.');
});

// Asegurar que las tareas sigan ejecutándose incluso si hay errores no capturados
process.on('uncaughtException', (error) => {
    console.error('Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Rechazo no manejado en:', promise, 'razón:', reason);
});

module.exports = { expireAgreements, notifyBeforeExpiration };