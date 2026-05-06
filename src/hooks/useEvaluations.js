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

  useEffect(() => {
    evalDataRef.current = evalData;
  }, [evalData]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!user) return;

    storageRef.current = getStorageService(user);

    const unsubscribe = storageRef.current.subscribe((newEvaluaciones) => {
      setEvaluaciones(newEvaluaciones);

      setEvalActivaId((prevId) => {
        if (prevId && !newEvaluaciones.find((e) => e.id === prevId)) {
          setTimeout(() => setEvalData(EMPTY_EVAL), 0);
          return null;
        }
        return prevId;
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
      storageRef.current = null;
      clearTimeout(saveTimer.current);
    };
  }, [user]);

  const seleccionarEval = useCallback((id) => {
    setEvalActivaId(id);

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

  const updateEvalData = useCallback(
    (updater) => {
      setEvalData((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;

        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          if (evalActivaId && storageRef.current) {
            saveEval(evalActivaId, evalDataRef.current);
          }
        }, 800);

        return next;
      });
    },
    [evalActivaId, saveEval]
  );

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
  }, []);

  // ✅ Reset de evaluaciones
  const resetEvaluations = useCallback(() => {
    setEvaluaciones([]);
    setEvalActivaId(null);
    setEvalData(EMPTY_EVAL);
    storageRef.current = null;
    clearTimeout(saveTimer.current);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(saveTimer.current);
    };
  }, []);

  return {
    evaluaciones,
    evalActivaId,
    evalData,
    saving,
    seleccionarEval,
    updateEvalData,
    crearEvaluacion,
    eliminarEvaluacion,
    resetEvaluations, // ✅ Exportado
  };
}