require('dotenv').config();
const { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } = require('@aws-sdk/client-s3');
const { NodeHttpHandler } = require('@smithy/node-http-handler');

const uploadProgress = {}; // Guardará el progreso de subida por archivo

// Crear el cliente S3
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    requestHandler: new NodeHttpHandler({
        maxSockets: 200,
        socketAcquisitionWarningTimeout: 60000
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
            Key: `uploads/${fileName}`,
        };

        const createMultipartUploadCommand = new CreateMultipartUploadCommand(params);
        const multipartUpload = await s3.send(createMultipartUploadCommand);
        const uploadId = multipartUpload.UploadId;
        console.log("Multipart Upload ID:", uploadId);

        let partNumber = 1;
        let uploadedParts = [];
        let uploadQueue = [];
        const MAX_CONCURRENT_UPLOADS = 20;

        // Inicializa el progreso para este archivo
        uploadProgress[fileName] = { uploaded: 0, total: file.size };

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

                    // Actualiza el progreso
                    uploadProgress[fileName].uploaded += chunk.length;
                })
                .catch((err) => {
                    console.error(`Error subiendo la parte ${currentPartNumber}:`, err);
                    throw new Error(`Error en la parte ${currentPartNumber}`);
                });
        };

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

        await Promise.all(uploadQueue);

        console.log("Todas las partes han sido subidas.");
        uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber);

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

        // Elimina el progreso al completar la subida
        delete uploadProgress[fileName];

        res.status(200).send({ message: "Subida completada con éxito." });

    } catch (err) {
        console.error("Error subiendo el archivo:", err);
        res.status(500).send("Error subiendo el archivo.");
    }
};

// Endpoint para obtener el progreso de la subida
const getUploadProgress = (req, res) => {
    const fileName = req.params.fileName;
    const progress = uploadProgress[fileName];
    if (progress) {
        res.status(200).send({
            uploaded: progress.uploaded,
            total: progress.total,
            progress: Math.round((progress.uploaded / progress.total) * 100)
        });
    } else {
        res.status(404).send({ message: "No se encontró progreso para este archivo." });
    }
};

module.exports = { uploadMultipart, getUploadProgress };
