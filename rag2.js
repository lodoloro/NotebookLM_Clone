const axios = require("axios");
const { QdrantClient } = require("@qdrant/js-client-rest");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(
    path.join(__dirname, "database.sqlite")
);

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

    let results = [];

    // Get all uploaded document filenames
    const documents = await new Promise((resolve, reject) => {

        db.all(
            "SELECT id, filename FROM documents",
            [],
            (err, rows) => {

                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }

            }
        );

    });


    // Normalize text for easier filename matching
    const normalizedQuestion = question
        .toLowerCase()
        .replace(/[_-]/g, " ")
        .replace(/[^\w\s.]/g, "")
        .trim();


    // Find a document whose filename is mentioned in the question
    let requestedDocument = null;

    for (const document of documents) {

        const filenameWithoutExtension = path
            .parse(document.filename)
            .name
            .toLowerCase()
            .replace(/[_-]/g, " ")
            .trim();

        const fullFilename = document.filename
            .toLowerCase()
            .replace(/[_-]/g, " ")
            .trim();


        if (
            normalizedQuestion.includes(fullFilename) ||
            normalizedQuestion.includes(filenameWithoutExtension)
        ) {

            requestedDocument = document;
            break;

        }

    }


    if (requestedDocument) {

        console.log(
            "Document mentioned in question:",
            requestedDocument.filename
        );

        console.log(
            "Document ID:",
            requestedDocument.id
        );


        // Retrieve all chunks belonging to this document
        const scrollResult = await client.scroll(
            "documents",
            {
                filter: {
                    must: [
                        {
                            key: "documentId",
                            match: {
                                value: requestedDocument.id
                            }
                        }
                    ]
                },

                limit: 100,

                with_payload: true
            }
        );


        results = scrollResult.points;


    } else {

        // Normal semantic/vector search
        const questionVector = await createEmbedding(question);


        results = await client.search(
            "documents",
            {
                vector: questionVector,

                limit: 3,

                with_payload: true
            }
        );

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

IMPORTANT DOCUMENT RULES:

- Always consider the provided document context before answering.
- When the user's question is related to information in the uploaded documents, use that information as the primary source of truth.
- If the uploaded documents contain useful information about the question, prioritize that information in your answer.
- You may supplement relevant document information with general knowledge when appropriate, as long as it does not conflict with the documents.
- If the uploaded documents contain nothing useful or relevant to the question, answer the question normally using your general knowledge.
- Do not force an unrelated document into an answer.
- Do not assume that every question must be answered using the uploaded documents.
- Do not say that you couldn't find something in the documents when the question is clearly unrelated to the documents.
- If the user changes topics, answer the new topic normally using your general knowledge.
- If the user asks about a specific uploaded document, prioritize that document's content.
- Do not invent information that is not supported by the documents or your general knowledge.

IMAGE AND OCR RULES:

- Uploaded images may contain OCR-extracted text.
- Treat OCR text as the text contained in the image.
- If the user asks "what does the image say", "what does it say", or similar, provide the actual OCR text directly.
- Do not paraphrase, interpret, or summarize OCR text unless the user asks for an explanation or summary.
- Do not add assumptions about organizations, people, events, acronyms, or meanings that are not explicitly present in the OCR text.
- If the OCR text is short, give the complete OCR text.
- If the user asks "what is in the image", describe what can be determined from the available OCR text, but do not invent visual details.
- Do not say that you cannot read an image when OCR text is available.

RESPONSE STYLE:

- Do not create categories or bullet points for information that is missing from the documents.
- Do not say "not specified", "not mentioned", "not provided", or similar phrases unless the user specifically asks what information is missing.
- Only include information that is relevant to answering the user's question.
- Do not pad the response with unavailable information.
- Do not unnecessarily summarize the document.
- Give a direct, natural answer.
- Do not mention retrieval, embeddings, Qdrant, SQLite, or the process used to find information unless the user asks.

Context:

${context}

Question:

${question}

Answer the question directly.
`
        }
    );


    console.log("AI:");
    console.log(response.data.response);

    return response.data.response;
}


module.exports = askQuestion;