const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

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

    db.run(`
        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            title TEXT NOT NULL,
            genres TEXT NOT NULL,
            url TEXT NOT NULL,
            imageUrl TEXT NOT NULL,
            FOREIGN KEY (userId) REFERENCES users(id)
        )
    `);
});

// API Endpoints

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

// Get user's games
app.get('/games/:userId', (req, res) => {
    const userId = req.params.userId;

    db.all(
        'SELECT * FROM games WHERE userId = ?',
        [userId],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(rows);
        }
    );
});

// Upload a game
app.post('/games', (req, res) => {
    const { userId, title, genres, url, imageUrl } = req.body;

    db.run(
        'INSERT INTO games (userId, title, genres, url, imageUrl) VALUES (?, ?, ?, ?, ?)',
        [userId, title, genres, url, imageUrl],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ id: this.lastID });
        }
    );
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
