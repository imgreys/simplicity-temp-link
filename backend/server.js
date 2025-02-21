const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000; // Use Render's provided port

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Connect to SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Create tables if they don't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            profilePicture TEXT
        )
    `);
});

// Register a new user
app.post('/register', (req, res) => {
    const { username, password, profilePicture } = req.body;

    db.run(
        'INSERT INTO users (username, password, profilePicture) VALUES (?, ?, ?)',
        [username, password, profilePicture],
        function (err) {
            if (err) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            res.json({ id: this.lastID });
        }
    );
});

// Login a user
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [username, password],
        (err, row) => {
            if (err || !row) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }
            res.json(row);
        }
    );
});

// Change username
app.post('/change-username', (req, res) => {
    const { userId, newUsername } = req.body;

    db.run(
        'UPDATE users SET username = ? WHERE id = ?',
        [newUsername, userId],
        function (err) {
            if (err) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            res.json({ success: true });
        }
    );
});

// Change profile picture
app.post('/change-profile-picture', (req, res) => {
    const { userId, newProfilePicture } = req.body;

    db.run(
        'UPDATE users SET profilePicture = ? WHERE id = ?',
        [newProfilePicture, userId],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ success: true });
        }
    );
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
