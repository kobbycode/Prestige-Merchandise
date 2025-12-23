const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

if (!serviceAccount.project_id) {
    console.error('Error: FIREBASE_SERVICE_ACCOUNT environment variable not set or invalid');
    process.exit(1);
}

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function removeBlogPostMenuItem() {
    try {
        console.log('Fetching settings from Firestore...');
        const settingsRef = db.collection('settings').doc('general');
        const settingsDoc = await settingsRef.get();

        if (!settingsDoc.exists) {
            console.log('Settings document does not exist.');
            return;
        }

        const settings = settingsDoc.data();
        const menuItems = settings.menuItems || [];

        console.log('Current menu items:', menuItems.map(item => item.label));

        // Filter out any "Blog Post" or "Blog post" entries
        const filteredMenuItems = menuItems.filter(item => {
            const label = item.label.toLowerCase().trim();
            return label !== 'blog post' && label !== 'blog posts';
        });

        console.log('Filtered menu items:', filteredMenuItems.map(item => item.label));

        // Update Firestore
        await settingsRef.update({
            menuItems: filteredMenuItems,
            updatedAt: new Date().toISOString()
        });

        console.log('✅ Successfully removed "Blog Post" menu item from settings');
        console.log(`Removed ${menuItems.length - filteredMenuItems.length} item(s)`);
    } catch (error) {
        console.error('Error removing Blog Post menu item:', error);
        process.exit(1);
    }
}

removeBlogPostMenuItem();
