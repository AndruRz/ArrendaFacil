const express = require('express');
const router = express.Router();
const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { sendAgreementCreatedEmail, sendAgreementPendingEmail, sendContractUploadedEmail, sendContractUploadedNotificationEmail, sendContractAcceptedEmail, sendContractRejectedEmail, sendContractUpdatedEmailTenant, sendContractUpdatedEmailLandlord, sendContractCancelledEmailLandlord, sendContractCancelledEmailTenant} = require('../utils/email');
const multer = require('multer');

router.use((req, res, next) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }
    req.userEmail = userEmail;
    next();
});

// Configuración de multer para guardar el archivo
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const signedContractsDir = path.join(__dirname, '../public/signed_contracts');
        // Verificamos si la carpeta existe
        fs.access(signedContractsDir, (error) => {
            if (error) {
                // Si no existe, la creamos
                fs.mkdir(signedContractsDir, { recursive: true }, (mkdirError) => {
                    if (mkdirError) {
                        return cb(mkdirError); // Pasamos el error a multer
                    }
                    cb(null, signedContractsDir); // Carpeta creada, la usamos
                });
            } else {
                cb(null, signedContractsDir); // Carpeta ya existe, la usamos
            }
        });
    },
    filename: function (req, file, cb) {
        const contractId = req.body.contract_id || req.params.id;
        cb(null, `signed_${contractId}.pdf`);
    }
});

// Filtro para aceptar solo PDFs
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Debe subir un archivo PDF válido'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB para el archivo
});

// Generar un ID de contrato único
function generateContractId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'CON';
    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// Guardar contract_id en acuerdos_data.json
function saveContractId(contractId) {
    const filePath = path.join(__dirname, '../data/acuerdos_data.json');
    let agreements = [];
    try {
        if (fs.existsSync(filePath)) {
            agreements = JSON.parse(fs.readFileSync(filePath));
        }
        agreements.push({ contract_id: contractId, created_at: new Date().toISOString() });
        fs.writeFileSync(filePath, JSON.stringify(agreements, null, 2));
    } catch (error) {
        console.error('Error al guardar contract_id:', error);
    }
}

// Generar PDF del contrato (guardar en archivo)
function generateContractPDF(data, outputPath) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ 
            margin: 25,
            bufferPages: true,
            size: 'A4',
            info: {
                Title: 'Contrato de Arrendamiento',
                Author: 'ArrendeFuel',
                Subject: 'Contrato de Arrendamiento'
            }
        });
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Registrar fuentes
        doc.registerFont('Helvetica-Bold', 'Helvetica-Bold');
        doc.registerFont('Helvetica', 'Helvetica');
        doc.registerFont('Times-Roman', 'Times-Roman');
        
        const colors = {
            primary: '#2b6b6b',
            secondary: '#4c9f9f',
            background: '#f0f4f8',
            text: '#333333',
            highlight: '#dc2626',
            border: '#d1d9e6',
            sectionFill: '#ffffff',
            signatureBg: '#d1e7dd',
            noteBg: '#f8d7da'
        };

        // ===== ENCABEZADO (PRIMERA PÁGINA) =====
        doc.rect(0, 0, doc.page.width, 50).fill(colors.primary);
        doc.circle(40, 25, 12).fill('#ffffff');
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('AF', 36, 21);
        doc.fillColor('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(18)
            .text('Contrato de Arrendamiento', { align: 'center', y: 15 });
        doc.fontSize(8)
            .fillColor('#ffffff');
        doc.lineWidth(2)
            .strokeColor(colors.secondary)
            .moveTo(25, 55)
            .lineTo(doc.page.width - 25, 55)
            .stroke();
        doc.y = 60;

        // ===== DATOS DEL CONTRATO =====
        const sectionWidth = doc.page.width - 50;
        doc.rect(25, doc.y, sectionWidth, 140).fill(colors.sectionFill).stroke(colors.border); // Aumenté a 140px para incluir contract_id
        doc.y += 10;
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('DATOS DEL CONTRATO', 35, doc.y);
        doc.y += 20;

        const colWidth = sectionWidth / 2 - 10;
        let y = doc.y;

        function writeCell(label, value) {
            doc.fillColor(colors.text)
                .font('Helvetica')
                .fontSize(10)
                .text(label, 35, y, { width: colWidth, align: 'left' });
            if (label === 'Propiedad:' && value && value.length > 50) {
                doc.fontSize(8)
                    .text(value, 35 + colWidth + 10, y, { width: colWidth, align: 'left', lineGap: 2, maxLines: 3 });
            } else {
                doc.fontSize(10)
                    .text(value || 'No especificado', 35 + colWidth + 10, y, { width: colWidth, align: 'left' });
            }
            y += label === 'Propiedad:' && value && value.length > 50 ? 24 : 18;
        }

        writeCell('Arrendador:', data.landlord_name);
        writeCell('Correo del Arrendador:', data.landlord_email);
        writeCell('Arrendatario:', data.tenant_name);
        writeCell('Correo del Arrendatario:', data.tenant_email);
        writeCell('Propiedad:', `"${data.publication_title}"`);
        writeCell('Fecha de inicio:', new Date(data.start_date).toLocaleDateString('es-CO', { timeZone: 'UTC' }));
        writeCell('Fecha de finalización:', new Date(data.end_date).toLocaleDateString('es-CO', { timeZone: 'UTC' }));

        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(11)
            .text('Precio mensual:', 35, y, { width: colWidth, align: 'left' });
        doc.text(Number(data.price).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }), 35 + colWidth + 10, y, { width: colWidth, align: 'left' });
        y += 18;

        writeCell('Duración del contrato:', `${data.duration_months} meses`);
        writeCell('ID del Contrato:', data.contract_id || 'CON' + Math.random().toString(36).substr(2, 6).toUpperCase()); // Genera un ID si no está presente
        doc.y = y + 10;

        // ===== CLÁUSULA PRINCIPAL =====
        doc.rect(25, doc.y, sectionWidth, 60).fill(colors.sectionFill).stroke(colors.border);
        doc.y += 10;
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('CLÁUSULA PRINCIPAL', 35, doc.y);
        doc.y += 20;
        doc.fillColor(colors.text)
            .font('Times-Roman')
            .fontSize(10)
            .text(`Yo, ${data.landlord_name}, autorizo a ${data.tenant_name} a arrendar "${data.publication_title}" por ${Number(data.price).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })} mensual, desde ${new Date(data.start_date).toLocaleDateString('es-CO', { timeZone: 'UTC' })} hasta ${new Date(data.end_date).toLocaleDateString('es-CO', { timeZone: 'UTC' })} por ${data.duration_months} meses.`, {
                align: 'left',
                indent: 10,
                width: sectionWidth - 20,
                lineGap: 2
            });
        doc.y += 20;

        // ===== CONDICIONES GENERALES =====
        doc.rect(25, doc.y, sectionWidth, 80).fill(colors.sectionFill).stroke(colors.border);
        doc.y += 10;
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('CONDICIONES GENERALES', 35, doc.y);
        doc.y += 20;

        function addCondition(number, text) {
            doc.circle(40, doc.y + 5, 6).fill(colors.secondary);
            doc.fillColor('#ffffff')
                .font('Helvetica-Bold')
                .fontSize(8)
                .text(number, 37, doc.y + 2);
            doc.fillColor(colors.text)
                .font('Times-Roman')
                .fontSize(9)
                .text(text, 55, doc.y, { width: sectionWidth - 65, align: 'justify', lineGap: 2 });
            doc.y += 20;
        }

        addCondition('1', 'Notificar daños en la propiedad dentro de 7 días.');
        addCondition('2', 'Servicios públicos a cargo del arrendatario, salvo acuerdo contrario.');
        addCondition('3', 'Subarrendar requiere consentimiento escrito del arrendador; sigue políticas de ArrendeFuel.');

        // Notas adicionales
        if (data.additional_notes && data.additional_notes.trim() !== '') {
            doc.y += 10;
            doc.rect(25, doc.y, sectionWidth, 50).fill(colors.sectionFill).stroke(colors.border);
            doc.y += 10;
            doc.fillColor(colors.primary)
                .font('Helvetica-Bold')
                .fontSize(12)
                .text('NOTAS ADICIONALES', 35, doc.y);
            doc.y += 20;
            doc.fillColor(colors.text)
                .font('Times-Roman')
                .fontSize(9)
                .text(data.additional_notes, {
                    align: 'justify',
                    indent: 10,
                    width: sectionWidth - 20,
                    lineGap: 2
                });
            doc.y += 20;
        }

        // ===== SEGUNDA PÁGINA (FIRMAS) =====
        doc.addPage();

        // Encabezado segunda página
        doc.rect(0, 0, doc.page.width, 50).fill(colors.primary);
        doc.fillColor('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(18)
            .text('Contrato de Arrendamiento', { align: 'center', y: 15 });
        doc.fontSize(8)
            .fillColor('#ffffff');
        doc.lineWidth(2)
            .strokeColor(colors.secondary)
            .moveTo(25, 55)
            .lineTo(doc.page.width - 25, 55)
            .stroke();
        doc.y = 80;

        // Texto de cierre modificado (solo arrendatario firma)
        doc.fillColor(colors.text)
            .font('Times-Roman')
            .fontSize(10)
            .text('En testimonio de lo cual, el arrendatario firma el presente contrato en señal de conformidad con', {
                align: 'center',
                width: sectionWidth
            });
        
        doc.y += 15;
        
        doc.fillColor(colors.text)
            .font('Times-Roman')
            .fontSize(10)
            .text('todos los términos y condiciones establecidos, en el lugar y fecha indicados.', {
                align: 'center',
                width: sectionWidth
            });
        
        doc.y += 25;
        
        doc.fillColor(colors.text)
            .font('Times-Roman')
            .fontSize(10)
            .text('El arrendatario reconoce haber recibido en perfecto estado la propiedad objeto de este contrato', {
                align: 'center',
                width: sectionWidth
            });
        
        doc.y += 15;
        
        doc.fillColor(colors.text)
            .font('Times-Roman')
            .fontSize(10)
            .text('y se compromete a devolverla en las mismas condiciones, salvo el deterioro normal por el uso.', {
                align: 'center',
                width: sectionWidth
            });
        
        doc.y += 40;

        // ===== SECCIÓN DE FIRMA =====
        doc.rect(25, doc.y, sectionWidth, 120).fill(colors.sectionFill).stroke(colors.border);
        doc.y += 30;
        
        // Firma Arrendatario
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('FIRMA DEL ARRENDATARIO', { align: 'center' });
        doc.y += 10;
        
        doc.fillColor(colors.text)
            .font('Helvetica')
            .fontSize(10)
            .text(data.tenant_name, { align: 'center' });
        doc.y += 30;
        
        // Línea de firma
        doc.moveTo(100, doc.y)
           .lineTo(doc.page.width - 100, doc.y)
           .stroke(colors.primary);
        doc.y += 40;

        // Fecha
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('FECHA', { align: 'center' });
        doc.y += 20;
        
        // Línea de fecha
        doc.moveTo(150, doc.y)
           .lineTo(doc.page.width - 150, doc.y)
           .stroke(colors.primary);

        // ===== NOTA ACLARATORIA =====
        doc.y += 40;
        doc.rect(25, doc.y, sectionWidth, 40).fill(colors.noteBg).stroke(colors.highlight);
        doc.y += 15;
        doc.fillColor(colors.highlight)
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('IMPORTANTE: Esto no es un contrato legal ni válido, solo es un trabajo universitario.', {
                align: 'center',
                width: sectionWidth - 20
            });

        doc.end();
        stream.on('finish', () => resolve(outputPath));
        stream.on('error', (error) => reject(error));
    });
}

