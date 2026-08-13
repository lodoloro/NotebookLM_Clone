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

        console.log(context);

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
You are Bay Roberts AI, a helpful assistant.

Use the previous conversation only as background context.
Do not mention the conversation history, previous messages, or phrases like:
- "as far as I remember"
- "you mentioned earlier"
- "based on our previous conversation"

Only use previous context to understand what the user means and answer the current question.

Use the document information only when it is relevant to the question.

If the user changes topics, answer the new topic normally.

IMPORTANT RULES:
- The uploaded document information is the primary source of truth.
- Always check the document information before answering.
- If the answer exists in the documents use the documents as the most important source of info along with some other context if you understand and can add anything, however if its not you may answer the question freely.
- Do not replace document information with your own general knowledge.
- Do not mention that you are using documents unless the user asks.

Previous conversation:
${conversation}

Relevant document information:
${context}

Current user question:
${question}

Give a direct, natural answer to the user's question.
`
        }
    );


    const answer = response.data.response;

const sources = [
    ...new Set(
        results.map(result => result.payload.source)
    )
];

return answer;
}


module.exports = askQuestion;