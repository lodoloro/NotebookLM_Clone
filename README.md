# NotebookLM_Clone

Repo to Host Dean Lockyers RAG Web App

A local-only NotebookLM style app. Upload PDFs and images, they get chunked and
embedded with Ollama, stored in Qdrant, and you can then ask questions that are
answered against your own documents. Nothing leaves your machine.

---

# Features

* Upload and delete documents
* Extract and process text from pdfs and images (OCR via Tesseract)
* Generate embeddings using Ollama (`nomic-embed-text`)
* Store document chunks in Qdrant
* Ask questions using local AI models (`llama3.2`)
* Retrieve answers based on uploaded documents
* Dragging and dropping
* Easy to use UI
* AI memory within a session

> Note on AI memory: the conversation history is kept in a single in-memory
> array in `server.js`. It is shared by everyone hitting the server and is lost
> on restart. It is not written to the database.

---

# Requirements

## Node.js

If you don't already have it, download and install Node.js:

https://nodejs.org/

### Check if its installed:

Run these two commands in the root folder:

```bash
node -v
```

```bash
npm -v
```

## Ollama

Install Ollama if you dont already have it:

https://ollama.com/

Run this in the root folder to download the required models:

```bash
ollama pull llama3.2
```

```bash
ollama pull nomic-embed-text
```

Ollama must be running on `http://localhost:11434` before you start the app.

## Qdrant

Download Qdrant:

https://qdrant.tech/

Once downloaded open the .exe file and it will by default run on port 6333.

---

# Installation

Clone the repo:

```bash
git clone <repository-url>
```

Then enter the project folder:

```bash
cd NotebookLM_Clone
```

Get node dependencies:

```bash
npm install
```

---

# Setup

## Create the qdrant collection

Run this:

```bash
node setup-qdrant.js
```

This creates the "documents" collection (768 dimensions, cosine distance) used
to store chunk vectors.

You only need to run this once.

## The SQLite database

`database.sqlite` is not committed to the repo (it is in `.gitignore`). It is
created automatically the first time you run the server, along with the
`documents` table.

If you are upgrading an existing database that was created before the
`filepath` column was added, run:

```bash
node test/add-column.js
```

Fresh installs do not need this.

---

# Running the app

Start the server:

```bash
node server.js
```

There is no `npm start` script, run the file directly.

Open the website in your browser by going to http://localhost:3000.

---

# Project structure

```
.
├── server.js               Express server, all routes, upload + OCR handling
├── rag2.js                 The RAG pipeline used by the app (embed, search, prompt Ollama)
├── database.js             SQLite connection and the documents table schema
├── chunker.js              Splits text into fixed 500 character chunks
├── upload-to-qdrant.js     Embeds chunks and upserts them into Qdrant
├── setup-qdrant.js         One time creation of the "documents" collection
├── search-qdrant.js        Standalone CLI: ask one question from the terminal
├── process-document.js     Standalone script: extract and chunk test/example.pdf
├── eng.traineddata         Tesseract English OCR data file (see note below)
├── package.json
│
├── public/                 Frontend, served statically by Express
│   ├── index.html          The app UI
│   ├── main.css            The app styles
│   ├── script.js           Fetch calls to /upload, /ask, /documents, /new-chat
│   ├── assets/             Images
│   ├── indexold.html       Unused, kept for reference
│   ├── mainclunkyold.css   Unused, kept for reference
│   └── uploads.html        Empty, unused
│
├── uploads/                Temporary upload dir, files are deleted after processing
│
└── test/                   Dev and debugging scripts, not needed to run the app
    ├── test-ollama.js      Check Ollama is reachable
    ├── test-qdrant.js      Check Qdrant is reachable
    ├── check-qdrant.js     Inspect what is stored in the collection
    ├── test-embedding.js   Generate a single embedding
    ├── test-chunks.js      Check the chunker output
    ├── test-rag.js         Exercise the RAG flow
    ├── rag.js              Older standalone copy of the RAG logic
    ├── insert-vector.js    Manually insert a point
    ├── delete-point.js     Delete a single point
    ├── delete-old-pdf.js   Delete points for an old document
    ├── add-column.js       Migration: add the filepath column
    ├── add-chat-table.js   Creates a messages table (currently unused by the app)
    ├── remove-chat-table.js
    └── example.pdf         Sample file
```

---

# API

| Method   | Route             | Purpose                                        |
| -------- | ----------------- | ---------------------------------------------- |
| `GET`    | `/documents`      | List uploaded documents                        |
| `POST`   | `/upload`         | Upload a pdf/png/jpg/jpeg/webp (field: `pdf`)  |
| `DELETE` | `/documents/:id`  | Delete a document from SQLite and Qdrant       |
| `POST`   | `/ask`            | Ask a question (`{ "question": "..." }`)       |
| `POST`   | `/new-chat`       | Clear the conversation history                 |

---

# Extras

### Test files

Testing files are in the `test` folder.

These are tools for checking Ollama, Qdrant, embeddings and RAG.

They are not required for normal usage.

### Behavior

If you want to change how the ai acts, mess with the prompt near the bottom of
`rag2.js`.

### eng.traineddata

The root `eng.traineddata` file is a Tesseract English OCR data file. Nothing in
the code currently points at it (`server.js` calls `Tesseract.recognize(path,
"eng")` with no `langPath` or `cachePath`), so tesseract.js resolves and caches
its own language data at runtime. The committed file is effectively unused.

### Chunk size

Chunks are a flat 500 characters with no overlap, set in `chunker.js`. If
answers are getting cut off mid sentence, that is the place to change.
