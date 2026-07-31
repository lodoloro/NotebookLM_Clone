const fs = require("fs");
const { PDFParse } = require("pdf-parse");
const chunkText = require("./chunker");


async function extractPDF(path) {

    const dataBuffer = fs.readFileSync(path);

    const parser = new PDFParse({
        data: dataBuffer
    });

    const result = await parser.getText();

    const chunks = chunkText(result.text);

    console.log("Number of chunks:", chunks.length);

    console.log(chunks);

    await parser.destroy();
}


extractPDF("./test/example.pdf");