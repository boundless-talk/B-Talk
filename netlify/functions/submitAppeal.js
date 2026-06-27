const admin = require('firebase-admin');

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://b-talk-login-default-rtdb.firebaseio.com/"
    });
}

const db = admin.database();

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
};

exports.handler = async function(event, context) {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS_HEADERS, body: 'Method Not Allowed' };

    try {
        const { uid, type, text } = JSON.parse(event.body);
        if (!uid || !text) return { statusCode: 400, headers: CORS_HEADERS, body: 'Missing uid or text' };

        await db.ref('appeals/' + uid).set({
            type: type || 'suspend',
            text,
            submittedAt: Date.now(),
            resolved: false
        });

        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true }) };
    } catch(e) {
        console.error('submitAppeal error:', e);
        return { statusCode: 500, headers: CORS_HEADERS, body: 'Internal Server Error' };
    }
};
