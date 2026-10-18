/**
 * Google Drive API Client
 * Handles saving content to Google Drive (Docs, Sheets, etc.)
 */

import { google } from 'googleapis';

let driveClient: any = null;

/**
 * Initialize Google Drive client
 */
function getDriveClient() {
    if (driveClient) {
        return driveClient;
    }
    
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        throw new Error('Google Service Account key not configured');
    }
    
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/documents',
            'https://www.googleapis.com/auth/spreadsheets'
        ]
    });
    
    driveClient = google.drive({ version: 'v3', auth });
    return driveClient;
}

/**
 * Save content to Google Drive
 */
export async function saveToGoogleDrive(options: {
    name: string;
    type: 'document' | 'spreadsheet';
    content: any;
    folderId?: string;
}): Promise<{ fileId: string; url: string }> {
    try {
        const drive = getDriveClient();
        
        // Create file metadata
        const fileMetadata: any = {
            name: options.name,
            mimeType: options.type === 'document' 
                ? 'application/vnd.google-apps.document'
                : 'application/vnd.google-apps.spreadsheet'
        };
        
        if (options.folderId) {
            fileMetadata.parents = [options.folderId];
        }
        
        // Create the file
        const file = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id, webViewLink'
        });
        
        const fileId = file.data.id!;
        
        // Update file content
        if (options.type === 'document') {
            await updateGoogleDoc(fileId, options.content);
        } else if (options.type === 'spreadsheet') {
            await updateGoogleSheet(fileId, options.content);
        }
        
        return {
            fileId,
            url: file.data.webViewLink || `https://docs.google.com/${options.type === 'document' ? 'document' : 'spreadsheets'}/d/${fileId}`
        };
        
    } catch (error: any) {
        console.error('Error saving to Google Drive:', error);
        throw new Error(`Failed to save to Google Drive: ${error.message}`);
    }
}

/**
 * Update Google Doc content
 */
async function updateGoogleDoc(fileId: string, content: any): Promise<void> {
    const docs = google.docs({ version: 'v1', auth: getDriveClient().auth });
    
    // Convert content to Google Docs format
    const requests = [];
    
    if (typeof content === 'string') {
        // Plain text content
        requests.push({
            insertText: {
                location: { index: 1 },
                text: content
            }
        });
    } else if (content.title || content.content) {
        // Structured content
        if (content.title) {
            requests.push({
                insertText: {
                    location: { index: 1 },
                    text: content.title + '\n\n'
                }
            });
        }
        if (content.content) {
            requests.push({
                insertText: {
                    location: { index: 1 },
                    text: content.content
                }
            });
        }
    }
    
    if (requests.length > 0) {
        await docs.documents.batchUpdate({
            documentId: fileId,
            requestBody: {
                requests
            }
        });
    }
}

/**
 * Update Google Sheet content
 */
async function updateGoogleSheet(fileId: string, data: any): Promise<void> {
    const sheets = google.sheets({ version: 'v4', auth: getDriveClient().auth });
    
    // Convert data to sheet format
    const values: any[][] = [];
    
    if (Array.isArray(data)) {
        // Array of rows
        values.push(...data);
    } else if (typeof data === 'object') {
        // Object with headers and rows
        if (data.headers) {
            values.push(data.headers);
        }
        if (data.rows) {
            values.push(...data.rows);
        }
    }
    
    if (values.length > 0) {
        await sheets.spreadsheets.values.update({
            spreadsheetId: fileId,
            range: 'A1',
            valueInputOption: 'RAW',
            requestBody: {
                values
            }
        });
    }
}



