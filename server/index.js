const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

/**
 * STATIC ASSETS
 * Images are served directly from public/
 * (JSON is fetched directly by frontend, not via API)
 */
app.use(
    '/images',
    express.static(path.join(__dirname, '../client/public/data/jpg'))
);

/**
 * DEBUG (SAFE)
 * Confirms public data is visible on Vercel
 */
app.get('/api/debug', (req, res) => {
    const PUBLIC_DATA_DIR = path.join(__dirname, '../client/public/data');
    res.json({
        cwd: process.cwd(),
        dirname: __dirname,
        publicDataDir: PUBLIC_DATA_DIR,
        exists: require('fs').existsSync(PUBLIC_DATA_DIR),
        contents: require('fs').existsSync(PUBLIC_DATA_DIR)
            ? require('fs').readdirSync(PUBLIC_DATA_DIR)
            : 'Public data dir not found'
    });
});

/**
 * GET VOTES
 * Returns empty array if using Google Sheets (as we don't read back yet)
 * or facilitates migration.
 */
app.get('/api/votes/:filename', (req, res) => {
    res.json([]);
});

/**
 * SAVE VOTE
 * This is the ONLY endpoint that needs a server
 */
app.post('/api/vote', async (req, res) => {
    const {
        user_name,
        filename,
        explicit_selected,
        moderate_selected,
        no_leak_selected,
        comments,
        dataset // 'pipeline_output' or 'irtiza_output'
    } = req.body;

    console.log('[DEBUG] Vote Request Body:', JSON.stringify(req.body, null, 2));

    if (!user_name || !filename) {
        console.error('[DEBUG] Missing required fields:', { user_name, filename });
        return res.status(400).json({ error: 'Missing user_name or filename' });
    }

    let googleSheetService;
    try {
        // ✅ Lazy load (prevents Vercel crash)
        googleSheetService = require('./services/googleSheet');
    } catch (err) {
        console.error('Google Sheets init failed:', err);
        return res.status(500).json({
            error: 'Server misconfigured',
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
            envVars: {
                hasGoogleCreds: !!process.env.GOOGLE_CREDENTIALS,
                sheetId: process.env.SHEET_ID
            }
        });
    }

    try {
        // Map dataset to Tab Name
        // pipeline_output -> defaults to env SHEET_TAB or "Sheet1"
        // irtiza_output   -> "OG Gemini Selected"
        let targetTab = undefined;
        if (dataset === 'irtiza_output') {
            targetTab = 'OG_GEMINI_SELECTED'; // Use snake_case or whatever the user made the tab name. User said "responses from og gemini selected will be saved in a new google sheet tab". I'll assume standard naming or ask. 
            // Actually, spaces in tab names are annoying in API. User said "OG Gemini Selected".
            targetTab = "OG Gemini Selected";
        }

        await googleSheetService.addVote({
            user_name,
            filename,
            explicit_selected,
            moderate_selected,
            no_leak_selected,
            comments
        }, targetTab);

        res.json({
            success: true,
            receivedData: {  // ECHO BACK FOR DEBUGGING
                user_name,
                filename,
                dataset,
                explicit_selected_len: explicit_selected ? explicit_selected.length : 0,
                targetTab
            }
        });
    } catch (err) {
        console.error('Error writing vote:', err);
        res.status(500).json({
            error: 'Failed to write vote',
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

/**
 * LOCAL DEV ONLY
 */
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
