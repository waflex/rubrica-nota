// src/hooks/useEvaluations.js
import { useState, useEffect, useCallback, useRef } from "react";
import { getStorageService } from "../services/storage";
import { EMPTY_EVAL } from "../utils/constants";

export function useEvaluations(user) {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [evalActivaId, setEvalActivaId] = useState(null);
  const [evalData, setEvalData] = useState(EMPTY_EVAL);
  const [saving, setSaving] = useState(false);

  const storageRef = useRef(null);
  const saveTimer = useRef(null);
  const evalDataRef = useRef(evalData);
  const userRef = useRef(user);

  // Mantener refs actualizadas
  useEffect(() => {
    evalDataRef.current = evalData;
  }, [evalData]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Inicializar servicio de almacenamiento según el usuario
  useEffect(() => {
    // Si no hay usuario, no hacer nada (ya inicializado en vacío)
    if (!user) return;

    // Crear servicio de storage
    storageRef.current = getStorageService(user);

    // Suscribirse a cambios
    const unsubscribe = storageRef.current.subscribe((newEvaluaciones) => {
      setEvaluaciones(newEvaluaciones);

      // Verificar si la evaluación activa aún existe
      setEvalActivaId((prevId) => {
        if (prevId && !newEvaluaciones.find(e => e.id === prevId)) {
          // Usar setTimeout para evitar setState sincrónico
          setTimeout(() => setEvalData(EMPTY_EVAL), 0);
          return null;
        }
        return prevId;
      });
    });

    // Cleanup
    return () => {
      if (unsubscribe) unsubscribe();
      // Limpiar al desmontar
      storageRef.current = null;
    };
  }, [user]); // Solo se ejecuta cuando cambia el usuario

  // Cambiar evaluación activa
  const seleccionarEval = useCallback((id) => {
    setEvalActivaId(id);

    // Buscar en el estado actual de evaluaciones
    setEvaluaciones((prev) => {
      const evaluacion = prev.find((e) => e.id === id);

      if (evaluacion) {
        setEvalData({
          nombre: evaluacion.nombre ?? "",
          escala: evaluacion.escala ?? EMPTY_EVAL.escala,
          criterios: evaluacion.criterios ?? EMPTY_EVAL.criterios,
          alumnos: evaluacion.alumnos ?? [],
        });
      } else {
        setEvalData(EMPTY_EVAL);
      }

      return prev;
    });
  }, []);

  // Guardar evaluación con debounce
  const saveEval = useCallback(async (id, data) => {
    if (!userRef.current || !id || !storageRef.current) return;

    setSaving(true);
    try {
      await storageRef.current.update(id, {
        nombre: data.nombre,
        escala: data.escala,
        criterios: data.criterios,
        alumnos: data.alumnos,
      });
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setSaving(false);
    }
  }, []);

  // Actualizar datos de evaluación activa con debounce
  const updateEvalData = useCallback((updater) => {
    setEvalData((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return next;
    });

    // Debounce del guardado (se ejecuta después del render)
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      // Usar ref para obtener el estado más reciente
      if (evalDataRef.current && storageRef.current) {
        const currentData = evalDataRef.current;
        // Solo guardar si hay una evaluación activa
        setEvalActivaId((currentId) => {
          if (currentId) {
            saveEval(currentId, currentData);
          }
          return currentId;
        });
      }
    }, 800);
  }, [saveEval]);

  // CRUD de evaluaciones
  const crearEvaluacion = useCallback(async (nombre) => {
    if (!userRef.current || !storageRef.current) return null;

    const evalName = nombre?.trim() || "Nueva evaluación";
    const id = await storageRef.current.create({
      nombre: evalName,
      escala: EMPTY_EVAL.escala,
      criterios: EMPTY_EVAL.criterios,
      alumnos: [],
    });

    return id;
  }, []);

  const eliminarEvaluacion = useCallback(async (id) => {
    if (!storageRef.current) return;

    await storageRef.current.delete(id);

    // La limpieza del estado activo se maneja en el callback de suscripción
  }, []);

  // Limpiar el timer al desmontar
  useEffect(() => {
    if (!user) {
      setTimeout(() => {
        setEvaluaciones([]);
        setEvalActivaId(null);
        setEvalData(EMPTY_EVAL);
        storageRef.current = null;
      }, 0);
    }
  }, [user]);

  return {
    evaluaciones,
    evalActivaId,
    evalData,
    saving,
    seleccionarEval,
    updateEvalData,
    crearEvaluacion,
    eliminarEvaluacion,
  };
}