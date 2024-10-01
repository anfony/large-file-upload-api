require('dotenv').config();
const { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } = require('@aws-sdk/client-s3');
const { NodeHttpHandler } = require('@smithy/node-http-handler');

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
        // Obtener el archivo desde el formulario (req.file) y asignar su buffer
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
                })
                .catch((err) => {
                    console.error(`Error subiendo la parte ${currentPartNumber}:`, err);
                    throw new Error(`Error en la parte ${currentPartNumber}`);
                });
        };

        // Aquí debes crear un stream o usar un buffer para dividir el archivo en chunks
        const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
        const fileBuffer = Buffer.from(file.buffer);
        const totalParts = Math.ceil(fileBuffer.length / CHUNK_SIZE);

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
        res.status(200).send("Subida completada con éxito.");

    } catch (err) {
        console.error("Error subiendo el archivo:", err);
        res.status(500).send("Error subiendo el archivo.");
    }
};

// Exportar la función de subida
module.exports = uploadMultipart;
