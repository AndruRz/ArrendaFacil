const db = require('../config/db');
const fs = require('fs').promises;
const path = require('path');
const { 
    sendContractExpiredEmailLandlord, 
    sendContractExpiredEmailTenant, 
    sendContractExpiringEmailTenant, 
    sendRatingAvailableEmailTenant, 
    sendRatingAvailableEmailLandlord 
} = require('../utils/email');

// Configure database pool with limits
db.poolConfig = {
    max: 10,
    min: 2,
    acquireTimeout: 30000,
    idleTimeoutMillis: 30000
};

const notificationsFilePath = path.join(__dirname, '../data/notifications.json');

// Maximum retry attempts for database operations
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Lock to prevent concurrent task execution
let isTaskRunning = false;

// Helper function for retry logic
async function withRetry(operation, maxRetries = MAX_RETRIES) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === maxRetries) throw error;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        }
    }
}

async function readNotifications() {
    try {
        const data = await fs.readFile(notificationsFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(notificationsFilePath, JSON.stringify([]));
            return [];
        }
        console.error('Error reading notifications.json:', error);
        return [];
    }
}

async function writeNotifications(notifications) {
    try {
        await fs.writeFile(notificationsFilePath, JSON.stringify(notifications, null, 2));
    } catch (error) {
        console.error('Error writing to notifications.json:', error);
    }
}

async function hasNotificationBeenSent(agreementId, type, userEmail) {
    const notifications = await readNotifications();
    return notifications.some(
        notification =>
            notification.agreement_id === agreementId &&
            notification.type === type &&
            notification.user_email === userEmail
    );
}

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

