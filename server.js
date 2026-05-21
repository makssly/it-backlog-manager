require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// API Endpoints

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Get all tasks (Public)
app.get('/api/tasks', (req, res) => {
    const sql = "SELECT * FROM tasks ORDER BY CASE WHEN priority = 'high' THEN 1 ELSE 0 END DESC, created_at DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ tasks: rows });
    });
});

// Add a task (Admin only)
app.post('/api/tasks', authenticateToken, (req, res) => {
    const { title, description, status, priority, downtime } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const sql = 'INSERT INTO tasks (title, description, status, priority, downtime) VALUES (?, ?, ?, ?, ?)';
    const params = [title, description, status || 'planned', priority || 'low', downtime ? 1 : 0];
    
    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, title, description, status: status || 'planned', priority: priority || 'low', downtime: downtime ? 1 : 0 });
    });
});

// Update a task (Admin only)
app.put('/api/tasks/:id', authenticateToken, (req, res) => {
    const { title, description, status, priority, downtime } = req.body;
    const { id } = req.params;

    const sql = 'UPDATE tasks SET title = COALESCE(?, title), description = COALESCE(?, description), status = COALESCE(?, status), priority = COALESCE(?, priority), downtime = COALESCE(?, downtime) WHERE id = ?';
    const params = [title, description, status, priority, downtime, id];

    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ updated: this.changes });
    });
});

// Delete a task (Admin only)
app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM tasks WHERE id = ?', id, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ deleted: this.changes });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
