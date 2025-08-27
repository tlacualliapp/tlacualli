
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Deletes a document and all of its subcollections recursively.
 * @param docRef The reference to the document to delete.
 */
export async function recursiveDelete(docRef: any) {
  const subcollectionsSnapshot = await getDocs(collection(docRef, 'subcollections'));
  
  const subcollectionPromises: Promise<any>[] = [];
  subcollectionsSnapshot.forEach((subcollectionDoc) => {
    subcollectionPromises.push(recursiveDelete(subcollectionDoc.ref));
  });

  await Promise.all(subcollectionPromises);

  const batch = writeBatch(db);
  batch.delete(docRef);
  await batch.commit();
}
