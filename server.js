const express = require('express');
const jwt = require('jsonwebtoken');
const authenticateToken = require('./authMiddleware'); // Middleware de autenticación
const uploadMultipart = require('./uploadFile'); // Función para subir archivos a S3
require('dotenv').config(); // Cargar variables de entorno

const app = express();

// Middleware para parsear JSON en el cuerpo de las solicitudes
app.use(express.json());

// Ruta de inicio de sesión para generar el token JWT (simple ejemplo)
app.post('/login', (req, res) => {
    const { username } = req.body;
    const user = { name: username };  // Datos simulados del usuario

    // Generar el token JWT
    const accessToken = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ accessToken });
});

// Ruta protegida de subida de archivos
app.post('/upload', authenticateToken, (req, res) => {
    uploadMultipart(req, res);  // Llamar a la función de subida de archivos a S3
});

// Iniciar el servidor en el puerto definido
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
