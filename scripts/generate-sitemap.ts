import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT || '{}'
);

if (!serviceAccount.project_id) {
    console.error('Error: FIREBASE_SERVICE_ACCOUNT environment variable not set');
    process.exit(1);
}

const app = initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore(app);

async function generateSitemap() {
    const baseUrl = process.env.VITE_BASE_URL || 'https://prestigemerchandise.vercel.app';

    const staticPages = [
        { url: '', priority: '1.0', changefreq: 'daily', lastmod: new Date().toISOString().split('T')[0] },
        { url: '/shop', priority: '0.9', changefreq: 'daily', lastmod: new Date().toISOString().split('T')[0] },
        { url: '/about', priority: '0.7', changefreq: 'monthly', lastmod: new Date().toISOString().split('T')[0] },
        { url: '/services', priority: '0.7', changefreq: 'monthly', lastmod: new Date().toISOString().split('T')[0] },
        { url: '/contact', priority: '0.8', changefreq: 'monthly', lastmod: new Date().toISOString().split('T')[0] },
        { url: '/blog', priority: '0.8', changefreq: 'weekly', lastmod: new Date().toISOString().split('T')[0] },
    ];

    // Fetch products
    const productsSnapshot = await db.collection('products')
        .where('status', '==', 'active')
        .get();

    const productPages = productsSnapshot.docs.map(doc => {
        const data = doc.data();
        let lastmod = new Date().toISOString().split('T')[0];

        if (data.updatedAt) {
            // Handle Firebase Admin SDK Timestamp
            const timestamp = data.updatedAt;
            if (timestamp._seconds) {
                lastmod = new Date(timestamp._seconds * 1000).toISOString().split('T')[0];
            } else if (typeof timestamp.toDate === 'function') {
                lastmod = timestamp.toDate().toISOString().split('T')[0];
            }
        }

        return {
            url: `/product/${doc.id}`,
            priority: '0.8',
            changefreq: 'weekly',
            lastmod
        };
    });

    // Fetch blog posts
    const blogSnapshot = await db.collection('blog_posts')
        .where('status', '==', 'published')
        .get();

    const blogPages = blogSnapshot.docs.map(doc => {
        const data = doc.data();
        let lastmod = new Date().toISOString().split('T')[0];

        if (data.publishedAt) {
            // Handle Firebase Admin SDK Timestamp
            const timestamp = data.publishedAt;
            if (timestamp._seconds) {
                lastmod = new Date(timestamp._seconds * 1000).toISOString().split('T')[0];
            } else if (typeof timestamp.toDate === 'function') {
                lastmod = timestamp.toDate().toISOString().split('T')[0];
            }
        }

        return {
            url: `/blog/${doc.id}`,
            priority: '0.6',
            changefreq: 'monthly',
            lastmod
        };
    });

    const allPages = [...staticPages, ...productPages, ...blogPages];

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    // Write to public directory
    const publicDir = path.join(__dirname, '..', 'public');
    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);

    console.log(`✅ Sitemap generated with ${allPages.length} URLs`);
    console.log(`   - ${staticPages.length} static pages`);
    console.log(`   - ${productPages.length} product pages`);
    console.log(`   - ${blogPages.length} blog posts`);
}

generateSitemap()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Error generating sitemap:', error);
        process.exit(1);
    });
