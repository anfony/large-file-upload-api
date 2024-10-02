import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './Dashboard.css'; // Importar el archivo CSS

const Dashboard = ({ token, handleLogout }) => {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [username, setUsername] = useState('');
  const [baseURL, setBaseURL] = useState('https://serverfileslarges-9cfb943831a0.herokuapp.com');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const toggleURL = () => {
    setBaseURL((prevURL) =>
      prevURL === 'https://serverfileslarges-9cfb943831a0.herokuapp.com'
        ? 'http://localhost:3000'
        : 'https://serverfileslarges-9cfb943831a0.herokuapp.com'
    );
  };

  useEffect(() => {
    if (token) {
      const decodedToken = jwtDecode(token);
      setUsername(decodedToken.username);
    }
  }, [token]);

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${baseURL}/files`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(response.data);
      setFiles(response.data.files);
    } catch (error) {
      console.error('Error obteniendo los archivos', error);
    }
  };

  const uploadFileToS3 = async () => {
    if (!file) return;

    const fileName = file.name;
    const fileType = file.type;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const { data } = await axios.get(`${baseURL}/generate-upload-url`, {
        params: {
          fileName,
          fileType,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      const { uploadUrl } = data;

      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': fileType,
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      alert('Archivo subido con éxito a S3');
      setUploadProgress(0);
      setIsUploading(false);

      fetchFiles();
    } catch (error) {
      console.error('Error subiendo el archivo', error);
      alert('Error subiendo el archivo');
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  const downloadFile = async (fileName) => {
    const cleanFileName = fileName.replace(/^uploads\//, '');

    try {
      const response = await axios.get(`${baseURL}/download/${cleanFileName}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error descargando el archivo', error);
      alert('Error descargando el archivo');
    }
  };

  const deleteFile = async (fileName) => {
    const cleanFileName = fileName.replace(/^uploads\//, '');

    try {
      await axios.delete(`${baseURL}/files/${cleanFileName}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Archivo eliminado');
      fetchFiles();
    } catch (error) {
      console.error('Error eliminando el archivo', error);
      alert('Error eliminando el archivo');
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [baseURL]);

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <h2>Bienvenido, {username}</h2>
        <div className="nav-buttons">
          <button onClick={toggleURL} className="toggle-url-btn">
            Cambiar a {baseURL === 'https://serverfileslarges-9cfb943831a0.herokuapp.com' ? 'Local' : 'Producción'}
            <span className="info-icon">ℹ️</span>
            <div className="tooltip">
              Cambia entre el entorno de desarrollo (local) y producción (Heroku).
            </div>
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <div className="content">
        <h2>Archivos Subidos</h2>
        <div className="upload-section">
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button onClick={uploadFileToS3} className="upload-btn" disabled={isUploading}>
            Subir archivo
          </button>
          {isUploading && (
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
                {uploadProgress}%
              </div>
            </div>
          )}
        </div>

        <table className="files-table">
          <thead>
            <tr>
              <th>Nombre del Archivo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(files) && files.length > 0 ? (
              files.map((fileName) => (
                <tr key={fileName}>
                  <td>{fileName}</td>
                  <td>
                    <button onClick={() => downloadFile(fileName)}>Descargar</button>
                    <button onClick={() => deleteFile(fileName)}>Eliminar</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2">No hay archivos disponibles</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
