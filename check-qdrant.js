const { QdrantClient } = require("@qdrant/js-client-rest");

const client = new QdrantClient({
    host: "localhost",
    port: 6333
});

async function check() {
    const result = await client.scroll("documents", {
        limit: 100,
        with_payload: true
    });

    console.log(JSON.stringify(result, null, 2));
}

check();