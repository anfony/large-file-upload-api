import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = ({ token }) => {
    const [files, setFiles] = useState([]);
    const [file, setFile] = useState(null);

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
            const response = await axios.get(`http://localhost:3000/download/${fileName}`, {
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

    useEffect(() => {
        fetchFiles();
    }, []);

    return (
        <div>
            <h2>Archivos Subidos</h2>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <button onClick={uploadFile}>Subir archivo</button>

            <ul>
                {files.map((fileName) => (
                    <li key={fileName}>
                        {fileName}
                        <button onClick={() => downloadFile(fileName)}>Descargar</button>
                        <button onClick={() => deleteFile(fileName)}>Eliminar</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Dashboard;
