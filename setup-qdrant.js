const { QdrantClient } = require("@qdrant/js-client-rest");

const client = new QdrantClient({
    host: "localhost",
    port: 6333
});

async function setup() {
    const collections = await client.getCollections();

    const exists = collections.collections.some(
        collection => collection.name === "documents"
    );

    if (exists) {
        console.log("Collection already exists");
        return;
    }

    await client.createCollection("documents", {
        vectors: {
            size: 768,
            distance: "Cosine"
        }
    });

    console.log("Collection created");
}

setup();