const admin = require("firebase-admin");
const fs = require("fs");

// Inicialize o Firebase Admin SDK
admin.initializeApp({
  storageBucket: "hqlab-5ae55.appspot.com" // Substitua pelo seu bucket do Firebase
});

const bucket = admin.storage().bucket();

// Função de upload
async function uploadFile(filePath, destination) {
  await bucket.upload(filePath, {
    destination: destination,
    public: true, // Torna o arquivo público, ajuste conforme necessário
  });
  console.log(`Arquivo enviado para: ${destination}`);
}

// Exemplo de uso
const filePath = "./path/to/prompt_options.json"; // Caminho do arquivo local
const destination = "prompt_options.json"; // Caminho de destino no bucket

uploadFile(filePath, destination).catch(console.error);
