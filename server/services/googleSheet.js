const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

class GoogleSheetService {
    constructor() {
        this.sheetId = process.env.SHEET_ID;
        // Check for credentials in environment variable (for Vercel) or file (local)
        if (process.env.GOOGLE_CREDENTIALS) {
            try {
                const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS);
                this.serviceAccountEmail = creds.client_email;
                this.privateKey = creds.private_key;
            } catch (error) {
                console.error('Failed to parse GOOGLE_CREDENTIALS environment variable');
            }
        } else {
            this.credsPath = path.join(__dirname, '../credentials.json');
            if (fs.existsSync(this.credsPath)) {
                const creds = require(this.credsPath);
                this.serviceAccountEmail = creds.client_email;
                this.privateKey = creds.private_key;
            } else {
                console.error('credentials.json not found in server directory');
            }
        }

        if (!this.sheetId) {
            console.error('SHEET_ID is missing from .env');
        }
    }

    async getDoc() {
        if (!this.serviceAccountEmail || !this.privateKey) {
            throw new Error('Missing Google credentials');
        }

        const serviceAccountAuth = new JWT({
            email: this.serviceAccountEmail,
            key: this.privateKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(this.sheetId, serviceAccountAuth);
        await doc.loadInfo();
        return doc;
    }

    async addVote(data) {
        try {
            const doc = await this.getDoc();
            const sheet = doc.sheetsByIndex[0];

            // Add timestamp
            const row = {
                timestamp: new Date().toISOString(),
                ...data
            };

            await sheet.addRow(row);
            console.log('Vote added to Google Sheet');
            return true;
        } catch (error) {
            console.error('Error adding vote to Google Sheet:', error);
            throw error;
        }
    }
}

module.exports = new GoogleSheetService();
