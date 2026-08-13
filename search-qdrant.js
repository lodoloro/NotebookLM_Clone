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

    // Check if the user mentioned a specific uploaded filename
    const filenameMatch = question.match(
        /[\w\s-]+\.(pdf|png|jpg|jpeg|webp)/i
    );

    const requestedFilename = filenameMatch
        ? filenameMatch[0].trim()
        : null;

    let results;

    if (requestedFilename) {

        console.log("Looking for document:", requestedFilename);

        // Search directly for chunks belonging to that document
        const scrollResult = await client.scroll("documents", {
            filter: {
                must: [
                    {
                        key: "source",
                        match: {
                            value: requestedFilename
                        }
                    }
                ]
            },
            limit: 20,
            with_payload: true
        });

        results = scrollResult.points;
        console.log("Requested filename:", requestedFilename);
console.log("Matching Qdrant results:", results.length);

results.forEach(result => {
    console.log("Qdrant source:", result.payload.source);
});

    } else {

        // Normal semantic/vector search
        const questionVector = await createEmbedding(question);

        results = await client.search("documents", {
            vector: questionVector,
            limit: 3,
            with_payload: true
        });

    }

    const context = results
        .map(result => {
            return `[Document: ${result.payload.source}]\n${result.payload.text}`;
        })
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
You are Bay Roberts AI, a helpful assistant.

Use the uploaded documents as your primary source of information.

If the user asks about a specific document by filename, use the content belonging to that document.

Document filenames shown as [Document: filename] are authoritative.

Do not invent information that isn't contained in the documents.

If the relevant document does not contain enough information to answer the question, say so.

Do not mention retrieval, embeddings, Qdrant, or the process used to find the information unless the user asks.

Context:

${context}

Question:

${question}

Give a direct, natural answer.
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