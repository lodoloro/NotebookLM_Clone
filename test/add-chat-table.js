const db = require("./database");

db.run(`
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`, (err) => {

    if(err){
        console.error(err);
    }
    else{
        console.log("Chat table created!");
    }

    db.close();

});