const { google } = require('googleapis');

exports.handler = async function (event, context) {
  const token = event.queryStringParameters.key;
  const validToken = process.env.ACCESS_TOKEN;

  // IMPORTANT: Replace with your actual dashboard's domain(s)
  // For testing with the userContent.goog URL, add it here.
  // For local file testing, the referer might be null or empty.
  const allowedReferers = [
    "https://homicide-proxy.netlify.app", // Your final production domain
    "https://3iqdkqieqb7ggx9tw2gdqfdxozg37yfpc7mydjayz9cnswxyyn-h755382408.scf.usercontent.goog", // The usercontent.goog domain
    // Add http://localhost:xxxx if you test with a local server
  ];
  const currentReferer = event.headers.referer || "";

  // Standard headers for all responses, including errors
  const responseHeaders = {
    'Access-Control-Allow-Origin': '*', // Or be more specific with allowedReferers[0] if you only want one
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (token !== validToken) {
    console.warn("Access denied: Invalid token provided.");
    return {
      statusCode: 403,
      headers: responseHeaders,
      body: JSON.stringify({ error: "Unauthorized – invalid token" }),
    };
  }

  // For more flexible referer checking, especially during development
  let isRefererAllowed = false;
  if (!currentReferer) { // Allows testing from local file:/// (null origin often has no referer)
      console.log("Referer not present, allowing for local testing.");
      isRefererAllowed = true; 
  } else {
      for (const allowed of allowedReferers) {
          if (currentReferer.startsWith(allowed)) {
              isRefererAllowed = true;
              break;
          }
      }
  }

  if (!isRefererAllowed) {
    console.warn(`Access denied: Invalid referer. Referer: "${currentReferer}"`);
    return {
      statusCode: 403,
      headers: responseHeaders,
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
    // Ensure this range accurately reflects your sheet's structure.
    // If headers are in row 1 and data starts in row 2, A1:Z is fine for up to 1000 rows of data.
    const range = "'Copy of Sheet1 1'!A1:Z"; 

    console.log(`Workspaceing data from spreadsheetId: ${spreadsheetId}, range: ${range}`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];

    if (rows.length === 0) {
      console.warn("No data found in the specified sheet range.");
      return {
        statusCode: 200, // Or 404 if you prefer for no data
        headers: responseHeaders,
        body: JSON.stringify({ headers: [], entries: [], message: "No data found in sheet." }),
      };
    }
    
    // Log the fetched headers to ensure they are what you expect
    console.log("Fetched headers from sheet:", rows[0]);

    return {
      statusCode: 200,
      headers: responseHeaders, // Use the common responseHeaders
      body: JSON.stringify({
        headers: rows[0],    // First row as headers
        entries: rows.slice(1), // Rest of the rows as entries
      }),
    };

  } catch (error) {
    console.error("Google Sheets API error or other internal error:", error.message, error.stack);
    return {
      statusCode: 500,
      headers: responseHeaders, // Also add CORS headers to server error responses
      body: JSON.stringify({ error: "Failed to fetch homicide data due to an internal server error." }),
    };
  }
};
