const admin = require('firebase-admin');

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://b-talk-login-default-rtdb.firebaseio.com/"
    });
}
const db = admin.database();

function emailToKey(email) {
    return email.trim().toLowerCase().replace(/[.#$[\]]/g, '_');
}

const headers = {
    'Access-Control-Allow-Origin': 'https://boundless-talk.github.io',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: headers, body: '' };
    }
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: headers, body: 'Method Not Allowed' };
    }

    const { email, code } = JSON.parse(event.body || '{}');
    if (!email || !code) {
        return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'email and code required' }) };
    }

    try {
        const ref = db.ref('emailVerifications/' + emailToKey(email));
        const snap = await ref.once('value');
        const data = snap.val();

        if (!data) {
            return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: false, error: 'invalid_code' }) };
        }
        if (data.expiresAt < Date.now()) {
            await ref.remove();
            return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: false, error: 'code_expired' }) };
        }
        if (String(data.code) !== String(code)) {
            return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: false, error: 'invalid_code' }) };
        }

        await ref.remove(); // 1회용 코드
        return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true }) };
    } catch (err) {
        console.error('verifyEmailCode error:', err.message);
        return { statusCode: 500, headers: headers, body: JSON.stringify({ error: err.message }) };
    }
};
