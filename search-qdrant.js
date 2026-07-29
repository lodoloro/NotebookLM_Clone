const { QdrantClient } = require("@qdrant/js-client-rest");
const axios = require("axios");
const readline = require("readline");

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

async function askQuestion(question) {

    const questionVector = await createEmbedding(question);

    const results = await client.search("documents", {
        vector: questionVector,
        limit: 3
    });

    const context = results
        .map(result => result.payload.text)
        .join("\n\n");

    console.log("\nRetrieved Context:");
    console.log("--------------------------------");
    console.log(context);
    console.log("--------------------------------\n");

    const response = await axios.post(
        "http://localhost:11434/api/generate",
        {
            model: "llama3.2:latest",
            stream: false,
            prompt: `
You are answering questions about uploaded documents.

Only use the information below.

If the answer isn't in the document, say you don't know.

Context:

${context}

Question:
${question}
`
        }
    );

    console.log("AI:");
    console.log(response.data.response);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Ask a question: ", async (question) => {

    await askQuestion(question);

    rl.close();

});