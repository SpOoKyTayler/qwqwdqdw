const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Statische Dateien aus public-Ordner bereitstellen
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = './data.json';

// Hilfsfunktionen für Daten laden/speichern
function loadData() {
    if (!fs.existsSync(DATA_FILE)) return { users: [], dienste: [] };
    const raw = fs.readFileSync(DATA_FILE);
    return JSON.parse(raw);
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API-Routen
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const data = loadData();
    const user = data.users.find(u => u.username === username && u.password === password);
    if (user) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Login fehlgeschlagen' });
    }
});

app.get('/api/dienste', (req, res) => {
    const data = loadData();
    res.json(data.dienste);
});

app.post('/api/dienste', (req, res) => {
    const { username, date, shift } = req.body;
    const data = loadData();
    const newDienst = {
        id: Date.now(),
        username,
        date,
        shift,
        status: 'confirmed',
        vertretung: null
    };
    data.dienste.push(newDienst);
    saveData(data);
    res.json(newDienst);
});

app.post('/api/krankmelden', (req, res) => {
    const { dienstId } = req.body;
    const data = loadData();
    const dienst = data.dienste.find(d => d.id === dienstId);
    if (dienst) {
        dienst.status = 'sick';
        saveData(data);
        res.json(dienst);
    } else {
        res.status(404).json({ error: 'Dienst nicht gefunden' });
    }
});

app.post('/api/vertretung', (req, res) => {
    const { dienstId, username } = req.body;
    const data = loadData();
    const dienst = data.dienste.find(d => d.id === dienstId);
    if (dienst && dienst.status === 'sick') {
        dienst.vertretung = username;
        dienst.status = 'replaced';
        saveData(data);
        res.json(dienst);
    } else {
        res.status(400).json({ error: 'Dienst nicht gefunden oder nicht krank' });
    }
});

// Fallback → index.html für alle unbekannten Routen (außer API)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server starten
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
