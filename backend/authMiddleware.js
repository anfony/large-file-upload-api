const jwt = require('jsonwebtoken');
require('dotenv').config(); // Asegurarse de cargar el JWT_SECRET

// Middleware para verificar el token JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];  // Extraer el token de 'Authorization'

    if (!token) return res.sendStatus(401);  // Si no hay token, no autorizado

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);  // Token inválido
        req.user = user;
        next();  // Autenticación exitosa, continuar
    });
};

module.exports = authenticateToken;
