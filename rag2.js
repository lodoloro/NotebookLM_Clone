const axios = require("axios");
const { QdrantClient } = require("@qdrant/js-client-rest");

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


async function askQuestion(question, history) {

    // Create embedding for the question
const retrievalQuery = [
    ...history.slice(-6).map(m => m.content),
    question
].join(" ");

const questionVector = await createEmbedding(retrievalQuery);


    // Search Qdrant
    const results = await client.search("documents", {
        vector: questionVector,
        limit: 3
    });


    // Get matching document text
    const context = results
        .map(result => result.payload.text)
        .join("\n\n");

        const conversation = history
    .map(msg => `${msg.role}: ${msg.content}`)
    .join("\n");

    console.log("----- Conversation -----");
console.log(conversation);

console.log("----- Context -----");
console.log(context);

console.log("----- Question -----");
console.log(question);

    // Ask Ollama using retrieved context
    const response = await axios.post(
        "http://localhost:11434/api/generate",
        {
            model: "llama3.2:latest",
            stream: false,
prompt: `
You are Nero AI.

Continue the conversation naturally.

If the current question refers to something mentioned earlier
(using words like "it", "they", "that", "he", etc.),
use the previous conversation to determine what the user means.

Use the retrieved document information whenever possible.

Previous conversation:
${conversation}

Retrieved document information:
${context}

Current user question:
${question}

Answer:
`
        }
    );


    const answer = response.data.response;

const sources = [
    ...new Set(
        results.map(result => result.payload.source)
    )
];

return {
    answer,
    sources
};
}


module.exports = askQuestion;