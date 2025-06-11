import sqlite3 from 'sqlite3';

const dbPath = 'src/db/agent-task-manager.sqlite';

function verifySeed() {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error("Error opening database:", err.message);
            return;
        }
        console.log("Connected to the database.");

        db.all("SELECT * FROM user", [], (err, users) => {
            if (err) {
                console.error("Error querying users:", err.message);
                db.close();
                return;
            }
            console.log("Users:", JSON.stringify(users, null, 2));

            db.all("SELECT * FROM issue", [], (err, issues) => {
                if (err) {
                    console.error("Error querying issues:", err.message);
                    db.close();
                    return;
                }
                console.log("Issues:", JSON.stringify(issues, null, 2));

                db.close((err) => {
                    if (err) {
                        console.error("Error closing database:", err.message);
                        return;
                    }
                    console.log("Database connection closed.");
                });
            });
        });
    });
}

verifySeed();
