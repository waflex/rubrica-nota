// src/hooks/useLocalStorage.js
import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook personalizado para persistir estado en localStorage
 * @param {string} key - Clave para almacenar en localStorage
 * @param {*} initialValue - Valor inicial si no existe en localStorage
 * @returns {Array} [storedValue, setValue, removeValue]
 */
export function useLocalStorage(key, initialValue) {
    const keyRef = useRef(key);

    // ✅ Inicializar el estado con el valor de localStorage (solo en el primer render)
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // ✅ Actualizar keyRef cuando cambia la key (sin setState en el efecto)
    useEffect(() => {
        keyRef.current = key;
    }, [key]);

    // ✅ Guardar en localStorage cuando cambia storedValue
    const setValue = useCallback(
        (value) => {
            setStoredValue((prev) => {
                try {
                    const valueToStore =
                        value instanceof Function ? value(prev) : value;

                    // Guardar en localStorage
                    window.localStorage.setItem(
                        keyRef.current,
                        JSON.stringify(valueToStore)
                    );

                    return valueToStore;
                } catch (error) {
                    console.error(
                        `Error setting localStorage key "${keyRef.current}":`,
                        error
                    );
                    return prev;
                }
            });
        },
        [] // ✅ Sin dependencias, usa el updater function
    );

    // ✅ Eliminar el valor
    const removeValue = useCallback(() => {
        try {
            window.localStorage.removeItem(keyRef.current);
            setStoredValue(initialValue);
        } catch (error) {
            console.error(
                `Error removing localStorage key "${keyRef.current}":`,
                error
            );
        }
    }, [initialValue]);

    // ✅ Escuchar cambios en otras pestañas
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === keyRef.current) {
                if (e.newValue !== null) {
                    try {
                        setStoredValue(JSON.parse(e.newValue));
                    } catch (error) {
                        setStoredValue(e.newValue);
                    }
                } else {
                    setStoredValue(initialValue);
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [initialValue]);

    return [storedValue, setValue, removeValue];
}

/**
 * Hook para configuración de la app
 */
export function useAppSettings() {
    const [settings, setSettings] = useLocalStorage("app_settings", {
        sidebarOpen: true,
        defaultScale: {
            nMin: 1.0,
            nMax: 7.0,
            nApr: 4.0,
            exigencia: 60,
        },
    });

    const updateSettings = useCallback(
        (newSettings) => {
            setSettings((prev) => ({ ...prev, ...newSettings }));
        },
        [setSettings]
    );

    const resetSettings = useCallback(() => {
        setSettings({
            sidebarOpen: true,
            defaultScale: {
                nMin: 1.0,
                nMax: 7.0,
                nApr: 4.0,
                exigencia: 60,
            },
        });
    }, [setSettings]);

    return { settings, updateSettings, resetSettings };
}

export default useLocalStorage;