// Generar PDF en memoria para previsualización
function generateContractPDFBuffer(data) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ 
            margin: 25,
            bufferPages: true,
            size: 'A4',
            info: {
                Title: 'Contrato de Arrendamiento',
                Author: 'ArrendeFuel',
                Subject: 'Contrato de Arrendamiento'
            }
        });
        
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Registrar fuentes
        doc.registerFont('Helvetica-Bold', 'Helvetica-Bold');
        doc.registerFont('Helvetica', 'Helvetica');
        doc.registerFont('Times-Roman', 'Times-Roman');
        
        const colors = {
            primary: '#2b6b6b',
            secondary: '#4c9f9f',
            background: '#f0f4f8',
            text: '#333333',
            highlight: '#dc2626',
            border: '#d1d9e6',
            sectionFill: '#ffffff',
            signatureBg: '#d1e7dd',
            noteBg: '#f8d7da'
        };

        // ===== ENCABEZADO (PRIMERA PÁGINA) =====
        doc.rect(0, 0, doc.page.width, 50).fill(colors.primary);
        doc.circle(40, 25, 12).fill('#ffffff');
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('AF', 36, 21);
        doc.fillColor('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(18)
            .text('Contrato de Arrendamiento', { align: 'center', y: 15 });
        doc.fontSize(8)
            .fillColor('#ffffff');
        doc.lineWidth(2)
            .strokeColor(colors.secondary)
            .moveTo(25, 55)
            .lineTo(doc.page.width - 25, 55)
            .stroke();
        doc.y = 60;

        // ===== DATOS DEL CONTRATO =====
        const sectionWidth = doc.page.width - 50;
        doc.rect(25, doc.y, sectionWidth, 140).fill(colors.sectionFill).stroke(colors.border); // Aumenté a 140px para incluir contract_id
        doc.y += 10;
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('DATOS DEL CONTRATO', 35, doc.y);
        doc.y += 20;

        const colWidth = sectionWidth / 2 - 10;
        let y = doc.y;

        function writeCell(label, value) {
            doc.fillColor(colors.text)
                .font('Helvetica')
                .fontSize(10)
                .text(label, 35, y, { width: colWidth, align: 'left' });
            if (label === 'Propiedad:' && value && value.length > 50) {
                doc.fontSize(8)
                    .text(value, 35 + colWidth + 10, y, { width: colWidth, align: 'left', lineGap: 2, maxLines: 3 });
            } else {
                doc.fontSize(10)
                    .text(value || 'No especificado', 35 + colWidth + 10, y, { width: colWidth, align: 'left' });
            }
            y += label === 'Propiedad:' && value && value.length > 50 ? 24 : 18;
        }

        writeCell('Arrendador:', data.landlord_name);
        writeCell('Correo del Arrendador:', data.landlord_email);
        writeCell('Arrendatario:', data.tenant_name);
        writeCell('Correo del Arrendatario:', data.tenant_email);
        writeCell('Propiedad:', `"${data.publication_title}"`);
        writeCell('Fecha de inicio:', new Date(data.start_date).toLocaleDateString('es-CO', { timeZone: 'UTC' }));
        writeCell('Fecha de finalización:', new Date(data.end_date).toLocaleDateString('es-CO', { timeZone: 'UTC' }));

        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(11)
            .text('Precio mensual:', 35, y, { width: colWidth, align: 'left' });
        doc.text(Number(data.price).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }), 35 + colWidth + 10, y, { width: colWidth, align: 'left' });
        y += 18;

        writeCell('Duración del contrato:', `${data.duration_months} meses`);
        writeCell('ID del Contrato:', data.contract_id || 'CON' + Math.random().toString(36).substr(2, 6).toUpperCase()); // Genera un ID si no está presente
        doc.y = y + 10;

        // ===== CLÁUSULA PRINCIPAL =====
        doc.rect(25, doc.y, sectionWidth, 60).fill(colors.sectionFill).stroke(colors.border);
        doc.y += 10;
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('CLÁUSULA PRINCIPAL', 35, doc.y);
        doc.y += 20;
        doc.fillColor(colors.text)
            .font('Times-Roman')
            .fontSize(10)
            .text(`Yo, ${data.landlord_name}, autorizo a ${data.tenant_name} a arrendar "${data.publication_title}" por ${Number(data.price).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })} mensual, desde ${new Date(data.start_date).toLocaleDateString('es-CO', { timeZone: 'UTC' })} hasta ${new Date(data.end_date).toLocaleDateString('es-CO', { timeZone: 'UTC' })} por ${data.duration_months} meses.`, {
                align: 'left',
                indent: 10,
                width: sectionWidth - 20,
                lineGap: 2
            });
        doc.y += 20;

        // ===== CONDICIONES GENERALES =====
        doc.rect(25, doc.y, sectionWidth, 80).fill(colors.sectionFill).stroke(colors.border);
        doc.y += 10;
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('CONDICIONES GENERALES', 35, doc.y);
        doc.y += 20;

        function addCondition(number, text) {
            doc.circle(40, doc.y + 5, 6).fill(colors.secondary);
            doc.fillColor('#ffffff')
                .font('Helvetica-Bold')
                .fontSize(8)
                .text(number, 37, doc.y + 2);
            doc.fillColor(colors.text)
                .font('Times-Roman')
                .fontSize(9)
                .text(text, 55, doc.y, { width: sectionWidth - 65, align: 'justify', lineGap: 2 });
            doc.y += 20;
        }

        addCondition('1', 'Notificar daños en la propiedad dentro de 7 días.');
        addCondition('2', 'Servicios públicos a cargo del arrendatario, salvo acuerdo contrario.');
        addCondition('3', 'Subarrendar requiere consentimiento escrito del arrendador; sigue políticas de ArrendeFuel.');

        // Notas adicionales
        if (data.additional_notes && data.additional_notes.trim() !== '') {
            doc.y += 10;
            doc.rect(25, doc.y, sectionWidth, 50).fill(colors.sectionFill).stroke(colors.border);
            doc.y += 10;
            doc.fillColor(colors.primary)
                .font('Helvetica-Bold')
                .fontSize(12)
                .text('NOTAS ADICIONALES', 35, doc.y);
            doc.y += 20;
            doc.fillColor(colors.text)
                .font('Times-Roman')
                .fontSize(9)
                .text(data.additional_notes, {
                    align: 'justify',
                    indent: 10,
                    width: sectionWidth - 20,
                    lineGap: 2
                });
            doc.y += 20;
        }

        // ===== SEGUNDA PÁGINA (FIRMAS) =====
        doc.addPage();

        // Encabezado segunda página
        doc.rect(0, 0, doc.page.width, 50).fill(colors.primary);
        doc.fillColor('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(18)
            .text('Contrato de Arrendamiento', { align: 'center', y: 15 });
        doc.fontSize(8)
            .fillColor('#ffffff');
        doc.lineWidth(2)
            .strokeColor(colors.secondary)
            .moveTo(25, 55)
            .lineTo(doc.page.width - 25, 55)
            .stroke();
        doc.y = 80;

        // Texto de cierre
        doc.fillColor(colors.text)
            .font('Times-Roman')
            .fontSize(10)
            .text('En testimonio de lo cual, el arrendatario firma el presente contrato en señal de conformidad con todos los términos y condiciones establecidos, en el lugar y fecha indicados', {
                align: 'center',
                width: sectionWidth
            });
        
        doc.y += 20;
        
        doc.fillColor(colors.text)
            .font('Times-Roman')
            .fontSize(10)
            .text('El arrendatario reconoce haber recibido en perfecto estado la propiedad objeto del presente contrato y se compromete a devolverla en las mismas condiciones.', {
                align: 'center',
                width: sectionWidth
            });
        
        doc.y += 40;

        // ===== SECCIÓN DE FIRMA =====
        doc.rect(25, doc.y, sectionWidth, 120).fill(colors.sectionFill).stroke(colors.border);
        doc.y += 30;
        
        // Firma Arrendatario
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('FIRMA DEL ARRENDATARIO', { align: 'center' });
        doc.y += 10;
        
        doc.fillColor(colors.text)
            .font('Helvetica')
            .fontSize(10)
            .text(data.tenant_name, { align: 'center' });
        doc.y += 30;
        
        // Línea de firma
        doc.moveTo(100, doc.y)
           .lineTo(doc.page.width - 100, doc.y)
           .stroke(colors.primary);
        doc.y += 40;

        // Fecha
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('FECHA', { align: 'center' });
        doc.y += 20;
        
        // Línea de fecha
        doc.moveTo(150, doc.y)
           .lineTo(doc.page.width - 150, doc.y)
           .stroke(colors.primary);

        // ===== NOTA ACLARATORIA =====
        doc.y += 40;
        doc.rect(25, doc.y, sectionWidth, 40).fill(colors.noteBg).stroke(colors.highlight);
        doc.y += 15;
        doc.fillColor(colors.highlight)
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('IMPORTANTE: Esto no es un contrato legal ni válido, solo es un trabajo universitario.', {
                align: 'center',
                width: sectionWidth - 20
            });

        doc.end();
    });
}

