import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';

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
      <Switch>
        {/* Ruta para el login */}
        <Route path="/login">
          {token ? <Redirect to="/dashboard" /> : <Login setToken={setToken} />}
        </Route>

        {/* Ruta para el dashboard */}
        <Route path="/dashboard">
          {token ? <Dashboard token={token} handleLogout={handleLogout} /> : <Redirect to="/login" />}
        </Route>

        {/* Ruta por defecto */}
        <Redirect from="/" to={token ? "/dashboard" : "/login"} />
      </Switch>
    </Router>
  );
}

export default App;
