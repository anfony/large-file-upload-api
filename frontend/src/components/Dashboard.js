import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './Dashboard.css'; // Importar el archivo CSS

const Dashboard = ({ token, handleLogout }) => {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [username, setUsername] = useState(''); // Almacenar el nombre del usuario

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
      const response = await axios.get('http://localhost:3000/files', {
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
      await axios.post('http://localhost:3000/upload', formData, {
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
    try {
      const response = await axios.get(`http://localhost:3000/${fileName}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Error descargando el archivo", error);
    }
  };

  // Eliminar archivo
  const deleteFile = async (fileName) => {
    try {
      await axios.delete(`http://localhost:3000/files/${fileName}`, {
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
  }, []);

  return (
    <div className="dashboard-container">
      {/* Barra de navegación */}
      <nav className="navbar">
        <h2>Bienvenido, {username}</h2> {/* Mostrar el nombre del usuario */}
        <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
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