// Generar PDF del contrato Contrato Editado
function generateEditContractPDF(data, originalData, outputPath) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            margin: 25,
            bufferPages: true,
            size: 'A4',
            info: {
                Title: 'Edición de Contrato de Arrendamiento',
                Author: 'ArrendeFuel',
                Subject: 'Edición de Contrato de Arrendamiento'
            }
        });
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Registrar fuentes
        doc.registerFont('Helvetica-Bold', 'Helvetica-Bold');
        doc.registerFont('Helvetica', 'Helvetica');
        doc.registerFont('Times-Roman', 'Times-Roman');

        const colors = {
            primary: '#2b6b6b',
            secondary: '#4c9f9f',
            background: '#f0f4f8',
            text: '#333333',
            highlight: '#dc2626',
            border: '#d1d9e6',
            sectionFill: '#ffffff',
            signatureBg: '#d1e7dd',
            noteBg: '#f8d7da'
        };

        // ===== ENCABEZADO (PRIMERA PÁGINA) =====
        doc.rect(0, 0, doc.page.width, 50).fill(colors.primary);
        doc.circle(40, 25, 12).fill('#ffffff');
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('AF', 36, 21);
        doc.fillColor('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(18)
            .text('Edición de Contrato de Arrendamiento', { align: 'center', y: 15 });
        doc.fontSize(8)
            .fillColor('#ffffff');
        doc.lineWidth(2)
            .strokeColor(colors.secondary)
            .moveTo(25, 55)
            .lineTo(doc.page.width - 25, 55)
            .stroke();
        doc.y = 60;

        // ===== DATOS DEL CONTRATO ORIGINAL Y EDITADO =====
        const sectionWidth = doc.page.width - 50;
        doc.rect(25, doc.y, sectionWidth, 220).fill(colors.sectionFill).stroke(colors.border);
        doc.y += 15;
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('DATOS DEL CONTRATO ORIGINAL Y EDITADO', 35, doc.y);
        doc.y += 25;

        const colWidth = sectionWidth / 2 - 10;
        let y = doc.y;

        function writeCell(label, originalValue, newValue) {
            const safeOriginal = originalValue !== undefined && originalValue !== null ? String(originalValue) : 'No disponible';
            const safeNew = newValue !== undefined && newValue !== null ? String(newValue) : 'No disponible';

            doc.fillColor(colors.text)
                .font('Helvetica')
                .fontSize(10)
                .text(label, 35, y, { width: colWidth, align: 'left' });

            if (label === 'Propiedad:') {
                doc.fontSize(8)
                    .text(safeOriginal, 35 + colWidth + 15, y, { width: colWidth / 2 - 5, align: 'left', lineGap: 2 });
                doc.fontSize(8)
                    .text(safeNew, 35 + colWidth + colWidth / 2 + 20, y, { width: colWidth / 2 - 5, align: 'left', lineGap: 2 });
                const originalHeight = doc.heightOfString(safeOriginal, { width: colWidth / 2 - 5 });
                const newHeight = doc.heightOfString(safeNew, { width: colWidth / 2 - 5 });
                const maxHeight = Math.max(originalHeight, newHeight, 25);
                y += maxHeight + 5;
            } else {
                doc.fontSize(10)
                    .text(safeOriginal, 35 + colWidth + 15, y, { width: colWidth / 2 - 5, align: 'left' });
                doc.text(safeNew, 35 + colWidth + colWidth / 2 + 20, y, { width: colWidth / 2 - 5, align: 'left' });
                y += 25;
            }
        }

        const formatDate = (date) => {
            if (!date || isNaN(new Date(date).getTime())) return 'No disponible';
            return new Date(date).toLocaleDateString('es-CO', { timeZone: 'UTC' });
        };

        const formatPrice = (price) => {
            if (price === undefined || price === null || isNaN(price)) return 'No disponible';
            return Number(price).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
        };

        writeCell('Arrendador:', originalData.landlord_name, data.landlord_name);
        writeCell('Arrendatario:', originalData.tenant_name, data.tenant_name);
        writeCell('Propiedad:', originalData.publication_title, data.publication_title);
        writeCell('Fecha de inicio:', formatDate(originalData.start_date), formatDate(data.start_date));
        writeCell('Fecha de finalización:', formatDate(originalData.end_date), formatDate(data.end_date));
        writeCell('Duración del contrato:', `${originalData.duration_months || 0} meses`, `${data.duration_months || 0} meses`);
        writeCell('Precio mensual:', formatPrice(originalData.price), formatPrice(data.price));
        writeCell('ID del Contrato:', originalData.contract_id, data.contract_id);

        // Detectar y mostrar cambios en duración
        const durationChange = (data.duration_months || 0) - (originalData.duration_months || 0);
        if (durationChange !== 0) {
            doc.y = y + 20;
            doc.fillColor(durationChange > 0 ? colors.secondary : colors.highlight)
                .font('Helvetica-Bold')
                .fontSize(10)
                .text(`CAMBIO EN DURACIÓN: ${durationChange > 0 ? 'Aumento de ' + durationChange + ' meses' : 'Reducción de ' + Math.abs(durationChange) + ' meses'}`, 35, doc.y, { width: sectionWidth - 20, align: 'left' });
            y = doc.y + 30;
        }

        // Notas adicionales
        if (data.additional_notes && data.additional_notes.trim() !== (originalData.additional_notes || '').trim()) {
            doc.y = y + 25;
            const notesHeight = doc.heightOfString(data.additional_notes || 'Sin notas adicionales', { width: sectionWidth - 60, align: 'justify', lineGap: 2 }) + 40;
            doc.rect(25, doc.y, sectionWidth, notesHeight).fill(colors.sectionFill).stroke(colors.border);
            doc.y += 10;
            doc.fillColor(colors.primary)
                .font('Helvetica-Bold')
                .fontSize(12)
                .text('NOTAS ADICIONALES MODIFICADAS:', 35, doc.y);
            doc.y += 20;
            doc.fillColor(colors.text)
                .font('Times-Roman')
                .fontSize(9)
                .text(data.additional_notes || 'Sin notas adicionales', {
                    align: 'justify',
                    indent: 10,
                    width: sectionWidth - 60,
                    lineGap: 2
                });
            y = doc.y + 25;
        } else {
            y += 25;
        }

        doc.y = y + 25;

        // ===== CLÁUSULA DE EDICIÓN =====
        doc.rect(25, doc.y, sectionWidth, 80).fill(colors.sectionFill).stroke(colors.border);
        doc.y += 10;
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('CLÁUSULA DE EDICIÓN', 35, doc.y);
        doc.y += 20;
        doc.fillColor(colors.text)
            .font('Times-Roman')
            .fontSize(10)
            .text(`Yo, ${originalData.landlord_name}, como arrendador, propongo la siguiente modificación donde ${durationChange > 0 ? 'extiendo' : 'reduzco'} el tiempo de arriendo en ${Math.abs(durationChange)} meses, ajustando el contrato con ID ${originalData.contract_id}. El arrendatario, ${data.tenant_name}, desea aceptar el contrato actualizado a partir del ${formatDate(data.start_date || data.end_date)}.`, {
                align: 'left',
                indent: 10,
                width: sectionWidth - 20,
                lineGap: 2
            });
        doc.y += 30;

        // ===== CONDICIONES GENERALES =====
        doc.rect(25, doc.y, sectionWidth, 80).fill(colors.sectionFill).stroke(colors.border);
        doc.y += 10;
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('CONDICIONES GENERALES', 35, doc.y);
        doc.y += 20;

        function addCondition(number, text) {
            doc.circle(40, doc.y + 5, 6).fill(colors.secondary);
            doc.fillColor('#ffffff')
                .font('Helvetica-Bold')
                .fontSize(8)
                .text(number, 37, doc.y + 2);
            doc.fillColor(colors.text)
                .font('Times-Roman')
                .fontSize(9)
                .text(text, 55, doc.y, { width: sectionWidth - 65, align: 'justify', lineGap: 2 });
            doc.y += 20;
        }

        addCondition('1', 'Notificar daños en la propiedad dentro de 7 días.');
        addCondition('2', 'Servicios públicos a cargo del arrendatario, salvo acuerdo contrario.');
        addCondition('3', 'Subarrendar requiere consentimiento escrito del arrendador; sigue políticas de ArrendeFuel.');

        // ===== SEGUNDA PÁGINA (FIRMA DEL ARRENDATARIO) =====
        doc.addPage();

        // Encabezado segunda página
        doc.rect(0, 0, doc.page.width, 50).fill(colors.primary);
        doc.fillColor('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(18)
            .text('Edición de Contrato de Arrendamiento', { align: 'center', y: 15 });
        doc.lineWidth(2)
            .strokeColor(colors.secondary)
            .moveTo(25, 55)
            .lineTo(doc.page.width - 25, 55)
            .stroke();
        doc.y = 80;

        // Texto de cierre
        doc.fillColor(colors.text)
            .font('Times-Roman')
            .fontSize(10)
            .text('En testimonio de lo cual, el arrendatario firma el presente documento en señal de conformidad con los términos editados.', {
                align: 'center',
                width: sectionWidth
            });
        doc.y += 20;

        doc.fillColor(colors.text)
            .font('Times-Roman')
            .fontSize(10)
            .text('El arrendatario reconoce haber recibido en perfecto estado la propiedad objeto del presente contrato y se compromete a devolverla en las mismas condiciones.', {
                align: 'center',
                width: sectionWidth
            });
        doc.y += 40;

        // ===== SECCIÓN DE FIRMA =====
        doc.rect(25, doc.y, sectionWidth, 120).fill(colors.sectionFill).stroke(colors.border);
        doc.y += 30;

        // Firma Arrendatario
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('FIRMA DEL ARRENDATARIO', { align: 'center' });
        doc.y += 10;
        doc.fillColor(colors.text)
            .font('Helvetica')
            .fontSize(10)
            .text(data.tenant_name, { align: 'center' });
        doc.y += 30;
        doc.moveTo(100, doc.y)
           .lineTo(doc.page.width - 100, doc.y)
           .stroke(colors.primary);
        doc.y += 40;

        // Fecha
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('FECHA', { align: 'center' });
        doc.y += 20;
        doc.moveTo(150, doc.y)
           .lineTo(doc.page.width - 150, doc.y)
           .stroke(colors.primary);

        // ===== NOTA ACLARATORIA =====
        doc.y += 40;
        doc.rect(25, doc.y, sectionWidth, 40).fill(colors.noteBg).stroke(colors.highlight);
        doc.y += 15;
        doc.fillColor(colors.highlight)
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('IMPORTANTE: Esto no es un contrato legal ni válido, solo es un trabajo universitario.', {
                align: 'center',
                width: sectionWidth - 20
            });

        doc.end();
        stream.on('finish', () => resolve(outputPath));
        stream.on('error', (error) => reject(error));
    });
}

