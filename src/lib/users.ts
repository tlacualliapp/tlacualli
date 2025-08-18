
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { auth } from './firebase';

export async function getRestaurantIdForCurrentUser(): Promise<string | null> {
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
            console.log("Found user data:", userData);
            return userData.restauranteId || null;
        } else {
             const adminQ = query(collection(db, 'usuarios'), where('email', '==', user.email));
             const adminQuerySnapshot = await getDocs(adminQ);
             if(!adminQuerySnapshot.empty){
                const adminData = adminQuerySnapshot.docs[0].data();
                console.log("Found admin user data:", adminData);
                return adminData.restauranteId || null;
             }
        }
    } catch (error) {
        console.error("Error fetching restaurant ID for user:", error);
    }
    
    console.log("User document not found or no restaurant ID associated.");
    return null;
}
