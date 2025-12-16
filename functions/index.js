const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

admin.initializeApp();
const db = admin.firestore();

exports.productMeta = onRequest(async (req, res) => {
    const pathUrl = req.path; // e.g., /product/123
    const parts = pathUrl.split('/');
    // URL structure is /product/:id. parts: ['', 'product', 'id']
    const productId = parts[2];

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
        const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

        // Create meta tags
        const title = `${product.name} | The Prestige Merchandise`;
        const description = product.description ? product.description.substring(0, 160) : "Genuine auto parts.";
        const image = (product.images && product.images.length > 0) ? product.images[0] : "";
        const url = `https://${req.hostname}/product/${productId}`;
        const price = product.price ? `GH₵${product.price.toFixed(2)}` : "";

        // Replace Title
        let finalHtml = indexHtml.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);

        // Replace or Inject Open Graph Tags
        // We assume the original index.html might have some placeholders or default OG tags.
        // It's safer to just REPLACE the existing ones if we can find them, or standard regex.

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

        // Inject before </head>
        finalHtml = finalHtml.replace('</head>', `${ogTags}</head>`);

        // Set Cache-Control for FB crawler to see it but not cache too long
        res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
        res.send(finalHtml);

    } catch (error) {
        logger.error("Error fetching product meta", error);
        return serveIndex(res);
    }
});

function serveIndex(res) {
    try {
        const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
        res.send(indexHtml);
    } catch (e) {
        res.status(500).send("Error loading index.html");
    }
}
