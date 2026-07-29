const { QdrantClient } = require("@qdrant/js-client-rest");
const axios = require("axios");

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


async function insert() {


    const vector = await createEmbedding(text);

    await client.upsert("documents", {
        points: [
            {
                id: 1,
                vector: vector,
                payload: {
                    text: text
                }
            }
        ]
    });

    console.log("Inserted!");
}


insert();