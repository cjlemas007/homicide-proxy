const { google } = require('googleapis');

exports.handler = async function (event, context) {
  const token = event.queryStringParameters.key;
  const validToken = process.env.ACCESS_TOKEN;
  const allowedReferer = "https://your-dashboard-site.com"; // Replace with your actual domain

  // Block if no token or incorrect token
  if (token !== validToken) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Unauthorized – invalid token" }),
    };
  }

  // Block if request isn't coming from your site
  const referer = event.headers.referer || "";
  if (!referer.startsWith(allowedReferer)) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Unauthorized – invalid referer" }),
    };
  }

  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

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

    const rows = response.data.values || [];

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
