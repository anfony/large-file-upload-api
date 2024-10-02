require('dotenv').config();
const { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } = require('@aws-sdk/client-s3');
const { NodeHttpHandler } = require('@smithy/node-http-handler');

// Objeto para almacenar el progreso de subida de cada archivo
const uploadProgress = {};

// Crear el cliente S3
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    requestHandler: new NodeHttpHandler({
        maxSockets: 200,  // Aumenta el número máximo de sockets simultáneos
        socketAcquisitionWarningTimeout: 60000  // Aumenta el tiempo antes de mostrar advertencias
    })
});

// Función de subida
const uploadMultipart = async (req, res) => {
    try {
        const file = req.file;
        const fileName = file.originalname;

        if (!file) {
            return res.status(400).send("Error: No se proporcionó ningún archivo.");
        }

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `uploads/${fileName}`, // Nombre del archivo en S3
        };

        // Inicializar el Multipart Upload
        const createMultipartUploadCommand = new CreateMultipartUploadCommand(params);
        const multipartUpload = await s3.send(createMultipartUploadCommand);
        const uploadId = multipartUpload.UploadId;
        console.log("Multipart Upload ID:", uploadId);

        let partNumber = 1;
        let uploadedParts = [];
        let uploadQueue = [];
        const MAX_CONCURRENT_UPLOADS = 20;  // Limitar el número de subidas simultáneas

        // Inicializar el progreso de subida a 0%
        uploadProgress[fileName] = { totalParts: 0, uploadedParts: 0 };

        const uploadNextPart = async (chunk, currentPartNumber) => {
            const partParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `uploads/${fileName}`,
                PartNumber: currentPartNumber,
                UploadId: uploadId,
                Body: chunk
            };

            return s3.send(new UploadPartCommand(partParams))
                .then((uploadedPart) => {
                    console.log(`Parte ${currentPartNumber} subida`);
                    uploadedParts.push({
                        PartNumber: currentPartNumber,
                        ETag: uploadedPart.ETag
                    });

                    // Actualizar el progreso en uploadProgress
                    uploadProgress[fileName].uploadedParts++;
                })
                .catch((err) => {
                    console.error(`Error subiendo la parte ${currentPartNumber}:`, err);
                    throw new Error(`Error en la parte ${currentPartNumber}`);
                });
        };

        // Dividir el archivo en chunks y realizar las subidas de partes
        const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
        const fileBuffer = Buffer.from(file.buffer);
        const totalParts = Math.ceil(fileBuffer.length / CHUNK_SIZE);
        
        // Actualizar el total de partes
        uploadProgress[fileName].totalParts = totalParts;

        for (let i = 0; i < totalParts; i++) {
            const chunk = fileBuffer.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
            if (uploadQueue.length >= MAX_CONCURRENT_UPLOADS) {
                await Promise.race(uploadQueue);
            }

            const currentPartNumber = partNumber;
            partNumber++;

            const uploadPromise = uploadNextPart(chunk, currentPartNumber).then(() => {
                uploadQueue = uploadQueue.filter(p => p !== uploadPromise);
            });
            uploadQueue.push(uploadPromise);
        }

        // Esperar a que todas las subidas pendientes terminen
        await Promise.all(uploadQueue);

        console.log("Todas las partes han sido subidas.");
        uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber);

        // Completar la subida
        const completeParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `uploads/${fileName}`,
            UploadId: uploadId,
            MultipartUpload: {
                Parts: uploadedParts
            }
        };

        const completeMultipartUploadCommand = new CompleteMultipartUploadCommand(completeParams);
        await s3.send(completeMultipartUploadCommand);
        console.log("Subida completada con éxito.");

        // Eliminar el progreso una vez que la subida esté completa
        delete uploadProgress[fileName];
        res.status(200).send({ message: "Subida completada con éxito." });

    } catch (err) {
        console.error("Error subiendo el archivo:", err);
        res.status(500).send("Error subiendo el archivo.");
    }
};

// Nueva ruta para obtener el progreso de subida
const getUploadProgress = (req, res) => {
    const fileName = req.params.fileName;
    if (!uploadProgress[fileName]) {
        return res.status(404).send("No hay progreso de subida para este archivo.");
    }

    const { totalParts, uploadedParts } = uploadProgress[fileName];
    const progressPercentage = Math.round((uploadedParts / totalParts) * 100);
    res.json({ progress: progressPercentage });
};

// Exportar las funciones
module.exports = {
    uploadMultipart,
    getUploadProgress
};