// Generar PDF Contrato Editado para Previsualizacion (Acomodar)
function generateEditContractPDFBuffer(data, originalData) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            margin: 25,
            bufferPages: true,
            size: 'A4',
            info: {
                Title: 'Edición de Contrato de Arrendamiento',
                Author: 'ArrendeFuel',
                Subject: 'Edición de Contrato de Arrendamiento'
            }
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Registrar fuentes
        doc.registerFont('Helvetica-Bold', 'Helvetica-Bold');
        doc.registerFont('Helvetica', 'Helvetica');
        doc.registerFont('Times-Roman', 'Times-Roman');

        const colors = {
            primary: '#2b6b6b',
            secondary: '#4c9f9f',
            background: '#f0f4f8',
            text: '#333333',
            highlight: '#dc2626',
            border: '#d1d9e6',
            sectionFill: '#ffffff',
            signatureBg: '#d1e7dd',
            noteBg: '#f8d7da'
        };

        // ===== ENCABEZADO (PRIMERA PÁGINA) =====
        doc.rect(0, 0, doc.page.width, 50).fill(colors.primary);
        doc.circle(40, 25, 12).fill('#ffffff');
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('AF', 36, 21);
        doc.fillColor('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(18)
            .text('Edición de Contrato de Arrendamiento', { align: 'center', y: 15 });
        doc.fontSize(8)
            .fillColor('#ffffff');
        doc.lineWidth(2)
            .strokeColor(colors.secondary)
            .moveTo(25, 55)
            .lineTo(doc.page.width - 25, 55)
            .stroke();
        doc.y = 60;

        // ===== DATOS DEL CONTRATO ORIGINAL Y EDITADO =====
        const sectionWidth = doc.page.width - 50;
        doc.rect(25, doc.y, sectionWidth, 220).fill(colors.sectionFill).stroke(colors.border);
        doc.y += 15;
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('DATOS DEL CONTRATO ORIGINAL Y EDITADO', 35, doc.y);
        doc.y += 25;

        const colWidth = sectionWidth / 2 - 10;
        let y = doc.y;

        function writeCell(label, originalValue, newValue) {
            const safeOriginal = originalValue !== undefined && originalValue !== null ? String(originalValue) : 'No disponible';
            const safeNew = newValue !== undefined && newValue !== null ? String(newValue) : 'No disponible';

            doc.fillColor(colors.text)
                .font('Helvetica')
                .fontSize(10)
                .text(label, 35, y, { width: colWidth, align: 'left' });

            if (label === 'Propiedad:') {
                doc.fontSize(8)
                    .text(safeOriginal, 35 + colWidth + 15, y, { width: colWidth / 2 - 5, align: 'left', lineGap: 2 });
                doc.fontSize(8)
                    .text(safeNew, 35 + colWidth + colWidth / 2 + 20, y, { width: colWidth / 2 - 5, align: 'left', lineGap: 2 });
                const originalHeight = doc.heightOfString(safeOriginal, { width: colWidth / 2 - 5 });
                const newHeight = doc.heightOfString(safeNew, { width: colWidth / 2 - 5 });
                const maxHeight = Math.max(originalHeight, newHeight, 25);
                y += maxHeight + 5;
            } else {
                doc.fontSize(10)
                    .text(safeOriginal, 35 + colWidth + 15, y, { width: colWidth / 2 - 5, align: 'left' });
                doc.text(safeNew, 35 + colWidth + colWidth / 2 + 20, y, { width: colWidth / 2 - 5, align: 'left' });
                y += 25;
            }
        }

        const formatDate = (date) => {
            if (!date || isNaN(new Date(date).getTime())) return 'No disponible';
            return new Date(date).toLocaleDateString('es-CO', { timeZone: 'UTC' });
        };

        const formatPrice = (price) => {
            if (price === undefined || price === null || isNaN(price)) return 'No disponible';
            return Number(price).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
        };

        writeCell('Arrendador:', originalData.landlord_name, data.landlord_name);
        writeCell('Arrendatario:', originalData.tenant_name, data.tenant_name);
        writeCell('Propiedad:', originalData.publication_title, data.publication_title);
        writeCell('Fecha de inicio:', formatDate(originalData.start_date), formatDate(data.start_date));
        writeCell('Fecha de finalización:', formatDate(originalData.end_date), formatDate(data.end_date));
        writeCell('Duración del contrato:', `${originalData.duration_months || 0} meses`, `${data.duration_months || 0} meses`);
        writeCell('Precio mensual:', formatPrice(originalData.price), formatPrice(data.price));
        writeCell('ID del Contrato:', originalData.contract_id, data.contract_id);

        // Detectar y mostrar cambios en duración
        const durationChange = (data.duration_months || 0) - (originalData.duration_months || 0);
        if (durationChange !== 0) {
            doc.y = y + 20;
            doc.fillColor(durationChange > 0 ? colors.secondary : colors.highlight)
                .font('Helvetica-Bold')
                .fontSize(10)
                .text(`CAMBIO EN DURACIÓN: ${durationChange > 0 ? 'Aumento de ' + durationChange + ' meses' : 'Reducción de ' + Math.abs(durationChange) + ' meses'}`, 35, doc.y, { width: sectionWidth - 20, align: 'left' });
            y = doc.y + 30;
        }

        // Notas adicionales
        if (data.additional_notes && data.additional_notes.trim() !== (originalData.additional_notes || '').trim()) {
            doc.y = y + 25;
            const notesHeight = doc.heightOfString(data.additional_notes || 'Sin notas adicionales', { width: sectionWidth - 60, align: 'justify', lineGap: 2 }) + 40;
            doc.rect(25, doc.y, sectionWidth, notesHeight).fill(colors.sectionFill).stroke(colors.border);
            doc.y += 10;
            doc.fillColor(colors.primary)
                .font('Helvetica-Bold')
                .fontSize(12)
                .text('NOTAS ADICIONALES MODIFICADAS:', 35, doc.y);
            doc.y += 20;
            doc.fillColor(colors.text)
                .font('Times-Roman')
                .fontSize(9)
                .text(data.additional_notes || 'Sin notas adicionales', {
                    align: 'justify',
                    indent: 10,
                    width: sectionWidth - 60,
                    lineGap: 2
                });
            y = doc.y + 25;
        } else {
            y += 25;
        }

        doc.y = y + 25;

        // ===== CLÁUSULA DE EDICIÓN =====
        doc.rect(25, doc.y, sectionWidth, 80).fill(colors.sectionFill).stroke(colors.border);
        doc.y += 10;
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('CLÁUSULA DE EDICIÓN', 35, doc.y);
        doc.y += 20;
        doc.fillColor(colors.text)
            .font('Times-Roman')
            .fontSize(10)
            .text(`Yo, ${originalData.landlord_name}, como arrendador, propongo la siguiente modificación donde ${durationChange > 0 ? 'extiendo' : 'reduzco'} el tiempo de arriendo en ${Math.abs(durationChange)} meses, ajustando el contrato con ID ${originalData.contract_id}. El arrendatario, ${data.tenant_name}, desea aceptar el contrato actualizado a partir del ${formatDate(data.start_date || data.end_date)}.`, {
                align: 'left',
                indent: 10,
                width: sectionWidth - 20,
                lineGap: 2
            });
        doc.y += 30;

        // ===== CONDICIONES GENERALES =====
        doc.rect(25, doc.y, sectionWidth, 80).fill(colors.sectionFill).stroke(colors.border);
        doc.y += 10;
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('CONDICIONES GENERALES', 35, doc.y);
        doc.y += 20;

        function addCondition(number, text) {
            doc.circle(40, doc.y + 5, 6).fill(colors.secondary);
            doc.fillColor('#ffffff')
                .font('Helvetica-Bold')
                .fontSize(8)
                .text(number, 37, doc.y + 2);
            doc.fillColor(colors.text)
                .font('Times-Roman')
                .fontSize(9)
                .text(text, 55, doc.y, { width: sectionWidth - 65, align: 'justify', lineGap: 2 });
            doc.y += 20;
        }

        addCondition('1', 'Notificar daños en la propiedad dentro de 7 días.');
        addCondition('2', 'Servicios públicos a cargo del arrendatario, salvo acuerdo contrario.');
        addCondition('3', 'Subarrendar requiere consentimiento escrito del arrendador; sigue políticas de ArrendeFuel.');

        // ===== SEGUNDA PÁGINA (FIRMA DEL ARRENDATARIO) =====
        doc.addPage();

        // Encabezado segunda página
        doc.rect(0, 0, doc.page.width, 50).fill(colors.primary);
        doc.fillColor('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(18)
            .text('Edición de Contrato de Arrendamiento', { align: 'center', y: 15 });
        doc.lineWidth(2)
            .strokeColor(colors.secondary)
            .moveTo(25, 55)
            .lineTo(doc.page.width - 25, 55)
            .stroke();
        doc.y = 80;

        // Texto de cierre
        doc.fillColor(colors.text)
            .font('Times-Roman')
            .fontSize(10)
            .text('En testimonio de lo cual, el arrendatario firma el presente documento en señal de conformidad con los términos editados.', {
                align: 'center',
                width: sectionWidth
            });
        doc.y += 20;

        doc.fillColor(colors.text)
            .font('Times-Roman')
            .fontSize(10)
            .text('El arrendatario reconoce haber recibido en perfecto estado la propiedad objeto del presente contrato y se compromete a devolverla en las mismas condiciones.', {
                align: 'center',
                width: sectionWidth
            });
        doc.y += 40;

        // ===== SECCIÓN DE FIRMA =====
        doc.rect(25, doc.y, sectionWidth, 120).fill(colors.sectionFill).stroke(colors.border);
        doc.y += 30;

        // Firma Arrendatario
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('FIRMA DEL ARRENDATARIO', { align: 'center' });
        doc.y += 10;
        doc.fillColor(colors.text)
            .font('Helvetica')
            .fontSize(10)
            .text(data.tenant_name, { align: 'center' });
        doc.y += 30;
        doc.moveTo(100, doc.y)
           .lineTo(doc.page.width - 100, doc.y)
           .stroke(colors.primary);
        doc.y += 40;

        // Fecha
        doc.fillColor(colors.primary)
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('FECHA', { align: 'center' });
        doc.y += 20;
        doc.moveTo(150, doc.y)
           .lineTo(doc.page.width - 150, doc.y)
           .stroke(colors.primary);

        // ===== NOTA ACLARATORIA =====
        doc.y += 40;
        doc.rect(25, doc.y, sectionWidth, 40).fill(colors.noteBg).stroke(colors.highlight);
        doc.y += 15;
        doc.fillColor(colors.highlight)
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('IMPORTANTE: Esto no es un contrato legal ni válido, solo es un trabajo universitario.', {
                align: 'center',
                width: sectionWidth - 20
            });

        doc.end();
    });
}

// Listar acuerdos
router.get('/', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { status, title, contract_id } = req.query;

    if (!userEmail) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    try {
        let query = `
            SELECT 
                a.*, 
                p.title AS publication_title, 
                p.space_type AS type,
                u1.full_name AS landlord_name, 
                u2.full_name AS tenant_name, 
                a.additional_notes,
                CONCAT(
                    DAY(a.start_date),
                    ' de ',
                    CASE MONTH(a.start_date)
                        WHEN 1 THEN 'enero'
                        WHEN 2 THEN 'febrero'
                        WHEN 3 THEN 'marzo'
                        WHEN 4 THEN 'abril'
                        WHEN 5 THEN 'mayo'
                        WHEN 6 THEN 'junio'
                        WHEN 7 THEN 'julio'
                        WHEN 8 THEN 'agosto'
                        WHEN 9 THEN 'septiembre'
                        WHEN 10 THEN 'octubre'
                        WHEN 11 THEN 'noviembre'
                        WHEN 12 THEN 'diciembre'
                    END,
                    ' de ',
                    YEAR(a.start_date)
                ) AS start_date_formatted,
                CONCAT(
                    DAY(a.end_date),
                    ' de ',
                    CASE MONTH(a.end_date)
                        WHEN 1 THEN 'enero'
                        WHEN 2 THEN 'febrero'
                        WHEN 3 THEN 'marzo'
                        WHEN 4 THEN 'abril'
                        WHEN 5 THEN 'mayo'
                        WHEN 6 THEN 'junio'
                        WHEN 7 THEN 'julio'
                        WHEN 8 THEN 'agosto'
                        WHEN 9 THEN 'septiembre'
                        WHEN 10 THEN 'octubre'
                        WHEN 11 THEN 'noviembre'
                        WHEN 12 THEN 'diciembre'
                    END,
                    ' de ',
                    YEAR(a.end_date)
                ) AS end_date_formatted
            FROM agreements a
            JOIN publications p ON a.publication_id = p.id
            JOIN users u1 ON a.landlord_email = u1.email
            JOIN users u2 ON a.tenant_email = u2.email
            WHERE (a.landlord_email = ? OR a.tenant_email = ?)
        `;
        const queryParams = [userEmail, userEmail];

        if (status) {
            query += ' AND a.status = ?';
            queryParams.push(status);
        }

        if (title) {
            query += ' AND p.title LIKE ?';
            queryParams.push(`%${title}%`);
        }

        if (contract_id) {
            query += ' AND a.contract_id LIKE ?';
            queryParams.push(`%${contract_id}%`);
        }

        query += ' ORDER BY a.created_at DESC';

        const [acuerdos] = await db.query(query, queryParams);
        res.json({ success: true, acuerdos });
    } catch (error) {
        console.error('Error al obtener los acuerdos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los acuerdos' });
    }
});

// Obtener conversaciones del arrendador
router.get('/conversations', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    try {
        const [conversations] = await db.query(`
            SELECT 
                c.id AS conversation_id,
                c.publication_id,
                c.tenant_email,
                c.landlord_email,
                u.full_name AS tenant_name,
                p.title AS publication_title,
                p.price
            FROM conversations c
            JOIN users u ON c.tenant_email = u.email
            JOIN publications p ON c.publication_id = p.id
            WHERE c.landlord_email = ?
        `, [userEmail]);

        const formattedConversations = conversations.map(conv => ({
            id: conv.conversation_id,
            publication_id: conv.publication_id,
            tenant_email: conv.tenant_email,
            landlord_email: conv.landlord_email,
            tenant_name: conv.tenant_name || conv.tenant_email,
            publication_title: conv.publication_title,
            price: conv.price
        }));

        res.json({ success: true, conversations: formattedConversations });
    } catch (error) {
        console.error('Error al obtener conversaciones:', error);
        res.status(500).json({ success: false, message: 'Error al obtener las conversaciones' });
    }
});

