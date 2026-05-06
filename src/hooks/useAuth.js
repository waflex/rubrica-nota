// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from "react";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, provider } from "../services/firebase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  // Escuchar cambios de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Iniciar sesión con Google
  const handleLogin = useCallback(async () => {
    setLoginLoading(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      throw error;
    } finally {
      setLoginLoading(false);
    }
  }, []);

  // Continuar sin sesión
  const handleContinueWithoutLogin = useCallback(() => {
    setUser({ isAnonymous: true, uid: "local" });
    setAuthLoading(false);
  }, []);

  // Cerrar sesión
  const handleLogout = useCallback(async () => {
    if (user?.isAnonymous) {
      setUser(null);
      return;
    }
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  }, [user]);

  return {
    user,
    authLoading,
    loginLoading,
    handleLogin,
    handleContinueWithoutLogin,
    handleLogout,
  };
}