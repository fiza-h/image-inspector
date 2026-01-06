// server/services/googleSheet.js
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const { google } = require("googleapis");

class GoogleSheetService {
    constructor() {
        this.sheetId = process.env.SHEET_ID;
        this.sheetTab = process.env.SHEET_TAB || "Sheet1"; // <-- set this to your actual tab name

        // Credentials: Vercel env var JSON OR local credentials.json
        if (process.env.GOOGLE_CREDENTIALS) {
            try {
                const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS);
                this.serviceAccountEmail = creds.client_email;
                this.privateKey = creds.private_key;
            } catch (error) {
                console.error("Failed to parse GOOGLE_CREDENTIALS environment variable");
            }
        } else {
            this.credsPath = path.join(__dirname, "../credentials.json");
            if (fs.existsSync(this.credsPath)) {
                const creds = require(this.credsPath);
                this.serviceAccountEmail = creds.client_email;
                this.privateKey = creds.private_key;
            } else {
                console.error("credentials.json not found in server directory");
            }
        }

        if (!this.sheetId) console.error("SHEET_ID is missing from env");
    }

    getAuthClient() {
        if (!this.serviceAccountEmail || !this.privateKey) {
            throw new Error("Missing Google credentials");
        }

        // IMPORTANT: Vercel env strings often store newlines as \\n
        const key = this.privateKey.replace(/\\n/g, "\n");

        return new google.auth.JWT({
            email: this.serviceAccountEmail,
            key,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
    }

    async addVote(data, tabName) {
        console.log('[DEBUG] addVote called with:', JSON.stringify(data), 'Tab:', tabName);
        const auth = this.getAuthClient();
        const sheets = google.sheets({ version: "v4", auth });
        const targetTab = tabName || this.sheetTab;

        // Must match your sheet columns order (recommended headers):
        // timestamp | user_name | filename | explicit_selected | moderate_selected | no_leak_selected | comments
        const row = [
            new Date().toISOString(),
            data.user_name ?? "",
            data.filename ?? "",
            data.explicit_selected ?? "",
            data.moderate_selected ?? "",
            data.no_leak_selected ?? "",
            data.comments ?? "",
        ];

        console.log('[DEBUG] Appending row to Sheets:', JSON.stringify(row));

        await sheets.spreadsheets.values.append({
            spreadsheetId: this.sheetId,
            range: `${targetTab}!A1`,
            valueInputOption: "RAW",
            insertDataOption: "INSERT_ROWS",
            requestBody: { values: [row] },
        });

        return true;
    }
}

module.exports = new GoogleSheetService();