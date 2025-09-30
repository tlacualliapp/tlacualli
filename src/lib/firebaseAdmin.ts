import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// This function checks the environment and initializes Firebase Admin SDK accordingly.
if (!getApps().length) {
  // Check if the service account key environment variable is set.
  // This is typically used for local development.
  if (process.env.SERVICE_ACCOUNT_KEY) {
    try {
      // Safely parse the JSON string from the environment variable.
      const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized using service account key (local development).');
    } catch (error) {
      console.error('Error parsing SERVICE_ACCOUNT_KEY or initializing Firebase Admin SDK:', error);
    }
  } else {
    // For production environments (like Google App Engine, Cloud Run, Cloud Functions),
    // initialize without parameters. It will automatically use Application Default Credentials.
    admin.initializeApp();
    console.log('Firebase Admin SDK initialized using Application Default Credentials (production).');
  }
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();
const adminStorage = admin.storage();

export { adminDb, adminAuth, adminStorage };
