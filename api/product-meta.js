const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin only once
if (!admin.apps.length) {
    // Use environment variable for service account
    // If FIREBASE_SERVICE_ACCOUNT is a JSON string, parse it.
    // Otherwise, if running locally or if you want to use default credentials (usually won't work on Vercel Edge without JSON), try default.

    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
        if (Object.keys(serviceAccount).length > 0) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } else {
            console.warn("FIREBASE_SERVICE_ACCOUNT env var missing or empty. Firestore fetch may fail.");
            admin.initializeApp(); // Fallback similar to Cloud Functions environment
        }
    } catch (e) {
        console.error("Error parsing FIREBASE_SERVICE_ACCOUNT", e);
        admin.initializeApp();
    }
}

const db = admin.firestore();

module.exports = async (req, res) => {
    // Parse productId from URL.
    // Rewrites send /product/:id -> /api/product-meta?pathname=/product/:id or similar if using destination
    // But standard Vercel rewrite preserves the URL. 
    // If rewriting "/product/:id" -> "/api/product-meta", req.url might still be /product/:id or rewritten path.
    // Let's parse req.url.

    const pathUrl = req.url; // e.g., /product/123 or /api/product-meta depending on how Vercel passes it.
    // If rewrite keeps original URL:
    const parts = pathUrl.split('/');
    // parts[0]='', parts[1]='product', parts[2]='id'

    // Note: Vercel might pass query params.
    let productId;
    if (parts[1] === 'product') {
        productId = parts[2];
    } else {
        // Fallback: check query param if Vercel Rewrite sends it as /api/product-meta?id=...
        const { id } = req.query;
        productId = id;
    }

    // Remove query params if stuck to ID
    if (productId && productId.includes('?')) {
        productId = productId.split('?')[0];
    }

    if (!productId) {
        return serveIndex(res);
    }

    try {
        const docRef = db.collection('products').doc(productId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return serveIndex(res);
        }

        const product = docSnap.data();

        // Read index.html
        // On Vercel, static files are usually in process.cwd() if not bundled away.
        // However, since this is an API route, Vercel might not bundle the 'dist' folder into the lambda.
        // We might need to fetch it from the deployment URL or assume it's copied.
        // A safer bet for SPA on Vercel: just hardcode the basic HTML structure OR fetch the live index.html.
        // Fetching live index is robust:

        // We'll try to read from dist/index.html assuming standard vercel build preserves it, 
        // but often functions are isolated.
        // Better strategy: Fetch the HTML from the live site itself (the static part).
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers.host;
        const siteUrl = `${protocol}://${host}`;

        let indexHtml = '';
        try {
            // Fetch raw index.html (we can point to a distinct path if /product/ redirects to us recursively)
            // We can fetch '/index.html' specifically.
            const response = await fetch(`${siteUrl}/index.html`);
            if (response.ok) {
                indexHtml = await response.text();
            } else {
                throw new Error('Failed to fetch index.html');
            }
        } catch (e) {
            console.error("Error fetching index.html template", e);
            // Fallback minimal HTML
            indexHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Prestige Merchandise</title></head><body><div id="root"></div></body></html>`;
        }

        // Create meta tags
        const title = `${product.name} | The Prestige Merchandise`;
        const description = product.description ? product.description.substring(0, 160) : "Genuine auto parts.";
        const image = (product.images && product.images.length > 0) ? product.images[0] : "";
        const url = `${siteUrl}/product/${productId}`;
        const price = product.price ? `GH₵${product.price.toFixed(2)}` : "";

        // Replace Title
        let finalHtml = indexHtml.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);

        // Inject Open Graph Tags
        const ogTags = `
    <meta property="og:type" content="product" />
    <meta property="og:title" content="${title} ${price ? '- ' + price : ''}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title} ${price ? '- ' + price : ''}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    `;

        finalHtml = finalHtml.replace('</head>', `${ogTags}</head>`);

        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
        res.status(200).send(finalHtml);

    } catch (error) {
        console.error("Error fetching product meta", error);
        return serveIndex(res);
    }
};

async function serveIndex(res) {
    // Redirect to main shop or just return basic HTML?
    // Determine site URL same as above
    res.status(404).send('Product not found or error loading.');
}
