# Rúbrica de Notas

Una aplicación web dedicada a docentes que utilizan rúbricas diariamente para facilitar el cálculo de notas. Basada en el sistema de evaluación chileno de [escaladenotas.cl](https://escaladenotas.cl), permite calcular notas finales según puntajes obtenidos y el porcentaje de exigencia configurado.

## Características

- **Configuración flexible de escala**: Ajusta la nota mínima, máxima, de aprobación y porcentaje de exigencia.
- **Gestión de criterios**: Agrega, edita y elimina criterios de evaluación con puntajes máximos personalizables.
- **Evaluación de alumnos**: Registra alumnos y asigna puntajes por criterio.
- **Cálculo automático**: Obtiene la nota final aplicando la fórmula de escaladenotas.cl.
- **Estadísticas del curso**: Visualiza el promedio del curso y cantidad de aprobados.
- **Interfaz intuitiva**: Diseño moderno y responsivo con Tailwind CSS.

## Cómo usar

### Configuración inicial

1. **Ajusta la escala de notas**:
   - Nota mínima (por defecto 1.0)
   - Nota máxima (por defecto 7.0)
   - Nota de aprobación (por defecto 4.0)
   - Porcentaje de exigencia (por defecto 60%)

### Gestión de criterios

1. **Agrega criterios**: Haz clic en "+ Agregar criterio" para añadir nuevos criterios de evaluación.
2. **Edita criterios**: Haz clic en el nombre del criterio para editarlo. Puedes cambiar el nombre y el puntaje máximo.
3. **Elimina criterios**: Usa el botón "✕" junto al nombre del criterio.

### Evaluación de alumnos

1. **Agrega alumnos**: Escribe el nombre del alumno en el campo de texto y presiona Enter o haz clic en "+ Agregar alumno".
2. **Asigna puntajes**: Para cada alumno, ingresa los puntajes obtenidos en cada criterio (máximo el puntaje configurado para ese criterio).
3. **Visualiza resultados**: La aplicación calcula automáticamente el puntaje total y la nota final para cada alumno.

### Estadísticas

- **Puntaje total**: Suma de todos los puntajes máximos de los criterios.
- **Alumnos**: Número total de alumnos registrados.
- **Promedio del curso**: Promedio de las notas finales.
- **Aprobados**: Número de alumnos con nota ≥ nota de aprobación.

## Fórmula de cálculo

La aplicación utiliza la fórmula de [escaladenotas.cl](https://escaladenotas.cl) para calcular notas:

- **Umbral** = Porcentaje de exigencia × Puntaje máximo total
- Si puntaje < umbral:
  - Nota = (Nota aprobación - Nota mínima) × (puntaje / umbral) + Nota mínima
- Si puntaje ≥ umbral:
  - Nota = (Nota máxima - Nota aprobación) × ((puntaje - umbral) / (puntaje máximo total × (1 - porcentaje exigencia))) + Nota aprobación

El resultado se trunca a 2 decimales y se aproxima al décimo más cercano (si la centésima ≥ 5, sube al décimo superior).

## Instalación y ejecución

### Prerrequisitos

- Node.js (versión 16 o superior)
- npm o yarn

### Instalación

1. Clona el repositorio:
   ```bash
   git clone <url-del-repositorio>
   cd rubrica-notas
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

### Ejecución

Para ejecutar en modo desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173` (o el puerto que indique Vite).

### Construcción para producción

```bash
npm run build
```

Los archivos compilados estarán en la carpeta `dist`.

### Vista previa de producción

```bash
npm run preview
```

## Tecnologías utilizadas

- **React 19**: Framework para la interfaz de usuario
- **Vite**: Herramienta de construcción rápida
- **Tailwind CSS**: Framework de estilos CSS
- **JavaScript ES6+**: Lenguaje de programación

## Contribución

Si deseas contribuir al proyecto:

1. Haz un fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Realiza tus cambios y haz commit (`git commit -am 'Agrega nueva funcionalidad'`)
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## Soporte

Para soporte o preguntas, por favor abre un issue en el repositorio de GitHub.
