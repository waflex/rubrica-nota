// src/components/evaluation/StatsCards.jsx

/**
 * Tarjeta de estadística individual
 */
function StatCard({ label, value, icon, color = "blue" }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-1 font-medium">{label}</p>
          <p className="text-2xl font-semibold text-gray-800 tabular-nums">{value}</p>
        </div>
        {icon && (
          <span className={`text-lg ${colorClasses[color]} p-2 rounded-lg`}>
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Componente que muestra estadísticas de la evaluación
 * @param {Object} stats - Datos estadísticos
 */
export default function StatsCards({ 
  pMaxTotal, 
  totalAlumnos, 
  promedio, 
  aprobados,
  escala 
}) {
  const porcentajeAprobacion = totalAlumnos > 0 
    ? ((aprobados / totalAlumnos) * 100).toFixed(0)
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Puntaje total"
        value={`${pMaxTotal} pts`}
        icon="📊"
        color="blue"
      />
      <StatCard
        label="Alumnos"
        value={totalAlumnos}
        icon="👥"
        color="purple"
      />
      <StatCard
        label="Promedio curso"
        value={promedio}
        icon="📈"
        color={Number(promedio) >= escala.nApr ? "green" : "yellow"}
      />
      <StatCard
        label="Aprobados"
        value={`${aprobados} / ${totalAlumnos}`}
        icon="✅"
        color={porcentajeAprobacion >= 60 ? "green" : "yellow"}
      />
    </div>
  );
}