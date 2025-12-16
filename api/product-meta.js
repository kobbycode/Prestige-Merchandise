import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin only once
if (!getApps().length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
        if (Object.keys(serviceAccount).length > 0) {
            initializeApp({
                credential: cert(serviceAccount)
            });
        } else {
            console.warn("FIREBASE_SERVICE_ACCOUNT env var missing or empty. Firestore fetch may fail.");
            initializeApp();
        }
    } catch (e) {
        console.error("Error parsing FIREBASE_SERVICE_ACCOUNT", e);
        initializeApp();
    }
}

const db = getFirestore();

// Helper to get the base HTML
async function getIndexHtml(siteUrl) {
    try {
        const response = await fetch(`${siteUrl}/index.html`);
        if (response.ok) {
            return await response.text();
        }
    } catch (e) {
        console.error("Error fetching index.html template", e);
    }
    // Fallback minimal HTML if fetch fails
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>The Prestige Merchandise</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/index.js"></script>
  </body>
</html>`;
}

export default async (req, res) => {
    const { id } = req.query;
    const productId = id;

    // Determine site URL from request headers
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const siteUrl = `${protocol}://${host}`;

    async function serveIndex() {
        const html = await getIndexHtml(siteUrl);
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(html);
    }

    if (!productId) {
        return serveIndex();
    }

    try {
        const docRef = db.collection('products').doc(productId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return serveIndex();
        }

        const product = docSnap.data();
        const indexHtml = await getIndexHtml(siteUrl);

        // Create meta tags
        const title = `${product.name} | The Prestige Merchandise`;
        const description = product.description ? product.description.substring(0, 160) : "Genuine auto parts.";
        const image = (product.images && product.images.length > 0) ? product.images[0] : "";
        const url = `${siteUrl}/product/${productId}`;
        const price = product.price ? `GH₵${product.price.toFixed(2)}` : "";

        // Replace Title
        let finalHtml = indexHtml.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);

        // Inject Open Graph Tags
        // We remove any existing OG tags to avoid duplicates if they exist in the template
        finalHtml = finalHtml.replace(/<meta property="og:.*?" content=".*?" \/>/g, '');
        finalHtml = finalHtml.replace(/<meta name="twitter:.*?" content=".*?" \/>/g, '');

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
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(finalHtml);

    } catch (error) {
        console.error("Error fetching product meta", error);
        return serveIndex();
    }
};
