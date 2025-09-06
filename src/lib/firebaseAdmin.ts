import admin from 'firebase-admin';
import { getApps, getApp } from 'firebase-admin/app';

// Check if the app is already initialized to prevent errors
if (!getApps().length) {
  admin.initializeApp();
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();
const adminStorage = admin.storage();

export { adminDb, adminAuth, adminStorage };