async function manageAgreements() {
    if (isTaskRunning) {
        return;
    }

    isTaskRunning = true;
    let connection;
    try {
        connection = await withRetry(() => db.getConnection());
        await connection.beginTransaction();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        // Query for agreements expiring tomorrow
        const [expiringAgreements] = await withRetry(() => connection.query(`
            SELECT a.*, p.title AS publication_title
            FROM agreements a
            JOIN publications p ON a.publication_id = p.id
            WHERE a.status = 'active' AND DATE(a.end_date) = ?
        `, [tomorrowStr]));

        // Query for agreements to expire today or earlier
        const [expiredAgreements] = await withRetry(() => connection.query(`
            SELECT a.*, p.title AS publication_title
            FROM agreements a
            JOIN publications p ON a.publication_id = p.id
            WHERE a.status = 'active' AND DATE(a.end_date) <= ?
        `, [todayStr]));

        // Process expiring agreements
        for (const agreement of expiringAgreements) {
            const endDateStr = new Date(agreement.end_date).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' });

            if (await hasNotificationBeenSent(agreement.id, 'agreement_expiring', agreement.tenant_email)) {
                continue;
            }

            await withRetry(() => connection.query(`
                INSERT INTO notifications (user_email, type, message, created_at)
                VALUES (?, 'agreement_expiring', ?, NOW())
            `, [agreement.tenant_email, `Ey, tu acuerdo ${agreement.contract_id} con la publicación "${agreement.publication_title}" está por expirar mañana (${endDateStr}). Habla con el arrendador para ampliar el plazo o darlo por terminado.`]));

            try {
                const sendEmailWithTimeout = (emailFn, ...args) => {
                    return Promise.race([
                        emailFn(...args),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Email sending timeout')), 10000))
                    ]);
                };

                await sendEmailWithTimeout(
                    sendContractExpiringEmailTenant,
                    agreement.tenant_email,
                    agreement.contract_id,
                    agreement.publication_title,
                    endDateStr
                );
            } catch (emailError) {
                console.error(`Error sending expiring email for agreement ${agreement.contract_id}:`, emailError);
            }

            await logNotification(agreement.id, 'agreement_expiring', agreement.tenant_email);
        }

        // Process expired agreements
        for (const agreement of expiredAgreements) {
            const endDateStr = new Date(agreement.end_date).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' });

            await withRetry(() => connection.query('UPDATE agreements SET status = ? WHERE id = ?', ['expired', agreement.id]));
            await withRetry(() => connection.query('UPDATE publications SET rental_status = ? WHERE id = ?', ['disponible', agreement.publication_id]));
            await withRetry(() => connection.query('INSERT INTO agreement_history (agreement_id, action) VALUES (?, ?)', [agreement.id, 'expired']));

            // Landlord: Expired notification and email
            if (!await hasNotificationBeenSent(agreement.id, 'agreement_expired', agreement.landlord_email)) {
                await withRetry(() => connection.query(`
                    INSERT INTO notifications (user_email, type, message, created_at)
                    VALUES (?, 'agreement_expired', ?, NOW())
                `, [agreement.landlord_email, `El contrato ${agreement.contract_id} ha expirado el ${endDateStr}. Revisa los detalles en tu cuenta.`]));
                await logNotification(agreement.id, 'agreement_expired', agreement.landlord_email);

                try {
                    const sendEmailWithTimeout = (emailFn, ...args) => {
                        return Promise.race([
                            emailFn(...args),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Email sending timeout')), 10000))
                        ]);
                    };

                    await sendEmailWithTimeout(
                        sendContractExpiredEmailLandlord,
                        agreement.landlord_email,
                        agreement.publication_title,
                        agreement.contract_id,
                        endDateStr
                    );
                } catch (emailError) {
                    console.error(`Error sending expired email to landlord for agreement ${agreement.contract_id}:`, emailError);
                }
            }

            // Tenant: Expired notification and email
            if (!await hasNotificationBeenSent(agreement.id, 'agreement_expired', agreement.tenant_email)) {
                await withRetry(() => connection.query(`
                    INSERT INTO notifications (user_email, type, message, created_at)
                    VALUES (?, 'agreement_expired', ?, NOW())
                `, [agreement.tenant_email, `El contrato ${agreement.contract_id} ha expirado el ${endDateStr}. Revisa los detalles en tu cuenta.`]));
                await logNotification(agreement.id, 'agreement_expired', agreement.tenant_email);

                try {
                    const sendEmailWithTimeout = (emailFn, ...args) => {
                        return Promise.race([
                            emailFn(...args),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Email sending timeout')), 10000))
                        ]);
                    };

                    await sendEmailWithTimeout(
                        sendContractExpiredEmailTenant,
                        agreement.tenant_email,
                        agreement.publication_title,
                        agreement.contract_id,
                        endDateStr
                    );
                } catch (emailError) {
                    console.error(`Error sending expired email to tenant for agreement ${agreement.contract_id}:`, emailError);
                }
            }

            // Tenant: Rating available notification and email
            if (!await hasNotificationBeenSent(agreement.id, 'rating_available', agreement.tenant_email)) {
                await withRetry(() => connection.query(`
                    INSERT INTO notifications (user_email, type, message, created_at)
                    VALUES (?, 'rating_available', ?, NOW())
                `, [agreement.tenant_email, `Ya puedes calificar al arrendador del contrato ${agreement.contract_id} con la publicación "${agreement.publication_title}".`]));
                await logNotification(agreement.id, 'rating_available', agreement.tenant_email);

                try {
                    const sendEmailWithTimeout = (emailFn, ...args) => {
                        return Promise.race([
                            emailFn(...args),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Email sending timeout')), 10000))
                        ]);
                    };

                    await sendEmailWithTimeout(
                        sendRatingAvailableEmailTenant,
                        agreement.tenant_email,
                        agreement.contract_id,
                        agreement.publication_title
                    );
                } catch (emailError) {
                    console.error(`Error sending rating email to tenant for agreement ${agreement.contract_id}:`, emailError);
                }
            }

            // Landlord: Rating available notification and email
            if (!await hasNotificationBeenSent(agreement.id, 'rating_available', agreement.landlord_email)) {
                await withRetry(() => connection.query(`
                    INSERT INTO notifications (user_email, type, message, created_at)
                    VALUES (?, 'rating_available', ?, NOW())
                `, [agreement.landlord_email, `Ya puedes calificar al arrendatario del contrato ${agreement.contract_id} con la publicación "${agreement.publication_title}".`]));
                await logNotification(agreement.id, 'rating_available', agreement.landlord_email);

                try {
                    const sendEmailWithTimeout = (emailFn, ...args) => {
                        return Promise.race([
                            emailFn(...args),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Email sending timeout')), 10000))
                        ]);
                    };

                    await sendEmailWithTimeout(
                        sendRatingAvailableEmailLandlord,
                        agreement.landlord_email,
                        agreement.contract_id,
                        agreement.publication_title
                    );
                } catch (emailError) {
                    console.error(`Error sending rating email to landlord for agreement ${agreement.contract_id}:`, emailError);
                }
            }
        }

        await withRetry(() => connection.commit());
        console.log(`Analizado contratos, ${expiringAgreements.length} notificados, ${expiredAgreements.length} expirados. Próxima revisión en 12 horas.`);
    } catch (error) {
        console.error('Error in agreement management task:', error);
        if (connection) await withRetry(() => connection.rollback());
    } finally {
        if (connection) {
            connection.release();
            connection.destroy();
        }
        isTaskRunning = false;
    }
}

// Start agreement management on server startup and every 12 hours
function startAgreementManagement() {
    // Run once 5 seconds after server startup
    setTimeout(async () => {
        await manageAgreements();
    }, 5000);

    // Run every 12 hours (43,200,000 milliseconds)
    setInterval(async () => {
        await manageAgreements();
    }, 12 * 60 * 60 * 1000);
}

module.exports = { manageAgreements, startAgreementManagement };
