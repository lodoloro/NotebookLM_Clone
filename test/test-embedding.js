const axios = require("axios");

async function createEmbedding() {
    const response = await axios.post(
        "http://localhost:11434/api/embeddings",
        {
            model: "nomic-embed-text",
            prompt: "Employees receive three weeks of vacation."
        }
    );

    console.log(response.data.embedding);
}

createEmbedding();