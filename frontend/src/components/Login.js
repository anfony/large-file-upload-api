import React, { useState } from 'react';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Importar iconos de react-icons
import './Login.css'; // Importar el archivo de estilos

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);  // Estado para controlar si se muestra la contraseña

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:3000/login', { email, password });
      const token = response.data.token;

      setToken(token);
      localStorage.setItem('token', token);  // Guardar el token en localStorage
    } catch (error) {
      console.error('Error iniciando sesión', error);
      alert('Error iniciando sesión');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);  // Alternar entre mostrar y ocultar la contraseña
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Iniciar Sesión</h2>
        <input
          type="email"
          placeholder="Correo Electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? "text" : "password"}  // Mostrar texto o contraseña según el estado
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            onClick={togglePasswordVisibility}
            style={{
              position: 'absolute',
              right: '20px',
              top: '40%',
              transform: 'translateY(-50%)',
              cursor: 'pointer'
            }}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}  {/* Ojo abierto o cerrado */}
          </span>
        </div>
        <button type="submit">Iniciar Sesión</button>
      </form>
    </div>
  );
};

export default Login;
