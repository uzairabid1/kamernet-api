const sqlite3 = require('sqlite3').verbose();

async function setupDatabase() {
    // Open a SQLite database (create it if not exists)
    const db = new sqlite3.Database('listings.db');

    // Create a table if it doesn't exist
    return new Promise((resolve, reject) => {
        db.run('CREATE TABLE IF NOT EXISTS listings (username TEXT, url TEXT)', (err) => {
            db.close();
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}


async function checkIfListingExists(db, username, url) {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) AS count FROM listings WHERE username = ? AND url = ?', [username, url], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row.count > 0);
            }
        });
    });
}

async function insertListing(db, username, url) {
    return new Promise(async (resolve, reject) => {
        const isExisting = await checkIfListingExists(db, username, url);

        if (!isExisting) {
            db.run('INSERT INTO listings (username, url) VALUES (?, ?)', [username, url], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        } else {
            resolve(); // URL already exists, resolve without inserting
        }
    });
}

module.exports = {checkIfListingExists, insertListing, setupDatabase};