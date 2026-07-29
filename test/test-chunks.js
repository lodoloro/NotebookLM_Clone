const chunkText = require("./rag");

const text = `
This is a very long document.
It contains information about company policies.
Employees receive vacation time every year.
The company uses AI systems internally.
`;

const chunks = chunkText(text);

console.log(chunks);