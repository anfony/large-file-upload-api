import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [token, setToken] = useState(null);

  // Recuperar el token de localStorage al cargar la aplicación
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // Función para cerrar sesión
  const handleLogout = () => {
    setToken(null);  // Eliminar el token del estado
    localStorage.removeItem('token');  // Eliminar el token de localStorage
  };

  return (
    <Router>
      <Routes>
        {/* Ruta para el login */}
        <Route path="/login" element={<Login setToken={setToken} />} />

        {/* Ruta para el dashboard */}
        <Route
          path="/dashboard"
          element={token ? <Dashboard token={token} handleLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        {/* Redirigir a /login si no hay un token */}
        <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
