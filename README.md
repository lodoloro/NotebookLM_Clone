# NotebookLM_Clone
Repo to Host Dean Lockyers Offline RAG Web App

## Welcome!
This is my Offline ai document assistant web app

### Why offline?
Offline means greater security and means that its harder for other people to access

---

# Features

* Upload and delete documents
* Extract and process text from pdfs and images
* Generate embeddings using Ollama
* Store documents in Qdrant
* Ask questions using local AI models
* Retrieve answers based only on uploaded documents
* Dragging and dropping
* Easy to use UI
* Ai memory
* Camera Option

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

If they are installed it should give you some version numbers as an output

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

Make sure Ollama is running before starting the app.

## Qdrant

Download Qdrant:

https://qdrant.tech/

Once downloaded open the .exe file and it will by default run on port 6333

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

This creates the "documents" collection used to store documents.

You only need to run this once.

---

# Running the app

Start the server:

```bash
node server.js
```

Open the website in your browser by going to localhost:3000.

---

# Extras

### Test files

Testing files are in the test folder

These are tools for checking Ollama, Qdrant, embeddings and RAG

They are not required for normal usage.

### Behavior

If you want to change how the ai acts, mess with the prompt near the bottom of rag2.js
