import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ setToken }) => {
    const [username, setUsername] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:3000/login', { username });
            setToken(response.data.accessToken);
            alert("Autenticación exitosa!");
        } catch (error) {
            console.error("Error al iniciar sesión", error);
            alert("Error al iniciar sesión. Verifica el usuario.");
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <label>Nombre de usuario:</label>
                <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required 
                />
                <button type="submit">Iniciar sesión</button>
            </form>
        </div>
    );
};

export default Login;
