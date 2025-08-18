
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export async function getRestaurantIdForUser(userId: string): Promise<string | null> {
    const q = query(collection(db, 'usuarios'), where('uid', '==', userId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        return userData.restauranteId || null;
    }
    return null;
}
