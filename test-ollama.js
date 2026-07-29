const axios = require("axios");

async function askAI() {
    try {
        const response = await axios.post(
            "http://localhost:11434/api/generate",
            {
                model: "llama3.2:latest",
                prompt: "Explain what Node.js is in one sentence.",
                stream: false
            }
        );

        console.log(response.data.response);
    } catch (error) {
        console.error(error.message);
    }
}

askAI();