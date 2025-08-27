
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { auth } from './firebase';

interface UserData {
    restauranteId: string | null;
    plan: string | null;
}

export async function getRestaurantIdForCurrentUser(): Promise<string | null> {
    const userData = await getCurrentUserData();
    return userData?.restauranteId || null;
}

export async function getCurrentUserData(): Promise<UserData | null> {
    const user = auth.currentUser;
    if (!user) {
        console.log("No user is currently signed in.");
        return null;
    }

    try {
        const q = query(collection(db, 'usuarios'), where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            return {
                restauranteId: userData.restauranteId || null,
                plan: userData.plan || null
            };
        } else {
             const adminQ = query(collection(db, 'usuarios'), where('email', '==', user.email));
             const adminQuerySnapshot = await getDocs(adminQ);
             if(!adminQuerySnapshot.empty){
                const adminData = adminQuerySnapshot.docs[0].data();
                return {
                    restauranteId: adminData.restauranteId || null,
                    plan: adminData.plan || null
                };
             }
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
    
    console.log("User document not found or no restaurant ID associated.");
    return null;
}
