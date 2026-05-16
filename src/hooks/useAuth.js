// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from "react";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, provider } from "../services/firebase";

export function useAuth() {
  const [user, setUser] = useState(() => {
    // ✅ Iniciar como usuario anónimo por defecto
    return { isAnonymous: true, uid: "local" };
  });
  const [authLoading] = useState(false); // ✅ Ya no carga, es inmediato
  const [loginLoading, setLoginLoading] = useState(false);

  // Escuchar cambios de autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Usuario autenticado con Google
        setUser(firebaseUser);
      }
      // Si no hay usuario de Firebase, mantenemos el anónimo
    });
    return () => unsubscribe();
  }, []);

  // Iniciar sesión con Google
  const handleLogin = useCallback(async () => {
    setLoginLoading(true);
    try {
      await signInWithPopup(auth, provider);
      // El onAuthStateChanged se encargará de actualizar el user
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      throw error;
    } finally {
      setLoginLoading(false);
    }
  }, []);

  // Cerrar sesión
  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      // Volver a modo anónimo
      setUser({ isAnonymous: true, uid: "local" });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Si falla, igual volvemos a anónimo
      setUser({ isAnonymous: true, uid: "local" });
    }
  }, []);

  return {
    user,
    authLoading,
    loginLoading,
    handleLogin,
    handleLogout,
  };
}