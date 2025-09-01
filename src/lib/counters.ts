
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Gets the next consecutive ID for takeout orders for the current day.
 * Uses a Firestore transaction to ensure atomicity.
 * @param restaurantId The ID of the restaurant.
 * @param userPlan The plan of the user ('demo' or a paid plan).
 * @returns A promise that resolves to the formatted takeout ID (e.g., "00001-20240726").
 */
export async function getNextTakeoutId(restaurantId: string, userPlan: string): Promise<string> {
  const today = new Date();
  const dateString = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
  
  const collectionName = userPlan === 'demo' ? 'restaurantes_demo' : 'restaurantes';
  const counterRef = doc(db, `${collectionName}/${restaurantId}/counters`, dateString);

  try {
    const newCount = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists()) {
        transaction.set(counterRef, { count: 1, lastUpdated: serverTimestamp() });
        return 1;
      } else {
        const newCount = counterDoc.data().count + 1;
        transaction.update(counterRef, { count: newCount, lastUpdated: serverTimestamp() });
        return newCount;
      }
    });

    const formattedCount = String(newCount).padStart(5, '0');
    return `${formattedCount}-${dateString}`;
    
  } catch (e) {
    console.error("Transaction failed: ", e);
    throw new Error("Could not generate a new takeout ID.");
  }
}
