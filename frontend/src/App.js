import React, { useState, useEffect } from 'react';
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

  if (!token) {
    return <Login setToken={setToken} />;
  }

  return (
    <Dashboard token={token} handleLogout={handleLogout} />
  );
}

export default App;
