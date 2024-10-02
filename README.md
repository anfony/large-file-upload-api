Large File Upload API
Este proyecto permite la carga eficiente de archivos grandes (más de 1 GB) a un bucket de S3 de Amazon Web Services (AWS) a través de una API en Node.js con un frontend en React.

Estructura del Proyecto
El proyecto está dividido en dos partes principales:

Backend (API en Node.js): Aquí se encuentran los archivos que configuran el servidor, las rutas de subida, descarga, eliminación y gestión de los archivos en el bucket de S3.
Frontend (React): Contiene el código del frontend para el cliente que interactúa con la API para subir y descargar archivos grandes.
Estructura de carpetas:

large-file-upload-api/
│
├── frontend/           # Carpeta que contiene todo el código del frontend en React
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── README.md
│   └── ...
│
├── server.js           # Archivo principal del servidor (Backend)
├── middleware.js       # Middleware para la autenticación
├── uploadFile.js       # Lógica para subir archivos a S3 usando multipart upload
├── db.js               # Archivo para manejar la conexión a la base de datos MySQL
├── Procfile            # Archivo de configuración para Heroku
├── .env                # Archivo de configuración con variables de entorno (No se sube a Git)
├── package.json        # Dependencias del backend
├── README.md           # Documentación del proyecto
└── ...

Funcionalidades
Subir archivos grandes (>1GB): Utiliza multipart upload para manejar archivos grandes en Amazon S3.
Descargar archivos: Los usuarios pueden descargar archivos directamente desde el bucket de S3 a través de una URL prefirmada.
Eliminar archivos: Permite a los usuarios eliminar archivos del bucket de S3.
Ver progreso de subida: El frontend muestra una barra de progreso de la subida en tiempo real.
Login de usuario: Los usuarios deben estar autenticados para interactuar con la API. El login utiliza JWT (JSON Web Token) para la autenticación.
Prerrequisitos
Tener instalado Node.js en tu sistema.
Tener una cuenta en AWS y un bucket de S3 configurado.
Tener una base de datos MySQL o RDS configurada.
Variables de entorno
Si deseas ejecutar este proyecto localmente, necesitarás configurar un archivo .env en la raíz del proyecto con las siguientes variables:

AWS_ACCESS_KEY_ID=AKIAYHJANGG4KJS7XNFL
AWS_BUCKET_NAME=filesupload-test
AWS_REGION=us-east-2
AWS_SECRET_ACCESS_KEY=BDunRg3Yj9aIi3hNCULjZA4Oru04hdDyYtcyqRxM
DB_HOST=databaseupdatefiles.chwgy4omkb40.us-east-2.rds.amazonaws.com
DB_NAME=databaseupdatefiles
DB_PASSWORD=C84cdd5f30
DB_PORT=3306
DB_USER=admin
JWT_SECRET=40Ad796277aI3hNCULjZAOru04hdDyYtcyqRxM

Instrucciones para Ejecutar el Proyecto

Backend

1. Clona el repositorio en tu máquina local.
git clone https://github.com/tu_usuario/large-file-upload-api.git

2. Navega al directorio raíz del proyecto:
cd large-file-upload-api

3. Instala las dependencias del backend:
npm install

4. (Opcional) Crea un archivo .env en la raíz con las variables de entorno descritas anteriormente si deseas ejecutar el backend localmente.

5. Inicia el servidor:
node server.js
El backend se ejecutará en http://localhost:3000.

Frontend

1. Una vez que el backend esté corriendo, navega a la carpeta frontend:
cd frontend

2. Instala las dependencias del frontend:
npm install

3. Inicia el servidor del frontend:
npm start
Esto abrirá una ventana del navegador en http://localhost:3001, donde puedes probar el login, subir archivos, descargarlos y eliminarlos.

Tecnologías Utilizadas

Backend: Node.js, Express.js, AWS SDK para interacciones con S3, MySQL para la base de datos.
Frontend: React.js con Axios para las solicitudes HTTP.
Autenticación: JWT (JSON Web Tokens).
Almacenamiento de Archivos: AWS S3 con multipart upload.

Mejoras Futuras
Implementar una estrategia de caché para mejorar la velocidad de acceso a los archivos.
Agregar manejo avanzado de errores para el frontend.
Optimizar la interfaz para móviles.
Habilitar la opción de compartir archivos con otros usuarios.