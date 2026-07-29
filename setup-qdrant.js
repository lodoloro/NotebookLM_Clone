const { QdrantClient } = require("@qdrant/js-client-rest");

const client = new QdrantClient({
    host: "localhost",
    port: 6333
});

async function setup() {
    await client.createCollection("documents", {
        vectors: {
            size: 768,
            distance: "Cosine"
        }
    });

    console.log("Collection created");
}

setup();