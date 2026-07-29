const axios = require("axios");
const chunkText = require("./rag");

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


async function run() {

    const document = `
    The company uses Node.js for backend development.
    The company uses Ollama for local AI models.
    Employees have access to internal AI tools.
    `;

    const chunks = chunkText(document, 100);

    for (const chunk of chunks) {
        const embedding = await createEmbedding(chunk);

        console.log("CHUNK:");
        console.log(chunk);

        console.log("VECTOR LENGTH:");
        console.log(embedding.length);

        console.log("----------------");
    }
}

run();