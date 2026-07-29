const { QdrantClient } = require("@qdrant/js-client-rest");

const client = new QdrantClient({
    host: "localhost",
    port: 6333
});

async function deletePoint() {

    await client.delete("documents", {
        points: [1]
    });

    console.log("Deleted point");
}

deletePoint();