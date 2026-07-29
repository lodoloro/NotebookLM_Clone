const db = require("./database");

db.run(
    "DROP TABLE IF EXISTS messages",
    (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log("Chat table removed!");
        }

        db.close();
    }
);