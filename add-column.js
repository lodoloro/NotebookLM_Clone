const db = require("./database");

db.run(
    "ALTER TABLE documents ADD COLUMN filepath TEXT",
    (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log("filepath column added!");
        }

        db.close();
    }
);