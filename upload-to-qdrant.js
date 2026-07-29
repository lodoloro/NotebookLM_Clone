const fs = require("fs");
const { PDFParse } = require("pdf-parse");
const axios = require("axios");
const { QdrantClient } = require("@qdrant/js-client-rest");
const chunkText = require("./chunker");


const client = new QdrantClient({
    host: "localhost",
    port: 6333
});

async function createEmbedding(text) {

    const response = await axios.post(
        "http://localhost:11434/api/embeddings",
        {
            model: "nomic-embed-text",
            prompt: text
        }
    );

    return response.data.embedding;
}


async function uploadToQdrant(text, filename, documentId) {

    const chunks = chunkText(text);

    console.log("Chunks created:", chunks.length);

    let id = Date.now();

    for (const chunk of chunks) {

        const vector = await createEmbedding(chunk);

        await client.upsert("documents", {
            points: [
                {
                    id: id++,
                    vector: vector,
                    payload: {
                        text: chunk,
                        source: filename,
                        documentId: documentId
                    }
                }
            ]
        });

        console.log("Uploaded chunk");
    }

    console.log("Finished uploading!");
}


module.exports = uploadToQdrant;