import { useMemo, useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { FECHA_DEMO_HOY } from '../data/mockClinicData';
import type { EstadoCita } from '../domain/types';
import './views.css';

type FiltroEstado = 'TODAS' | EstadoCita;

export function AgendaView() {
  const {
    citas,
    servicios,
    especialistas,
    marcarCitaCompletada,
    marcarCitaCancelada,
  } = useClinic();

  const [fechaFiltro, setFechaFiltro] = useState<string>(FECHA_DEMO_HOY);
  const [mostrarTodasFechas, setMostrarTodasFechas] = useState<boolean>(false);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('TODAS');
  const [feedback, setFeedback] = useState<{
    tipo: 'ok' | 'danger';
    mensaje: string;
  } | null>(null);

  const servicioPorId = useMemo(
    () => new Map(servicios.map((s) => [s.id, s])),
    [servicios],
  );
  const especialistaPorId = useMemo(
    () => new Map(especialistas.map((e) => [e.id, e])),
    [especialistas],
  );

  const citasDelRango = useMemo(() => {
    return citas
      .filter((c) => mostrarTodasFechas || c.fecha === fechaFiltro)
      .slice()
      .sort((a, b) => {
        const cmpFecha = a.fecha.localeCompare(b.fecha);
        if (cmpFecha !== 0) return cmpFecha;
        return a.hora.localeCompare(b.hora);
      });
  }, [citas, fechaFiltro, mostrarTodasFechas]);

  const citasFiltradas = useMemo(() => {
    if (filtroEstado === 'TODAS') return citasDelRango;
    return citasDelRango.filter((c) => c.estado === filtroEstado);
  }, [citasDelRango, filtroEstado]);

  const resumen = useMemo(() => {
    let reservadas = 0;
    let completadas = 0;
    let canceladas = 0;
    for (const c of citasDelRango) {
      if (c.estado === 'RESERVADA') reservadas += 1;
      else if (c.estado === 'COMPLETADA') completadas += 1;
      else canceladas += 1;
    }
    return { reservadas, completadas, canceladas };
  }, [citasDelRango]);

  const handleCompletar = (citaId: string, codigo: string) => {
    const res = marcarCitaCompletada(citaId);
    if (res.ok) {
      setFeedback({
        tipo: 'ok',
        mensaje: `${codigo} marcada como COMPLETADA. Se descontaron sus insumos de Stock Físico y Stock Comprometido.`,
      });
    } else {
      setFeedback({ tipo: 'danger', mensaje: res.error });
    }
  };

  const handleCancelar = (citaId: string, codigo: string) => {
    const res = marcarCitaCancelada(citaId);
    if (res.ok) {
      setFeedback({
        tipo: 'ok',
        mensaje: `${codigo} CANCELADA. Sus insumos se liberaron de Stock Comprometido y volvieron al Stock Disponible Real.`,
      });
    } else {
      setFeedback({ tipo: 'danger', mensaje: res.error });
    }
  };

  return (
    <section className="view-shell" aria-label="Agenda diaria de citas">
      <div className="view-header">
        <div>
          <span className="view-eyebrow">Tablero operativo en tiempo real</span>
          <h1 className="view-title">Agenda del Día</h1>
          <p className="view-subtitle">
            Completar o cancelar una cita actualiza automáticamente el inventario
            comprometido y físico.
          </p>
        </div>

        <div className="filter-bar">
          <input
            type="date"
            className="input"
            style={{ width: 'auto' }}
            value={fechaFiltro}
            disabled={mostrarTodasFechas}
            onChange={(e) => setFechaFiltro(e.target.value)}
            aria-label="Filtrar por fecha"
          />
          <button
            type="button"
            className={`btn btn--sm ${
              mostrarTodasFechas ? 'btn--primary' : 'btn--secondary'
            }`}
            onClick={() => setMostrarTodasFechas((prev) => !prev)}
          >
            {mostrarTodasFechas ? 'Viendo todas las fechas' : 'Ver todas'}
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card kpi-card--teal">
          <span className="kpi-label">Reservadas (Stock comprometido)</span>
          <span className="kpi-value">{resumen.reservadas}</span>
        </div>
        <div className="kpi-card kpi-card--emerald">
          <span className="kpi-label">Completadas (Consumo efectivo)</span>
          <span className="kpi-value">{resumen.completadas}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Canceladas (Stock liberado)</span>
          <span className="kpi-value">{resumen.canceladas}</span>
        </div>
      </div>

      {feedback && (
        <div
          className={`alert ${
            feedback.tipo === 'ok' ? 'alert--ok' : 'alert--danger'
          }`}
          role="status"
        >
          {feedback.mensaje}
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Listado cronológico</h2>
          <div className="filter-bar">
            {(['TODAS', 'RESERVADA', 'COMPLETADA', 'CANCELADA'] as const).map(
              (estado) => (
                <button
                  key={estado}
                  type="button"
                  className={`btn btn--sm ${
                    filtroEstado === estado ? 'btn--primary' : 'btn--secondary'
                  }`}
                  onClick={() => setFiltroEstado(estado)}
                >
                  {estado === 'TODAS' ? 'Todas' : estado}
                </button>
              ),
            )}
          </div>
        </div>

        {citasFiltradas.length === 0 ? (
          <div className="empty-state">
            No hay citas registradas para los filtros seleccionados.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hora / Código</th>
                  <th>Paciente</th>
                  <th>Servicio</th>
                  <th>Especialista</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {citasFiltradas.map((cita) => {
                  const servicio = servicioPorId.get(cita.servicioId);
                  const especialista = especialistaPorId.get(cita.especialistaId);

                  return (
                    <tr key={cita.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>
                          {cita.hora}
                        </div>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: '#64748b',
                            fontFamily: 'ui-monospace, Consolas, monospace',
                          }}
                        >
                          {cita.codigo}
                          {mostrarTodasFechas ? ` · ${cita.fecha}` : ''}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{cita.pacienteNombre}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {cita.pacienteTelefono}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {servicio?.nombre ?? cita.servicioId}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {servicio?.tipo === 'VALORACION'
                            ? 'Valoración · 0 insumos'
                            : `Procedimiento · ${servicio?.receta.length ?? 0} insumo(s)`}
                        </div>
                      </td>
                      <td>{especialista?.nombre ?? cita.especialistaId}</td>
                      <td>
                        {cita.estado === 'RESERVADA' && (
                          <span className="badge badge--teal">RESERVADA</span>
                        )}
                        {cita.estado === 'COMPLETADA' && (
                          <span className="badge badge--ok">COMPLETADA</span>
                        )}
                        {cita.estado === 'CANCELADA' && (
                          <span className="badge badge--neutral">CANCELADA</span>
                        )}
                      </td>
                      <td>
                        {cita.estado === 'RESERVADA' ? (
                          <div className="actions-inline">
                            <button
                              type="button"
                              className="btn btn--emerald btn--sm"
                              onClick={() => handleCompletar(cita.id, cita.codigo)}
                            >
                              Completar
                            </button>
                            <button
                              type="button"
                              className="btn btn--danger-outline btn--sm"
                              onClick={() => handleCancelar(cita.id, cita.codigo)}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            Sin acciones
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
