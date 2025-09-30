
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// Function to safely parse the service account key from environment variables
const getServiceAccount = () => {
  const serviceAccount = process.env.SERVICE_ACCOUNT_KEY;
  if (!serviceAccount) {
    throw new Error('SERVICE_ACCOUNT_KEY environment variable is not set.');
  }
  try {
    return JSON.parse(serviceAccount);
  } catch (error) {
    throw new Error('Failed to parse SERVICE_ACCOUNT_KEY. Make sure it is a valid JSON string.');
  }
};

// Initialize Firebase Admin SDK
if (!getApps().length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(getServiceAccount()),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization failed:', error.message);
    // You might want to throw the error or handle it as needed
    // For example, in a serverless environment, you might not want the function to cold start again
    // on every invocation if initialization fails.
  }
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();
const adminStorage = admin.storage();

export { adminDb, adminAuth, adminStorage };
