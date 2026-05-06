// src/services/storage.js
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const COLLECTION_NAME = "evaluaciones";

/**
 * Servicio de almacenamiento local (localStorage)
 */
class LocalStorage {
  constructor() {
    this.prefix = "rubrica_eval_";
  }

  getAll() {
    try {
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix));
      
      return keys
        .map(key => {
          const item = JSON.parse(localStorage.getItem(key));
          return { id: key.replace(this.prefix, ""), ...item };
        })
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    } catch (error) {
      console.error("Error al leer localStorage:", error);
      return [];
    }
  }

  async create(data) {
    try {
      const id = `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const item = {
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      localStorage.setItem(this.prefix + id, JSON.stringify(item));
      return id;
    } catch (error) {
      console.error("Error al guardar en localStorage:", error);
      throw error;
    }
  }

  async update(id, data) {
    try {
      const key = this.prefix + id;
      const existing = JSON.parse(localStorage.getItem(key));
      
      if (!existing) throw new Error("Evaluación no encontrada");
      
      const updated = {
        ...existing,
        ...data,
        updatedAt: Date.now(),
      };
      
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (error) {
      console.error("Error al actualizar en localStorage:", error);
      throw error;
    }
  }

  async delete(id) {
    try {
      localStorage.removeItem(this.prefix + id);
    } catch (error) {
      console.error("Error al eliminar de localStorage:", error);
      throw error;
    }
  }

  subscribe(callback) {
    // En localStorage no hay sincronización en tiempo real,
    // pero podemos simular con eventos de storage
    const handler = () => callback(this.getAll());
    window.addEventListener("storage", handler);
    callback(this.getAll());
    
    return () => window.removeEventListener("storage", handler);
  }
}

/**
 * Servicio de almacenamiento en Firebase
 */
class FirebaseStorage {
  constructor(uid) {
    this.uid = uid;
    this.colRef = collection(db, "users", uid, COLLECTION_NAME);
  }

  async create(data) {
    const docRef = await addDoc(this.colRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async update(id, data) {
    const docRef = doc(db, "users", this.uid, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  async delete(id) {
    const docRef = doc(db, "users", this.uid, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }

  subscribe(callback) {
    const q = collection(db, "users", this.uid, COLLECTION_NAME);
    
    return onSnapshot(q, (snapshot) => {
      const evaluations = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => (b.updatedAt?.seconds ?? 0) - (a.updatedAt?.seconds ?? 0));
      
      callback(evaluations);
    }, (error) => {
      console.error("Error en suscripción Firebase:", error);
      callback([]);
    });
  }
}

/**
 * Factory para obtener el servicio de almacenamiento adecuado
 */
export function getStorageService(user) {
  if (user?.isAnonymous || !db) {
    return new LocalStorage();
  }
  
  return new FirebaseStorage(user.uid);
}

export { LocalStorage, FirebaseStorage };