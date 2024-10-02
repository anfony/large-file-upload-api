import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './Dashboard.css'; // Importar el archivo CSS

const Dashboard = ({ token, handleLogout }) => {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [username, setUsername] = useState(''); // Almacenar el nombre del usuario
  const [baseURL, setBaseURL] = useState('https://serverfileslarges-9cfb943831a0.herokuapp.com'); // Estado de URL base

  // Cambiar entre URLs de producción y local
  const toggleURL = () => {
    setBaseURL((prevURL) => 
      prevURL === 'https://serverfileslarges-9cfb943831a0.herokuapp.com' 
        ? 'http://localhost:3000' 
        : 'https://serverfileslarges-9cfb943831a0.herokuapp.com'
    );
  };

  // Obtener el nombre del usuario desde el token
  useEffect(() => {
    if (token) {
      const decodedToken = jwtDecode(token);
      setUsername(decodedToken.username); // Extraer el nombre de usuario del token
    }
  }, [token]);

  // Obtener la lista de archivos subidos
  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${baseURL}/files`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(response.data);
    } catch (error) {
      console.error("Error obteniendo los archivos", error);
    }
  };

  // Subir archivo seleccionado
  const uploadFile = async () => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${baseURL}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      alert("Archivo subido con éxito");
      fetchFiles(); // Actualizar la lista de archivos
    } catch (error) {
      console.error("Error subiendo el archivo", error);
      alert("Error subiendo el archivo");
    }
  };

  // Descargar archivo
  const downloadFile = async (fileName) => {
    const cleanFileName = fileName.replace(/^uploads\//, '');

    try {
      const response = await axios.get(`${baseURL}/download/${cleanFileName}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      window.location.href = response.data.url;
    } catch (error) {
      console.error("Error descargando el archivo", error);
      alert("Error descargando el archivo");
    }
  };

// Eliminar archivo
const deleteFile = async (fileName) => {
  const cleanFileName = fileName.replace(/^uploads\//, ''); // Quitar el prefijo 'uploads/' si está presente

  try {
    await axios.delete(`${baseURL}/files/${cleanFileName}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert("Archivo eliminado");
    fetchFiles(); // Actualizar la lista de archivos
  } catch (error) {
    console.error("Error eliminando el archivo", error);
    alert("Error eliminando el archivo");
  }
};

  // Obtener archivos al cargar el componente
  useEffect(() => {
    fetchFiles();
  }, [baseURL]); // Ejecutar cuando la URL base cambie

  return (
    <div className="dashboard-container">
      {/* Barra de navegación */}
      <nav className="navbar">
        <h2>Bienvenido, {username}</h2> {/* Mostrar el nombre del usuario */}
        <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
        <button onClick={toggleURL} className="toggle-url-btn">
          Cambiar a {baseURL === 'https://serverfileslarges-9cfb943831a0.herokuapp.com' ? 'Local' : 'Producción'}
        </button> {/* Botón para cambiar entre URLs */}
      </nav>

      <div className="content">
        <h2>Archivos Subidos</h2>
        <div className="upload-section">
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button onClick={uploadFile} className="upload-btn">Subir archivo</button>
        </div>

        <table className="files-table">
          <thead>
            <tr>
              <th>Nombre del Archivo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {files.map((fileName) => (
              <tr key={fileName}>
                <td>{fileName}</td>
                <td>
                  <button onClick={() => downloadFile(fileName)}>Descargar</button>
                  <button onClick={() => deleteFile(fileName)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
