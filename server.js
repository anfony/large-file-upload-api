require('dotenv').config();
const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const authenticateToken = require('./authMiddleware'); // Middleware para autenticación

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar el cliente S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

app.use(express.json());
app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));

// Ruta para generar URL presignada para subir archivos
app.post('/generatePresignedUrl', authenticateToken, (req, res) => {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
        return res.status(400).json({ error: "Faltan parámetros: fileName o fileType." });
    }

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `uploads/${fileName}`,  // Guardar en la carpeta uploads
        Expires: 60 * 5,  // URL válida por 5 minutos
        ContentType: fileType,
        ACL: 'public-read'  // Dar permisos de lectura pública, opcional según tu configuración
    };

    // Generar URL presignada
    s3.getSignedUrl('putObject', params, (err, url) => {
        if (err) {
            console.error("Error generando la URL presignada:", err);
            return res.status(500).json({ error: "Error generando la URL presignada." });
        }

        res.json({ presignedUrl: url, url: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/uploads/${fileName}` });
    });
});

// Ruta protegida para listar archivos en S3
app.get('/files', authenticateToken, (req, res) => {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
    };

    s3.listObjectsV2(params, (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error obteniendo los archivos' });
        }
        const fileNames = data.Contents.map(file => file.Key);
        res.json(fileNames);
    });
});

// Ruta para descargar archivos desde S3
app.get('/download/:fileName', authenticateToken, (req, res) => {
    const fileName = req.params.fileName;
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `uploads/${fileName}`
    };

    s3.getObject(params, (err, data) => {
        if (err) {
            console.error(err);
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        res.setHeader('Content-Type', data.ContentType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.send(data.Body);
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
