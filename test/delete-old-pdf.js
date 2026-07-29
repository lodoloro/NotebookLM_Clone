const { QdrantClient } = require("@qdrant/js-client-rest");

const client = new QdrantClient({
    host: "localhost",
    port: 6333
});

async function remove() {

    await client.delete("documents", {
        points: [
            1784651249696
        ]
    });

    console.log("Deleted old PDF chunk");
}

remove();