// Crear un acuerdo
router.post('/', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { publication_id, tenant_email, start_date, end_date, duration_months, additional_notes } = req.body;

    if (!userEmail) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Validar publicación
        const [publication] = await connection.query(
            'SELECT * FROM publications WHERE id = ? AND landlord_email = ? AND status = "available"',
            [publication_id, userEmail]
        );
        if (publication.length === 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Publicación no válida o no disponible' });
        }

        // Verificar si la publicación ya tiene un acuerdo activo
        const [activeAgreements] = await connection.query(
            'SELECT id FROM agreements WHERE publication_id = ? AND status = ?',
            [publication_id, 'active']
        );
        if (activeAgreements.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'No se puede crear un nuevo acuerdo porque esta publicación ya tiene un acuerdo activo'
            });
        }

        // Validar arrendatario
        const [tenant] = await connection.query('SELECT * FROM users WHERE email = ?', [tenant_email]);
        if (tenant.length === 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Arrendatario no encontrado' });
        }

        // Validar conversación
        const [conversation] = await connection.query(
            'SELECT * FROM conversations WHERE publication_id = ? AND tenant_email = ? AND landlord_email = ?',
            [publication_id, tenant_email, userEmail]
        );
        if (conversation.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'No hay una conversación activa para esta publicación y arrendatario'
            });
        }

        // Validar fechas
        const start = new Date(start_date);
        const end = new Date(end_date);
        if (end <= start) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'La fecha de finalización no puede ser anterior o igual a la fecha de inicio'
            });
        }

        // Generar contract_id
        const contractId = generateContractId();
        saveContractId(contractId);

        // Asegurar que la carpeta contracts exista
        const fs = require('fs').promises;
        const path = require('path');
        const contractPath = path.join(__dirname, '../public/contracts', `contrato_${contractId}.pdf`);
        const contractsDir = path.join(__dirname, '../public/contracts');
        if (!await fs.access(contractsDir).then(() => true).catch(() => false)) {
            await fs.mkdir(contractsDir, { recursive: true });
        }

        // Generar PDF
        await generateContractPDF({
            contract_id: contractId,
            publication_title: publication[0].title,
            landlord_name: (await connection.query('SELECT full_name FROM users WHERE email = ?', [userEmail]))[0][0].full_name,
            tenant_name: tenant[0].full_name,
            landlord_email: userEmail,
            tenant_email: tenant_email,
            price: publication[0].price,
            duration_months,
            start_date: start,
            end_date: end,
            additional_notes: additional_notes || ''
        }, contractPath);

        // Insertar acuerdo
        await connection.query(
            'INSERT INTO agreements (publication_id, landlord_email, tenant_email, contract_id, price, duration_months, start_date, end_date, contract_file, status, additional_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [publication_id, userEmail, tenant_email, contractId, publication[0].price, duration_months, start_date, end_date, `/contracts/contrato_${contractId}.pdf`, 'pending', additional_notes || '']
        );

        // Actualizar estado de la publicación
        await connection.query('UPDATE publications SET rental_status = "en_proceso_arrendamiento" WHERE id = ?', [publication_id]);

        // Crear notificación para el arrendador
        await connection.query(
            `
            INSERT INTO notifications (user_email, type, message, action_url, \`read\`, created_at)
            VALUES (?, 'agreement_created', ?, ?, 0, NOW())
            `,
            [
                userEmail,
                `Has creado un acuerdo para la publicación "${publication[0].title}" con el arrendatario ${tenant[0].full_name}.`,
                `/acuerdos`
            ]
        );

        // Crear notificación para el arrendatario
        await connection.query(
            `
            INSERT INTO notifications (user_email, type, message, action_url, \`read\`, created_at)
            VALUES (?, 'agreement_pending', ?, ?, 0, NOW())
            `,
            [
                tenant_email,
                `Se ha creado un acuerdo para la publicación "${publication[0].title}". Revisa los detalles y firma el contrato.`,
                `/contracts/contrato_${contractId}.pdf`
            ]
        );

        await connection.commit();

        // Enviar correos con manejo de errores
        try {
            await sendAgreementCreatedEmail(userEmail, publication[0].title, contractId);
        } catch (emailError) {
            console.error('Error al enviar el correo de creación de acuerdo:', emailError);
        }

        try {
            await sendAgreementPendingEmail(tenant_email, publication[0].title, contractId, `/contracts/contrato_${contractId}.pdf`);
        } catch (emailError) {
            console.error('Error al enviar el correo de contrato pendiente:', emailError);
        }

        res.json({ success: true, message: 'Acuerdo creado exitosamente' });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al crear acuerdo:', error);
        res.status(500).json({ success: false, message: 'Error al crear el acuerdo', error: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Actualizar acuerdo 
router.put('/:id', async (req, res) => {
    const { end_date, duration_months, additional_notes } = req.body;
    const acuerdoId = req.params.id;
    const userEmail = req.userEmail;

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.query(`
            SELECT 
                a.contract_id, 
                a.end_date, 
                a.landlord_email, 
                ul.full_name AS landlord_name, 
                a.tenant_email, 
                a.status, 
                a.publication_id,
                a.price, 
                a.duration_months, 
                a.start_date, 
                a.additional_notes, 
                p.title AS publication_title,
                ut.full_name AS tenant_name, 
                a.contract_file,
                a.signed_contract_file
            FROM agreements a
            LEFT JOIN publications p ON a.publication_id = p.id
            LEFT JOIN users ul ON a.landlord_email = ul.email
            LEFT JOIN users ut ON a.tenant_email = ut.email
            WHERE a.id = ?
        `, [acuerdoId]);

        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Acuerdo no encontrado' });
        }

        const acuerdo = rows[0];

        if (acuerdo.landlord_email !== userEmail) {
            await connection.rollback();
            return res.status(403).json({ success: false, message: 'No autorizado: No eres el arrendador de este acuerdo' });
        }

        if (!acuerdo.contract_id) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'El acuerdo no tiene un ID de contrato válido' });
        }

        if (acuerdo.status !== 'active') {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Solo se pueden editar acuerdos activos' });
        }

        const today = new Date('2025-05-14T18:19:00-05:00'); // Actualizado a 06:19 PM -05, 14 de mayo de 2025
        today.setHours(0, 0, 0, 0);
        const currentEndDate = new Date(acuerdo.end_date);
        const newEndDate = new Date(end_date);

        if (newEndDate <= today) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'La nueva fecha de finalización debe ser posterior a hoy' });
        }

        const oneMonthInMs = 30 * 24 * 60 * 60 * 1000;
        const dateDiffInMs = Math.abs(newEndDate.getTime() - currentEndDate.getTime());
        if (dateDiffInMs < oneMonthInMs) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'La nueva fecha de finalización debe diferir al menos un mes de la fecha actual del acuerdo' });
        }

        // Usar el contract_id original, sin agregar sufijo _EDIT
        const newContractId = acuerdo.contract_id;

        const originalData = {
            landlord_name: acuerdo.landlord_name || 'Nombre no disponible',
            tenant_name: acuerdo.tenant_name || acuerdo.tenant_email || 'Nombre no disponible',
            publication_title: acuerdo.publication_title || 'Título no disponible',
            start_date: acuerdo.start_date,
            end_date: acuerdo.end_date,
            duration_months: acuerdo.duration_months || 0,
            price: acuerdo.price || 0,
            contract_id: acuerdo.contract_id,
            additional_notes: acuerdo.additional_notes || ''
        };
        const contractData = {
            landlord_name: acuerdo.landlord_name || 'Nombre no disponible',
            tenant_name: acuerdo.tenant_name || acuerdo.tenant_email || 'Nombre no disponible',
            publication_title: acuerdo.publication_title || 'Título no disponible',
            start_date: acuerdo.start_date,
            end_date: newEndDate,
            duration_months: duration_months || 0,
            price: acuerdo.price || 0,
            contract_id: newContractId,
            additional_notes: additional_notes || acuerdo.additional_notes || ''
        };

        console.log('Datos para el PDF:', { originalData, contractData });

        const contractPath = path.join(__dirname, '..', 'public', 'contracts', `contrato_${newContractId}.pdf`);
        await generateEditContractPDF(contractData, originalData, contractPath);

        if (acuerdo.signed_contract_file) {
            const signedFilePath = path.join(__dirname, '..', 'public', 'signed_contracts', path.basename(acuerdo.signed_contract_file));
            try {
                await fs.access(signedFilePath);
                await fs.unlink(signedFilePath);
                console.log(`Archivo firmado eliminado: ${signedFilePath}`);
            } catch (error) {
                console.warn(`No se pudo eliminar el archivo firmado ${signedFilePath}: ${error.message}`);
            }
        }

        await connection.query(`
            UPDATE agreements 
            SET end_date = ?, 
                duration_months = ?, 
                additional_notes = ?, 
                contract_id = ?, 
                contract_file = ?, 
                status = 'pending',
                signed_contract_file = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [end_date, duration_months, additional_notes || acuerdo.additional_notes, newContractId, `/contracts/contrato_${newContractId}.pdf`, acuerdoId]);

        await connection.query(`
            INSERT INTO agreement_history (
                agreement_id, action, previous_end_date, new_end_date, 
                previous_contract_id, new_contract_id
            ) VALUES (?, 'edited', ?, ?, ?, ?)
        `, [acuerdoId, acuerdo.end_date, end_date, acuerdo.contract_id, newContractId]);

        await connection.query(`
            UPDATE publications 
            SET rental_status = 'en_proceso_arrendamiento'
            WHERE id = ?
        `, [acuerdo.publication_id]);

        await connection.query(`
            INSERT INTO notifications (user_email, type, message, created_at)
            VALUES (?, 'agreement_updated', ?, NOW())
        `, [acuerdo.landlord_email, `Acuerdo Modificado, en espera que el Arrendatario firme`]);

        await connection.query(`
            INSERT INTO notifications (user_email, type, message, created_at)
            VALUES (?, 'agreement_updated', ?, NOW())
        `, [acuerdo.tenant_email, `El arrendador ${acuerdo.landlord_name} ha actualizado su contrato #${newContractId}, ve a firmarlo y cierra tu acuerdo`]);

        await sendContractUpdatedEmailLandlord(
            acuerdo.landlord_email,
            acuerdo.publication_title,
            newContractId,
            acuerdo.tenant_name,
            contractPath
        );
        await sendContractUpdatedEmailTenant(
            acuerdo.tenant_email,
            acuerdo.publication_title,
            newContractId,
            contractPath
        );

        await connection.commit();
        res.json({ success: true, message: 'Acuerdo editado exitosamente' });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al editar acuerdo:', error);
        res.status(500).json({ success: false, message: 'Error al editar acuerdo: ' + error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

router.post('/preview-edit', async (req, res) => {
    const { originalData, contractData } = req.body;

    // Validar que los datos existan
    if (!originalData || !contractData) {
        return res.status(400).json({ success: false, message: 'Faltan datos: originalData y contractData son requeridos' });
    }

    // Campos requeridos
    const requiredFields = ['landlord_name', 'tenant_name', 'publication_title', 'start_date', 'end_date', 'duration_months', 'price', 'contract_id'];
    for (const field of requiredFields) {
        if (originalData[field] === undefined || originalData[field] === null || contractData[field] === undefined || contractData[field] === null) {
            return res.status(400).json({ success: false, message: `Falta el campo requerido: ${field}` });
        }
    }

    // Validar fechas
    const originalStartDate = new Date(originalData.start_date);
    const originalEndDate = new Date(originalData.end_date);
    const newStartDate = new Date(contractData.start_date);
    const newEndDate = new Date(contractData.end_date);

    if (isNaN(originalStartDate) || isNaN(originalEndDate) || isNaN(newStartDate) || isNaN(newEndDate)) {
        return res.status(400).json({ success: false, message: 'Las fechas proporcionadas no son válidas' });
    }

    try {
        const pdfBuffer = await generateEditContractPDFBuffer(contractData, originalData);
        res.setHeader('Content-Type', 'application/pdf');
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error al generar previsualización:', error);
        res.status(500).json({ success: false, message: 'Error al generar la previsualización: ' + error.message });
    }
});

// Previsualización del contrato
router.post('/preview', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { publication_id, tenant_email, start_date, end_date, duration_months, price, additional_notes } = req.body;

    if (!userEmail) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    try {
        // Obtener datos de la publicación
        const [publication] = await db.query(
            'SELECT title FROM publications WHERE id = ? AND landlord_email = ?',
            [publication_id, userEmail]
        );
        if (publication.length === 0) {
            return res.status(400).json({ success: false, message: 'Publicación no encontrada' });
        }

        // Obtener nombre del arrendador
        const [landlord] = await db.query('SELECT full_name, email FROM users WHERE email = ?', [userEmail]);
        if (landlord.length === 0) {
            return res.status(400).json({ success: false, message: 'Arrendador no encontrado' });
        }

        // Obtener nombre del arrendatario
        const [tenant] = await db.query('SELECT full_name, email FROM users WHERE email = ?', [tenant_email]);
        if (tenant.length === 0) {
            return res.status(400).json({ success: false, message: 'Arrendatario no encontrado' });
        }

        // Validar fechas
        const start = new Date(start_date);
        const end = new Date(end_date);
        if (end <= start) {
            return res.status(400).json({ success: false, message: 'La fecha de finalización no puede ser anterior o igual a la fecha de inicio' });
        }

        const contractData = {
            publication_title: publication[0].title,
            landlord_name: landlord[0].full_name,
            tenant_name: tenant[0].full_name,
            landlord_email: landlord[0].email,
            tenant_email: tenant[0].email,
            price: price || 0,
            duration_months: duration_months || 0,
            start_date: start,
            end_date: end,
            additional_notes: additional_notes || ''
        };

        const pdfBuffer = await generateContractPDFBuffer(contractData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=preview.pdf');
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error al generar previsualización del contrato:', error);
        res.status(500).json({ success: false, message: 'Error al generar la previsualización del contrato' });
    }
});

// Obtener detalles de un acuerdo específico
router.get('/:id', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { id } = req.params;

    if (!userEmail) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Obtener el acuerdo
        const [acuerdos] = await connection.query(
            `
            SELECT 
                a.*, 
                p.title AS publication_title, 
                p.space_type AS type,
                u1.full_name AS landlord_name, 
                u2.full_name AS tenant_name, 
                a.additional_notes,
                CONCAT(
                    DAY(a.created_at),
                    ' de ',
                    CASE MONTH(a.created_at)
                        WHEN 1 THEN 'enero'
                        WHEN 2 THEN 'febrero'
                        WHEN 3 THEN 'marzo'
                        WHEN 4 THEN 'abril'
                        WHEN 5 THEN 'mayo'
                        WHEN 6 THEN 'junio'
                        WHEN 7 THEN 'julio'
                        WHEN 8 THEN 'agosto'
                        WHEN 9 THEN 'septiembre'
                        WHEN 10 THEN 'octubre'
                        WHEN 11 THEN 'noviembre'
                        WHEN 12 THEN 'diciembre'
                    END,
                    ' de ',
                    YEAR(a.created_at)
                ) AS created_at_formatted,
                CONCAT(
                    DAY(a.updated_at),
                    ' de ',
                    CASE MONTH(a.updated_at)
                        WHEN 1 THEN 'enero'
                        WHEN 2 THEN 'febrero'
                        WHEN 3 THEN 'marzo'
                        WHEN 4 THEN 'abril'
                        WHEN 5 THEN 'mayo'
                        WHEN 6 THEN 'junio'
                        WHEN 7 THEN 'julio'
                        WHEN 8 THEN 'agosto'
                        WHEN 9 THEN 'septiembre'
                        WHEN 10 THEN 'octubre'
                        WHEN 11 THEN 'noviembre'
                        WHEN 12 THEN 'diciembre'
                    END,
                    ' de ',
                    YEAR(a.updated_at)
                ) AS updated_at_formatted,
                CONCAT(
                    DAY(a.start_date),
                    ' de ',
                    CASE MONTH(a.start_date)
                        WHEN 1 THEN 'enero'
                        WHEN 2 THEN 'febrero'
                        WHEN 3 THEN 'marzo'
                        WHEN 4 THEN 'abril'
                        WHEN 5 THEN 'mayo'
                        WHEN 6 THEN 'junio'
                        WHEN 7 THEN 'julio'
                        WHEN 8 THEN 'agosto'
                        WHEN 9 THEN 'septiembre'
                        WHEN 10 THEN 'octubre'
                        WHEN 11 THEN 'noviembre'
                        WHEN 12 THEN 'diciembre'
                    END,
                    ' de ',
                    YEAR(a.start_date)
                ) AS start_date_formatted,
                CONCAT(
                    DAY(a.end_date),
                    ' de ',
                    CASE MONTH(a.end_date)
                        WHEN 1 THEN 'enero'
                        WHEN 2 THEN 'febrero'
                        WHEN 3 THEN 'marzo'
                        WHEN 4 THEN 'abril'
                        WHEN 5 THEN 'mayo'
                        WHEN 6 THEN 'junio'
                        WHEN 7 THEN 'julio'
                        WHEN 8 THEN 'agosto'
                        WHEN 9 THEN 'septiembre'
                        WHEN 10 THEN 'octubre'
                        WHEN 11 THEN 'noviembre'
                        WHEN 12 THEN 'diciembre'
                    END,
                    ' de ',
                    YEAR(a.end_date)
                ) AS end_date_formatted
            FROM agreements a
            JOIN publications p ON a.publication_id = p.id
            JOIN users u1 ON a.landlord_email = u1.email
            JOIN users u2 ON a.tenant_email = u2.email
            WHERE a.id = ? AND (a.landlord_email = ? OR a.tenant_email = ?)
            `,
            [id, userEmail, userEmail]
        );

        if (acuerdos.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Acuerdo no encontrado o no tienes permiso' });
        }

        const acuerdo = acuerdos[0];

        // Verificar si el acuerdo ha expirado
        if (acuerdo.status === 'active') {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Solo la fecha, sin hora
            const endDate = new Date(acuerdo.end_date);
            endDate.setHours(0, 0, 0, 0);

            if (endDate <= today) {
                // Actualizar el estado a 'expired'
                await connection.query(
                    'UPDATE agreements SET status = ? WHERE id = ?',
                    ['expired', acuerdo.id]
                );

                // Actualizar el estado de la publicación a 'disponible'
                await connection.query(
                    'UPDATE publications SET rental_status = ? WHERE id = ?',
                    ['disponible', acuerdo.publication_id]
                );

                // Registrar el cambio en agreement_history
                await connection.query(`
                    INSERT INTO agreement_history (agreement_id, action, previous_status, new_status)
                    VALUES (?, ?, ?, ?)
                `, [acuerdo.id, 'expired', 'active', 'expired']);

                // Crear notificaciones
                await connection.query(`
                    INSERT INTO notifications (user_email, type, message, created_at)
                    VALUES (?, 'agreement_expired', ?, NOW())
                `, [acuerdo.landlord_email, `El contrato ${acuerdo.contract_id} ha expirado el ${new Date(acuerdo.end_date).toLocaleDateString('es-CO', { timeZone: 'UTC' })}. Revisa los detalles en tu cuenta.`]);

                await connection.query(`
                    INSERT INTO notifications (user_email, type, message, created_at)
                    VALUES (?, 'agreement_expired', ?, NOW())
                `, [acuerdo.tenant_email, `El contrato ${acuerdo.contract_id} ha expirado el ${new Date(acuerdo.end_date).toLocaleDateString('es-CO', { timeZone: 'UTC' })}. Revisa los detalles en tu cuenta.`]);

                // Enviar correos electrónicos
                try {
                    await sendContractExpiredEmailLandlord(
                        acuerdo.landlord_email,
                        acuerdo.publication_title,
                        acuerdo.contract_id,
                        new Date(acuerdo.end_date).toLocaleDateString('es-CO', { timeZone: 'UTC' })
                    );
                    await sendContractExpiredEmailTenant(
                        acuerdo.tenant_email,
                        acuerdo.publication_title,
                        acuerdo.contract_id,
                        new Date(acuerdo.end_date).toLocaleDateString('es-CO', { timeZone: 'UTC' })
                    );
                } catch (emailError) {
                    console.error('Error al enviar correos de expiración:', emailError);
                }

                // Actualizar el estado del acuerdo devuelto
                acuerdo.status = 'expired';
            }
        }

        await connection.commit();
        res.json({ success: true, acuerdo });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error al obtener el acuerdo:', error);
        res.status(500).json({ success: false, message: 'Error al obtener el acuerdo', error: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Subir contrato firmado
router.post('/:id/upload-signed', upload.single('signed_contract'), async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { id } = req.params;
    const contractId = req.body.contract_id || id; // Usamos el contract_id del FormData o el id de la URL

    // Verificar autenticación del usuario
    if (!userEmail) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    // Verificar si se subió un archivo
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Debe subir un archivo PDF válido' });
    }

    try {
        // Verificar que el acuerdo existe y pertenece al arrendatario, incluyendo el título de la publicación
        const [acuerdos] = await db.query(
            `SELECT a.*, p.title AS publication_title 
             FROM agreements a 
             JOIN publications p ON a.publication_id = p.id 
             WHERE a.id = ? AND a.tenant_email = ? AND a.contract_id = ?`,
            [id, userEmail, contractId]
        );
        if (acuerdos.length === 0) {
            return res.status(404).json({ success: false, message: 'Acuerdo no encontrado o no autorizado' });
        }

        const acuerdo = acuerdos[0];

        // El archivo ya fue guardado por multer en signedContractsDir/signed_${contractId}.pdf
        const filePath = `/signed_contracts/signed_${contractId}.pdf`;

        // Actualizar la base de datos: establecer signed_contract_file y status a 'pending'
        await db.query(
            'UPDATE agreements SET signed_contract_file = ?, status = ? WHERE id = ?',
            [filePath, 'en_proceso', id]
        );

        // Crear notificación para el arrendatario
        await db.query(
            `
            INSERT INTO notifications (user_email, type, message, action_url, \`read\`, created_at)
            VALUES (?, 'contract_uploaded', ?, ?, 0, NOW())
            `,
            [
                userEmail,
                `Has subido el contrato firmado para la publicación "${acuerdo.publication_title}".`,
                `/acuerdos`
            ]
        );

        // Crear notificación para el arrendador
        await db.query(
            `
            INSERT INTO notifications (user_email, type, message, action_url, \`read\`, created_at)
            VALUES (?, 'contract_uploaded', ?, ?, 0, NOW())
            `,
            [
                acuerdo.landlord_email,
                `El arrendatario ha subido el contrato firmado para la publicación "${acuerdo.publication_title}".`,
                `/acuerdos`
            ]
        );

        // Enviar correos
        try {
            const [tenant] = await db.query('SELECT full_name FROM users WHERE email = ?', [userEmail]);
            await sendContractUploadedEmail(userEmail, acuerdo.publication_title, contractId);
            await sendContractUploadedNotificationEmail(
                acuerdo.landlord_email,
                acuerdo.publication_title,
                contractId,
                tenant[0].full_name,
                req.file.path // Pasamos la ruta del archivo subido
            );
        } catch (emailError) {
            console.error('Error al enviar correos:', emailError);
        }

        res.json({ success: true, message: 'Contrato firmado subido exitosamente', filePath });
    } catch (error) {
        console.error('Error al subir el contrato firmado:', error);
        res.status(500).json({ success: false, message: 'Error al subir el contrato firmado', error: error.message });
    }
});

// Aceptar o Rechazar un acuerdo
router.put('/:id/action', async (req, res) => {
    const userEmail = req.headers['x-user-email'];
    const { id } = req.params;
    const { action } = req.body;

    if (!['accept', 'reject'].includes(action)) {
        return res.status(400).json({ success: false, message: 'Acción inválida' });
    }

    if (!userEmail) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [acuerdos] = await connection.query(
            `SELECT a.*, p.title AS publication_title 
             FROM agreements a 
             JOIN publications p ON a.publication_id = p.id 
             WHERE a.id = ? AND a.status = ? AND (a.landlord_email = ? OR a.tenant_email = ?)`,
            [id, 'en_proceso', userEmail, userEmail]
        );

        if (acuerdos.length === 0) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: 'Acuerdo no encontrado, no está en proceso o no tienes permiso'
            });
        }

        const acuerdo = acuerdos[0];
        const publicationId = acuerdo.publication_id;
        const contractId = acuerdo.contract_id;
        const landlordEmail = acuerdo.landlord_email;
        const tenantEmail = acuerdo.tenant_email;
        const publicationTitle = acuerdo.publication_title;

        if (action === 'accept') {
            // Actualizar el estado del acuerdo a 'active'
            await connection.query(
                'UPDATE agreements SET status = ? WHERE id = ?',
                ['active', id]
            );

            // Actualizar el rental_status de la publicación a 'arrendado'
            await connection.query(
                'UPDATE publications SET rental_status = ? WHERE id = ?',
                ['arrendado', publicationId]
            );

            // Notificaciones para arrendador y arrendatario
            await connection.query(
                'INSERT INTO notifications (user_email, type, message, created_at) VALUES (?, ?, ?, NOW())',
                [landlordEmail, 'contract_accepted', `El acuerdo ${contractId} ha sido aceptado exitosamente.`]
            );
            await connection.query(
                'INSERT INTO notifications (user_email, type, message, created_at) VALUES (?, ?, ?, NOW())',
                [tenantEmail, 'contract_accepted', `El acuerdo ${contractId} ha sido aceptado exitosamente.`]
            );

            // Enviar correos de aceptación
            await sendContractAcceptedEmail(landlordEmail, publicationTitle || 'Desconocido', contractId, 'arrendador');
            await sendContractAcceptedEmail(tenantEmail, publicationTitle || 'Desconocido', contractId, 'arrendatario');

            // Buscar y eliminar otros acuerdos relacionados con la misma publicación, EXCLUYENDO los que están en estado 'cancelled'
            const [otherAcuerdos] = await connection.query(
                'SELECT id, tenant_email FROM agreements WHERE publication_id = ? AND id != ? AND status IN (?, ?) AND status != ?',
                [publicationId, id, 'pending', 'en_proceso', 'cancelled']
            );

            for (const otherAcuerdo of otherAcuerdos) {
                await connection.query(
                    'INSERT INTO notifications (user_email, type, message, created_at) VALUES (?, ?, ?, NOW())',
                    [otherAcuerdo.tenant_email, 'opportunity_lost', `Lo sentimos, la oportunidad para la publicación ${publicationTitle || 'Desconocido'} ha sido tomada por otro usuario.`]
                );
                await connection.query(
                    'DELETE FROM agreements WHERE id = ?',
                    [otherAcuerdo.id]
                );
            }

            await connection.commit();
            res.json({ success: true, message: 'Acuerdo aceptado exitosamente' });
        } else if (action === 'reject') {
            let signedFilePath = null;
            let originalFilePath = null;
            if (acuerdo.signed_contract_file) {
                signedFilePath = path.join(__dirname, '..', 'public', 'signed_contracts', `signed_${contractId}.pdf`);
                originalFilePath = path.join(__dirname, '..', 'public', 'contracts', `contrato_${contractId}.pdf`);
                console.log(`Intentando manejar archivo firmado: ${signedFilePath}`);
                console.log(`Intentando adjuntar archivo original: ${originalFilePath}`);

                fs.access(signedFilePath, fs.constants.F_OK, (accessError) => {
                    if (accessError) {
                        console.warn(`No se pudo acceder al archivo firmado ${signedFilePath}: ${accessError.message}`);
                        // Intentar enviar correo con el archivo original
                        fs.access(originalFilePath, fs.constants.F_OK, (originalAccessError) => {
                            if (originalAccessError) {
                                console.warn(`No se pudo acceder al archivo original ${originalFilePath}: ${originalAccessError.message}`);
                                // Enviar correo sin adjunto
                                sendContractRejectedEmail(
                                    tenantEmail,
                                    publicationTitle || 'Desconocido',
                                    contractId,
                                    null,
                                    async (emailError) => {
                                        if (emailError) {
                                            console.error('Error al enviar correo de rechazo:', emailError);
                                            await connection.rollback();
                                            return res.status(500).json({
                                                success: false,
                                                message: `Error al enviar correo de rechazo: ${emailError.message}`
                                            });
                                        }

                                        try {
                                            // Actualizar el estado del acuerdo a 'pending' y limpiar el archivo firmado
                                            await connection.query(
                                                'UPDATE agreements SET signed_contract_file = NULL, status = ? WHERE id = ?',
                                                ['pending', id]
                                            );

                                            // Verificar si hay otros acuerdos en proceso para esta publicación
                                            const [remainingAcuerdos] = await connection.query(
                                                'SELECT id FROM agreements WHERE publication_id = ? AND id != ? AND status IN (?, ?)',
                                                [publicationId, id, 'pending', 'en_proceso']
                                            );

                                            // Si no hay otros acuerdos en proceso, cambiar rental_status a 'disponible'
                                            if (remainingAcuerdos.length === 0) {
                                                await connection.query(
                                                    'UPDATE publications SET rental_status = ? WHERE id = ?',
                                                    ['disponible', publicationId]
                                                );
                                            }

                                            // Notificaciones para arrendador y arrendatario
                                            await connection.query(
                                                'INSERT INTO notifications (user_email, type, message, created_at) VALUES (?, ?, ?, NOW())',
                                                [landlordEmail, 'contract_rejected', `El contrato ${contractId} ha sido rechazado exitosamente.`]
                                            );
                                            await connection.query(
                                                'INSERT INTO notifications (user_email, type, message, created_at) VALUES (?, ?, ?, NOW())',
                                                [tenantEmail, 'contract_rejected', `El contrato ${contractId} fue rechazado. Por favor, revisa y sube el contrato nuevamente.`]
                                            );

                                            await connection.commit();
                                            res.json({ success: true, message: 'Acuerdo rechazado exitosamente' });
                                        } catch (dbError) {
                                            await connection.rollback();
                                            console.error('Error al actualizar base de datos:', dbError);
                                            res.status(500).json({
                                                success: false,
                                                message: `Error al actualizar base de datos: ${dbError.message}`
                                            });
                                        }
                                    }
                                );
                            } else {
                                // Enviar correo con archivo original
                                sendContractRejectedEmail(
                                    tenantEmail,
                                    publicationTitle || 'Desconocido',
                                    contractId,
                                    originalFilePath,
                                    async (emailError) => {
                                        if (emailError) {
                                            console.error('Error al enviar correo de rechazo:', emailError);
                                            await connection.rollback();
                                            return res.status(500).json({
                                                success: false,
                                                message: `Error al enviar correo de rechazo: ${emailError.message}`
                                            });
                                        }

                                        try {
                                            // Actualizar el estado del acuerdo a 'pending' y limpiar el archivo firmado
                                            await connection.query(
                                                'UPDATE agreements SET signed_contract_file = NULL, status = ? WHERE id = ?',
                                                ['pending', id]
                                            );

                                            // Verificar si hay otros acuerdos en proceso para esta publicación
                                            const [remainingAcuerdos] = await connection.query(
                                                'SELECT id FROM agreements WHERE publication_id = ? AND id != ? AND status IN (?, ?)',
                                                [publicationId, id, 'pending', 'en_proceso']
                                            );

                                            // Si no hay otros acuerdos en proceso, cambiar rental_status a 'disponible'
                                            if (remainingAcuerdos.length === 0) {
                                                await connection.query(
                                                    'UPDATE publications SET rental_status = ? WHERE id = ?',
                                                    ['disponible', publicationId]
                                                );
                                            }

                                            // Notificaciones para arrendador y arrendatario
                                            await connection.query(
                                                'INSERT INTO notifications (user_email, type, message, created_at) VALUES (?, ?, ?, NOW())',
                                                [landlordEmail, 'contract_rejected', `El contrato ${contractId} ha sido rechazado exitosamente.`]
                                            );
                                            await connection.query(
                                                'INSERT INTO notifications (user_email, type, message, created_at) VALUES (?, ?, ?, NOW())',
                                                [tenantEmail, 'contract_rejected', `El contrato ${contractId} fue rechazado. Por favor, revisa y sube el contrato nuevamente.`]
                                            );

                                            await connection.commit();
                                            res.json({ success: true, message: 'Acuerdo rechazado exitosamente' });
                                        } catch (dbError) {
                                            await connection.rollback();
                                            console.error('Error al actualizar base de datos:', dbError);
                                            res.status(500).json({
                                                success: false,
                                                message: `Error al actualizar base de datos: ${dbError.message}`
                                            });
                                        }
                                    }
                                );
                            }
                        });
                    } else {
                        // Archivo firmado existe, intentar enviar correo con archivo original
                        fs.access(originalFilePath, fs.constants.F_OK, (originalAccessError) => {
                            if (originalAccessError) {
                                console.warn(`No se pudo acceder al archivo original ${originalFilePath}: ${originalAccessError.message}`);
                                // Enviar correo sin adjunto
                                sendContractRejectedEmail(
                                    tenantEmail,
                                    publicationTitle || 'Desconocido',
                                    contractId,
                                    null,
                                    async (emailError) => {
                                        if (emailError) {
                                            console.error('Error al enviar correo de rechazo:', emailError);
                                            await connection.rollback();
                                            return res.status(500).json({
                                                success: false,
                                                message: `Error al enviar correo de rechazo: ${emailError.message}`
                                            });
                                        }

                                        // Eliminar archivo firmado
                                        fs.unlink(signedFilePath, async (unlinkError) => {
                                            if (unlinkError) {
                                                console.warn(`No se pudo eliminar el archivo ${signedFilePath}: ${unlinkError.message}`);
                                            } else {
                                                console.log(`Archivo eliminado: ${signedFilePath}`);
                                            }

                                            try {
                                                // Actualizar el estado del acuerdo a 'pending' y limpiar el archivo firmado
                                                await connection.query(
                                                    'UPDATE agreements SET signed_contract_file = NULL, status = ? WHERE id = ?',
                                                    ['pending', id]
                                                );

                                                // Verificar si hay otros acuerdos en proceso para esta publicación
                                                const [remainingAcuerdos] = await connection.query(
                                                    'SELECT id FROM agreements WHERE publication_id = ? AND id != ? AND status IN (?, ?)',
                                                    [publicationId, id, 'pending', 'en_proceso']
                                                );

                                                // Si no hay otros acuerdos en proceso, cambiar rental_status a 'disponible'
                                                if (remainingAcuerdos.length === 0) {
                                                    await connection.query(
                                                        'UPDATE publications SET rental_status = ? WHERE id = ?',
                                                        ['disponible', publicationId]
                                                    );
                                                }

                                                // Notificaciones para arrendador y arrendatario
                                                await connection.query(
                                                    'INSERT INTO notifications (user_email, type, message, created_at) VALUES (?, ?, ?, NOW())',
                                                    [landlordEmail, 'contract_rejected', `El contrato ${contractId} ha sido rechazado exitosamente.`]
                                                );
                                                await connection.query(
                                                    'INSERT INTO notifications (user_email, type, message, created_at) VALUES (?, ?, ?, NOW())',
                                                    [tenantEmail, 'contract_rejected', `El contrato ${contractId} fue rechazado. Por favor, revisa y sube el contrato nuevamente.`]
                                                );

                                                await connection.commit();
                                                res.json({ success: true, message: 'Acuerdo rechazado exitosamente' });
                                            } catch (dbError) {
                                                await connection.rollback();
                                                console.error('Error al actualizar base de datos:', dbError);
                                                res.status(500).json({
                                                    success: false,
                                                    message: `Error al actualizar base de datos: ${dbError.message}`
                                                });
                                            }
                                        });
                                    }
                                );
                            } else {
                                // Enviar correo con archivo original y eliminar archivo firmado
                                sendContractRejectedEmail(
                                    tenantEmail,
                                    publicationTitle || 'Desconocido',
                                    contractId,
                                    originalFilePath,
                                    async (emailError) => {
                                        if (emailError) {
                                            console.error('Error al enviar correo de rechazo:', emailError);
                                            await connection.rollback();
                                            return res.status(500).json({
                                                success: false,
                                                message: `Error al enviar correo de rechazo: ${emailError.message}`
                                            });
                                        }

                                        fs.unlink(signedFilePath, async (unlinkError) => {
                                            if (unlinkError) {
                                                console.warn(`No se pudo eliminar el archivo ${signedFilePath}: ${unlinkError.message}`);
                                            } else {
                                                console.log(`Archivo eliminado: ${signedFilePath}`);
                                            }

                                            try {
                                                // Actualizar el estado del acuerdo a 'pending' y limpiar el archivo firmado
                                                await connection.query(
                                                    'UPDATE agreements SET signed_contract_file = NULL, status = ? WHERE id = ?',
                                                    ['pending', id]
                                                );

                                                // Verificar si hay otros acuerdos en proceso para esta publicación
                                                const [remainingAcuerdos] = await connection.query(
                                                    'SELECT id FROM agreements WHERE publication_id = ? AND id != ? AND status IN (?, ?)',
                                                    [publicationId, id, 'pending', 'en_proceso']
                                                );

                                                // Si no hay otros acuerdos en proceso, cambiar rental_status a 'disponible'
                                                if (remainingAcuerdos.length === 0) {
                                                    await connection.query(
                                                        'UPDATE publications SET rental_status = ? WHERE id = ?',
                                                        ['disponible', publicationId]
                                                    );
                                                }

                                                // Notificaciones para arrendador y arrendatario
                                                await connection.query(
                                                    'INSERT INTO notifications (user_email, type, message, created_at) VALUES (?, ?, ?, NOW())',
                                                    [landlordEmail, 'contract_rejected', `El contrato ${contractId} ha sido rechazado exitosamente.`]
                                                );
                                                await connection.query(
                                                    'INSERT INTO notifications (user_email, type, message, created_at) VALUES (?, ?, ?, NOW())',
                                                    [tenantEmail, 'contract_rejected', `El contrato ${contractId} fue rechazado. Por favor, revisa y sube el contrato nuevamente.`]
                                                );

                                                await connection.commit();
                                                res.json({ success: true, message: 'Acuerdo rechazado exitosamente' });
                                            } catch (dbError) {
                                                await connection.rollback();
                                                console.error('Error al actualizar base de datos:', dbError);
                                                res.status(500).json({
                                                    success: false,
                                                    message: `Error al actualizar base de datos: ${dbError.message}`
                                                });
                                            }
                                        });
                                    }
                                );
                            }
                        });
                    }
                });
            } else {
                console.log('No se encontró signed_contract_file para el acuerdo.');
                // Intentar enviar correo con archivo original
                originalFilePath = path.join(__dirname, '..', 'public', 'contracts', `contrato_${contractId}.pdf`);
                console.log(`Intentando adjuntar archivo original: ${originalFilePath}`);
                fs.access(originalFilePath, fs.constants.F_OK, (originalAccessError) => {
                    if (originalAccessError) {
                        console.warn(`No se pudo acceder al archivo original ${originalFilePath}: ${originalAccessError.message}`);
                        // Enviar correo sin adjunto
                        sendContractRejectedEmail(
                            tenantEmail,
                            publicationTitle || 'Desconocido',
                            contractId,
                            null,
                            async (emailError) => {
                                if (emailError) {
                                    console.error('Error al enviar correo de rechazo:', emailError);
                                    await connection.rollback();
                                    return res.status(500).json({
                                        success: false,
                                        message: `Error al enviar correo de rechazo: ${emailError.message}`
                                    });
                                }

                                try {
                                    // Actualizar el estado del acuerdo a 'pending'
                                    await connection.query(
                                        'UPDATE agreements SET status = ? WHERE id = ?',
                                        ['pending', id]
                                    );

                                    // Verificar si hay otros acuerdos en proceso para esta publicación
                                    const [remainingAcuerdos] = await connection.query(
                                        'SELECT id FROM agreements WHERE publication_id = ? AND id != ? AND status IN (?, ?)',
                                        [publicationId, id, 'pending', 'en_proceso']
                                    );

                                    // Si no hay otros acuerdos en proceso, cambiar rental_status a 'disponible'
                                    if (remainingAcuerdos.length === 0) {
                                        await connection.query(
                                            'UPDATE publications SET rental_status = ? WHERE id = ?',
                                            ['disponible', publicationId]
                                        );
                                    }

                                    // Notificaciones para arrendador y arrendatario
                                    await connection.query(
                                        'INSERT INTO notifications (user_email, type, message, created_at) VALUES (?, ?, ?, NOW())',
                                        [landlordEmail, 'contract_rejected', `El contrato ${contractId} ha sido rechazado exitosamente.`]
                                    );
                                    await connection.query(
                                        'INSERT INTO notifications (user_email, type, message, created_at) VALUES (?, ?, ?, NOW())',
                                        [tenantEmail, 'contract_rejected', `El contrato ${contractId} fue rechazado. Por favor, revisa y sube el contrato nuevamente.`]
                                    );

                                    await connection.commit();
                                    res.json({ success: true, message: 'Acuerdo rechazado exitosamente' });
                                } catch (dbError) {
                                    await connection.rollback();
                                    console.error('Error al actualizar base de datos:', dbError);
                                    res.status(500).json({
                                        success: false,
                                        message: `Error al actualizar base de datos: ${dbError.message}`
                                    });
                                }
                            }
                        );
                    } else {
                        // Enviar correo con archivo original
                        sendContractRejectedEmail(
                            tenantEmail,
                            publicationTitle || 'Desconocido',
                            contractId,
                            originalFilePath,
                            async (emailError) => {
                                if (emailError) {
                                    console.error('Error al enviar correo de rechazo:', emailError);
                                    await connection.rollback();
                                    return res.status(500).json({
                                        success: false,
                                        message: `Error al enviar correo de rechazo: ${emailError.message}`
                                    });
                                }

                                try {
                                    // Actualizar el estado del acuerdo a 'pending'
                                    await connection.query(
                                        'UPDATE agreements SET status = ? WHERE id = ?',
                                        ['pending', id]
                                    );

                                    // Verificar si hay otros acuerdos en proceso para esta publicación
                                    const [remainingAcuerdos] = await connection.query(
                                        'SELECT id FROM agreements WHERE publication_id = ? AND id != ? AND status IN (?, ?)',
                                        [publicationId, id, 'pending', 'en_proceso']
                                    );

                                    // Si no hay otros acuerdos en proceso, cambiar rental_status a 'disponible'
                                    if (remainingAcuerdos.length === 0) {
                                        await connection.query(
                                            'UPDATE publications SET rental_status = ? WHERE id = ?',
                                            ['disponible', publicationId]
                                        );
                                    }

                                    // Notificaciones para arrendador y arrendatario
                                    await connection.query(
                                        'INSERT INTO notifications (user_email, type, message, created_at) VALUES (?, ?, ?, NOW())',
                                        [landlordEmail, 'contract_rejected', `El contrato ${contractId} ha sido rechazado exitosamente.`]
                                    );
                                    await connection.query(
                                        'INSERT INTO notifications (user_email, type, message, created_at) VALUES (?, ?, ?, NOW())',
                                        [tenantEmail, 'contract_rejected', `El contrato ${contractId} fue rechazado. Por favor, revisa y sube el contrato nuevamente.`]
                                    );

                                    await connection.commit();
                                    res.json({ success: true, message: 'Acuerdo rechazado exitosamente' });
                                } catch (dbError) {
                                    await connection.rollback();
                                    console.error('Error al actualizar base de datos:', dbError);
                                    res.status(500).json({
                                        success: false,
                                        message: `Error al actualizar base de datos: ${dbError.message}`
                                    });
                                }
                            }
                        );
                    }
                });
            }
        }
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error(`Error al ${action === 'accept' ? 'aceptar' : 'rechazar'} el acuerdo:`, error);
        res.status(500).json({ success: false, message: `Error al ${action === 'accept' ? 'aceptar' : 'rechazar'} el acuerdo: ${error.message}` });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Ruta para cancelar un acuerdo
router.put('/:id/cancel', async (req, res) => {
    let connection;
    try {
        const { id: acuerdoId } = req.params;
        console.log('Intentando procesar cancelación para acuerdoId:', acuerdoId); // Depuración

        const { reason, publicationId, landlordEmail, tenantEmail, contractId, publicationTitle, startDate, endDate } = req.body;
        console.log('Datos recibidos:', { reason, publicationId, landlordEmail, tenantEmail, contractId, publicationTitle, startDate, endDate }); // Depuración

        const userEmail = req.headers['x-user-email'];

        // Validar email del usuario
        if (!userEmail) {
            return res.status(401).json({ success: false, message: 'No se encontró el email del usuario.' });
        }

        // Validar datos requeridos del cuerpo
        if (!reason || !publicationId || !landlordEmail || !tenantEmail || !contractId || !publicationTitle || !startDate || !endDate) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos para la cancelación.' });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Verificar que el acuerdo existe y pertenece al usuario
        const [agreements] = await connection.query(
            'SELECT status, start_date, end_date, publication_id, landlord_email, tenant_email, contract_id FROM agreements WHERE id = ? AND landlord_email = ?',
            [acuerdoId, userEmail]
        );
        if (agreements.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Acuerdo no encontrado o no tienes permiso para cancelarlo.' });
        }

        const acuerdo = agreements[0];
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Solo fecha para comparar

        // Validación de estado
        if (acuerdo.status === 'expired' || acuerdo.status === 'cancelled') {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'No se puede cancelar un acuerdo ya finalizado o cancelado.' });
        }

        // Determinar si es antes o durante el arrendamiento
        const startDateObj = new Date(acuerdo.start_date);
        const isBeforeStart = currentDate < startDateObj;

        // Actualizar el estado del acuerdo a 'cancelled'
        await connection.query(
            'UPDATE agreements SET status = ?, updated_at = NOW() WHERE id = ?',
            ['cancelled', acuerdoId]
        );

        // Registrar en agreement_history
        await connection.query(
            'INSERT INTO agreement_history (agreement_id, action, previous_end_date, new_end_date, previous_contract_id, new_contract_id) VALUES (?, ?, ?, ?, ?, ?)',
            [acuerdoId, 'cancelled', acuerdo.end_date, null, acuerdo.contract_id, null]
        );

        // Si es antes del inicio, republicar la publicación
        if (isBeforeStart) {
            await connection.query(
                'UPDATE publications SET rental_status = ? WHERE id = ?',
                ['disponible', publicationId]
            );
        }

        // Crear notificaciones
        await connection.query(
            'INSERT INTO notifications (user_email, type, message, created_at) VALUES (?, ?, ?, NOW())',
            [landlordEmail, 'agreement_cancelled', `El contrato ${contractId} ha sido cancelado. Motivo: ${reason.substring(0, 50)}${reason.length > 50 ? '...' : ''}`]
        );
        await connection.query(
            'INSERT INTO notifications (user_email, type, message, created_at) VALUES (?, ?, ?, NOW())',
            [tenantEmail, 'agreement_cancelled', `El contrato ${contractId} ha sido cancelado. Motivo: ${reason.substring(0, 50)}${reason.length > 50 ? '...' : ''}`]
        );

        // Enviar correos
        try {
            await sendContractCancelledEmailLandlord(landlordEmail, publicationTitle, contractId, startDate, endDate, reason);
            await sendContractCancelledEmailTenant(tenantEmail, publicationTitle, contractId, startDate, endDate, reason);
        } catch (emailError) {
            console.error('Error al enviar correos de cancelación:', emailError);
            // No rollback por error de correo, solo log
        }

        await connection.commit();
        res.json({ success: true, message: 'Acuerdo cancelado exitosamente.' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al cancelar el acuerdo:', error);
        res.status(500).json({ success: false, message: 'Error al cancelar el acuerdo: ' + error.message });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;
