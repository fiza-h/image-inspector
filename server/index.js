const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');
const googleSheetService = require('./services/googleSheet');
require('dotenv').config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Paths
// Paths
const DATA_DIR = path.resolve(__dirname, '../data');
const OUTPUT_DIR = path.join(DATA_DIR, 'pipeline_output');
const IMAGES_DIR = path.join(DATA_DIR, 'jpg');
const VOTES_FILE = path.join(DATA_DIR, 'votes.csv');

// Serve images
app.use('/images', express.static(IMAGES_DIR));

// Get list of JSON files
app.get('/api/files', (req, res) => {
    fs.readdir(OUTPUT_DIR, (err, files) => {
        if (err) {
            console.error('Error reading output directory:', err);
            return res.status(500).json({ error: 'Failed to read directory' });
        }
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        res.json(jsonFiles);
    });
});

// Get content of a JSON file
app.get('/api/file/:filename', (req, res) => {
    const filename = req.params.filename;
    // Basic security check
    if (filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(OUTPUT_DIR, filename);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading file ${filename}:`, err);
            return res.status(500).json({ error: 'Failed to read file' });
        }
        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (parseErr) {
            console.error(`Error parsing JSON for ${filename}:`, parseErr);
            res.status(500).json({ error: 'Failed to parse JSON' });
        }
    });
});

// Save vote
app.post('/api/vote', async (req, res) => {
    const {
        user_name,
        filename,
        explicit_selected,
        moderate_selected,
        no_leak_selected,
        comments
    } = req.body;

    if (!filename || !user_name) {
        return res.status(400).json({ error: 'Missing filename or user_name' });
    }

    try {
        await googleSheetService.addVote({
            user_name,
            filename,
            explicit_selected,
            moderate_selected,
            no_leak_selected,
            comments
        });
        res.json({ success: true });
    } catch (err) {
        console.error('Error writing to Google Sheet:', err);
        res.status(500).json({ error: 'Failed to write to Google Sheet' });
    }
});

// Helper to parse CSV manually since we don't want to add deps
function parseCSV(content) {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return []; // Header only or empty

    const headers = lines[0].split(',').map(h => h.trim());

    // Simple parser that handles basic quotes
    const parseLine = (line) => {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current);
        return values;
    };

    return lines.slice(1).map(line => {
        const values = parseLine(line);
        return headers.reduce((obj, header, index) => {
            // Clean matched quotes if wrapped
            let val = values[index] || '';
            // If csv-writer adds quotes, we might want to strip them if they are outer wrappers?
            // csv-writer usually adds quotes if needed.
            // Our parseLine handles splitting correctly.
            // We might have explicit quotes in the value itself?
            // Let's assume values are clean strings for now.
            obj[header] = val;
            return obj;
        }, {});
    });
}

// Get votes for a file
app.get('/api/votes/:filename', (req, res) => {
    const filename = req.params.filename;

    if (!fs.existsSync(VOTES_FILE)) {
        return res.json([]);
    }

    fs.readFile(VOTES_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading votes file:', err);
            return res.status(500).json({ error: 'Failed to read votes file' });
        }

        try {
            const allVotes = parseCSV(data);
            const fileVotes = allVotes.filter(v => v.filename === filename);
            res.json(fileVotes);
        } catch (parseErr) {
            console.error('Error parsing votes CSV:', parseErr);
            res.status(500).json({ error: 'Failed to parse votes CSV' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
