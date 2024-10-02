require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const AWS = require('aws-sdk');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { uploadMultipart, getUploadProgress } = require('./uploadFile');
const authenticateToken = require('./authMiddleware');
const db = require('./db');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

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
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://serverfileslarges-9cfb943831a0.herokuapp.com'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));

app.options('*', cors()); // Permite preflight requests

// // Configuración de multer para manejo de archivos en la memoria
// const upload = multer({
//     storage: multer.memoryStorage(), // Los archivos se almacenan en memoria antes de subir a S3
// });

app.get('/', (req, res) => {
    res.status(200).send('API funcionando correctamente');
});

// Ruta de registro
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    // Encriptar la contraseña
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).json({ error: 'Error encriptando la contraseña' });
        }

        // Insertar el usuario en la base de datos
        const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        db.query(query, [username, email, hashedPassword], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Error al registrar el usuario' });
            }
            res.status(201).json({ message: 'Usuario registrado exitosamente' });
        });
    });
});

// Ruta de login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Verificar si el usuario existe en la base de datos
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        const user = results[0];

        // Comparar la contraseña con la encriptada
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ error: 'Error verificando la contraseña' });
            }

            if (!isMatch) {
                return res.status(401).json({ error: 'Contraseña incorrecta' });
            }

            // Generar token JWT
            const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.json({ message: 'Login exitoso', token });
        });
    });
});

// Ruta protegida (ejemplo)
app.get('/dashboard', authenticateToken, (req, res) => {
    res.json({ message: `Bienvenido al dashboard, ${req.user.username}` });
});

// // Ruta protegida para subir archivos
// app.post('/upload', authenticateToken, upload.single('file'), uploadMultipart);

app.get('/generate-upload-url', authenticateToken, async (req, res) => {
    const { fileName, fileType } = req.query;

    const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `uploads/${fileName}`,
        Expires: 60,
        ContentType: fileType,
        ACL: 'public-read'
    };

    try {
        const uploadUrl = s3.getSignedUrl('putObject', s3Params);
        res.status(200).json({ uploadUrl });
    } catch (err) {
        console.error('Error generando URL prefirmada de S3', err);
        res.status(500).json({ error: 'Error generando URL de subida' });
    }
});

// Ruta para obtener el progreso de la subida
app.get('/upload-progress/:fileName', authenticateToken, getUploadProgress);

// Ruta para obtener la lista de archivos en S3
app.get('/files', authenticateToken, (req, res) => {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        MaxKeys: 10,
        ContinuationToken: req.query.token
    };

    s3.listObjectsV2(params, (err, data) => {
        if (err) {
            console.error('Error obteniendo los archivos de S3:', err);
            return res.status(500).json({ error: 'Error obteniendo los archivos' });
        }

        res.json({
            files: data.Contents.map(file => file.Key),
            nextToken: data.NextContinuationToken
        });
    });
});

// Ruta para descargar archivos
app.get('/download/:fileName', authenticateToken, (req, res) => {
    const fileName = req.params.fileName;
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `uploads/${fileName}`,
        Expires: 60
    };

    // Generar URL prefirmada para la descarga directa desde S3
    s3.getSignedUrl('getObject', params, (err, url) => {
        if (err) {
            console.error('Error generando URL prefirmada de S3', err);
            return res.status(500).json({ error: 'Error generando URL de descarga' });
        }
        // Enviar la URL prefirmada de vuelta al cliente
        res.json({ url });
    });
});

// Ruta para eliminar archivos de S3
app.delete('/files/:fileName', authenticateToken, async (req, res) => {
    const fileName = req.params.fileName;

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `uploads/${fileName}`
    };

    // Verificar si el archivo existe
    try {
        await s3.headObject(params).promise();
    } catch (err) {
        console.error("El archivo no existe en S3:", err.message);
        return res.status(404).json({ error: 'El archivo no existe' });
    }

    // Eliminar el archivo si existe
    try {
        await s3.deleteObject(params).promise();
        res.status(200).json({ message: 'Archivo eliminado con éxito' });
    } catch (err) {
        console.error("Error eliminando el archivo de S3:", err.message);
        res.status(500).json({ error: 'Error eliminando el archivo' });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

////Version funcional 95%