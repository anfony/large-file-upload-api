require('dotenv').config(); // Cargar variables de entorno
const express = require('express');
const bcrypt = require('bcryptjs');
const AWS = require('aws-sdk');
const cors = require('cors'); // Importar el paquete cors
const multer = require('multer'); // Importar multer para manejar archivos
const jwt = require('jsonwebtoken');
const uploadMultipart = require('./uploadFile');  // Ruta correcta donde esté tu archivo uploadFile.js
const authenticateToken = require('./authMiddleware'); // Middleware para autenticación
const db = require('./db'); // Conexión a la base de datos

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar el cliente S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

app.use(express.json()); // Middleware para procesar JSON

app.use(cors({
    origin: '*',  // Permitir todas las solicitudes desde cualquier origen
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Si es necesario compartir cookies o credenciales
}));

// Configuración de multer para manejo de archivos en la memoria
const upload = multer({
    storage: multer.memoryStorage(), // Los archivos se almacenan en memoria antes de subir a S3
});

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

// Ruta protegida para subir archivos
// Se usa 'upload.single('file')' para manejar un archivo a la vez
app.post('/upload', authenticateToken, upload.single('file'), uploadMultipart);

// Ruta para obtener la lista de archivos en S3
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
        }        // Asegúrate de establecer el tipo MIME correcto (esto es solo un ejemplo)
        res.setHeader('Content-Type', data.ContentType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.send(data.Body);
        res.attachment(fileName);
        res.send(data.Body);
    });
});


// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
