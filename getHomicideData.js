const { google } = require('googleapis');
const fs = require('fs');

exports.handler = async function(event, context) {
  try {
    const credentials = JSON.parse(fs.readFileSync('./service-account.json'));
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const spreadsheetId = '1uvWaEjlmj8PwBdWQRLAcCccF_ZsU7bt8_TAN7hRPuaE';
    const range = "'Copy of Sheet1 1'!A1:Z1000";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
};
