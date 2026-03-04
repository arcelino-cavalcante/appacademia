import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

export const fetchData = async (collectionName) => {
    try {
        const snapshot = await getDocs(collection(db, collectionName));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error fetching data: ", e);
        return [];
    }
};

export const saveData = async (collectionName, id, data) => {
    try {
        await setDoc(doc(db, collectionName, id.toString()), data, { merge: true });
    } catch (e) {
        console.error("Error saving document: ", e);
    }
};

export const deleteData = async (collectionName, id) => {
    try {
        await deleteDoc(doc(db, collectionName, id.toString()));
    } catch (e) {
        console.error("Error deleting document: ", e);
    }
};
