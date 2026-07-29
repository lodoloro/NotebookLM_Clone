const { QdrantClient } = require("@qdrant/js-client-rest");

const client = new QdrantClient({
    host: "localhost",
    port: 6333
});

async function test() {
    const collections = await client.getCollections();

    console.log(collections);
}

test();