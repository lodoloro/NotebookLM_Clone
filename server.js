const express = require("express");
const path = require("path");
const db = require("./database");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");
const fs = require("fs");
const askQuestion = require("./rag2");
const uploadToQdrant = require("./upload-to-qdrant");
const { QdrantClient } = require("@qdrant/js-client-rest");
const Tesseract = require("tesseract.js");


let conversationHistory = [];

const qdrant = new QdrantClient({
    host: "localhost",
    port: 6333
});

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "./public")));
app.use("/uploads", express.static("uploads"));


// Home
app.get("/", (req, res) => {
    res.send("AI backend is running!");
});

db.all("SELECT * FROM documents", [], (err, rows) => {
    console.log(rows);
});


// Show documents
app.get("/documents", (req, res) => {

    db.all(
        "SELECT id, filename, filepath FROM documents",
        [],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(rows);
        }
    );

});

app.get("/documents/:id", (req, res) => {

    db.get(
        "SELECT * FROM documents WHERE id = ?",
        [req.params.id],
        (err, row) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            if (!row) {

                return res.status(404).json({
                    error: "Document not found"
                });

            }

            res.json(row);

        }
    );

});

app.delete("/documents/:id", async (req, res) => {

    const id = req.params.id;


    db.get(
        "SELECT filename, filepath FROM documents WHERE id = ?",
        [id],
        async (err, row) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }


            if (!row) {
                return res.status(404).json({
                    error: "Document not found"
                });
            }


            try {

                // Delete chunks from Qdrant
await qdrant.delete("documents", {
    filter: {
        should: [
            {
                key: "source",
                match: {
                    value: row.filename
                }
            },
            {
                key: "source",
                match: {
                    value: "./" + row.filename
                }
            }
        ]
    }
});


if (row.filepath && fs.existsSync(row.filepath)) {
    fs.unlinkSync(row.filepath);
}

                // Delete from SQLite
                db.run(
                    "DELETE FROM documents WHERE id = ?",
                    [id],
                    function(err) {

                        if (err) {
                            return res.status(500).json({
                                error: err.message
                            });
                        }


                        res.json({
                            message: `${row.filename} deleted successfully`
                        });

                    }
                );


            } catch(error) {

                console.error(error);

                res.status(500).json({
                    error: error.message
                });

            }

        }
    );

});


// Ask AI using RAG
app.post("/ask", async (req, res) => {

    try {

        const question = req.body.question;

const answer = await askQuestion(
    question,
    conversationHistory
);



        conversationHistory.push({
            role: "user",
            content: question
        });

conversationHistory.push({
    role: "assistant",
    content: answer
});

res.json({
    answer
});

        console.log(conversationHistory);



    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

});


// Upload PDF
const crypto = require("crypto");

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, "uploads/");

    },

    filename: (req, file, cb) => {

        const uniqueName =
            crypto.randomBytes(16).toString("hex") +
            path.extname(file.originalname);

        cb(null, uniqueName);

    }

});

const upload = multer({
    storage
});


app.post("/upload", upload.single("pdf"), async (req, res) => {

    try {

        const extension = path.extname(req.file.originalname).toLowerCase();

let extractedText = "";

if (extension === ".pdf") {

    const dataBuffer = fs.readFileSync(req.file.path);

    const parser = new PDFParse({
        data: dataBuffer
    });

    const pdfData = await parser.getText();

    extractedText = pdfData.text;

    await parser.destroy();

}
else if (
    [".png", ".jpg", ".jpeg", ".webp"]
        .includes(extension)
) {

    const result = await Tesseract.recognize(
        req.file.path,
        "eng"
    );

    extractedText = result.data.text;

}
else {

    return res.status(400).json({
        error: "Unsupported file type."
    });

}

console.log("Extracted text:");
console.log(extractedText);
db.run(
    "INSERT INTO documents (filename, content, filepath) VALUES (?, ?, ?)",
    [
        req.file.originalname,
        extractedText,
        req.file.path
    ],
            async function (err) {

                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }


                const documentId = this.lastID;

                


await uploadToQdrant(
    extractedText,
    req.file.originalname,
    documentId
);
                //fs.unlinkSync(req.file.path); this deletes after processing


                res.json({
                    message: "PDF uploaded successfully"
                });

            }
        );


    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

});


app.post("/new-chat", (req, res) => {

    conversationHistory.length = 0;

    res.json({
        message: "Conversation cleared."
    });

});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});