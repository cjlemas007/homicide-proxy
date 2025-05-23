const { google } = require('googleapis');

exports.handler = async function (event, context) {
  try {
    // Load credentials from Netlify environment variable
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    // Set up authentication with Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Your actual spreadsheet ID and tab range
    const spreadsheetId = '1uvWaEjlmj8PwBdWQRLAcCccF_ZsU7bt8_TAN7hRPuaE';
    const range = "'Copy of Sheet1 1'!A1:Z1000";

    // Pull the data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No data found." }),
      };
    }

    // Return data as JSON
    return {
      statusCode: 200,
      body: JSON.stringify({
        headers: rows[0],
        entries: rows.slice(1),
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    console.error("Google Sheets API error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch homicide data" }),
    };
  }
};
