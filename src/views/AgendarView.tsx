import { useMemo, useState, type FormEvent } from 'react';
import { useClinic } from '../context/ClinicContext';
import { FECHA_DEMO_HOY } from '../data/mockClinicData';
import { calcularStockDisponibleReal } from '../domain/stockEngine';
import type { Cita } from '../domain/types';
import './views.css';

const FRANJAS_HORARIAS: readonly string[] = [
  '08:30',
  '09:30',
  '10:30',
  '11:00',
  '12:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

function normalizarTelefonoWhatsApp(telefono: string): string {
  const soloDigitos = telefono.replace(/\D/g, '');
  if (soloDigitos.startsWith('0') && soloDigitos.length === 10) {
    return `593${soloDigitos.slice(1)}`;
  }
  return soloDigitos;
}

export function AgendarView() {
  const {
    consultorio,
    especialistas,
    servicios,
    insumos,
    citas,
    verificarDisponibilidad,
    agendarCita,
  } = useClinic();

  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [servicioId, setServicioId] = useState<string>(
    servicios[2]?.id ?? servicios[0]?.id ?? '',
  );
  const [fecha, setFecha] = useState<string>(FECHA_DEMO_HOY);
  const [especialistaId, setEspecialistaId] = useState<string>(
    especialistas[0]?.id ?? '',
  );
  const [hora, setHora] = useState<string>('');
  const [pacienteNombre, setPacienteNombre] = useState<string>('');
  const [pacienteTelefono, setPacienteTelefono] = useState<string>('');
  const [errorReserva, setErrorReserva] = useState<string | null>(null);
  const [citaConfirmada, setCitaConfirmada] = useState<Cita | null>(null);

  const insumoPorId = useMemo(
    () => new Map(insumos.map((item) => [item.id, item])),
    [insumos],
  );

  const servicioSeleccionado = useMemo(
    () => servicios.find((s) => s.id === servicioId) ?? null,
    [servicios, servicioId],
  );

  const disponibilidadSeleccionada = useMemo(
    () =>
      servicioId
        ? verificarDisponibilidad(servicioId)
        : { disponible: false, faltantes: [] },
    [servicioId, verificarDisponibilidad],
  );

  const especialistaSeleccionado = useMemo(
    () => especialistas.find((e) => e.id === especialistaId) ?? null,
    [especialistas, especialistaId],
  );

  const horasOcupadas = useMemo(() => {
    const ocupadas = new Set<string>();
    for (const cita of citas) {
      if (
        cita.estado === 'RESERVADA' &&
        cita.fecha === fecha &&
        cita.especialistaId === especialistaId
      ) {
        ocupadas.add(cita.hora);
      }
    }
    return ocupadas;
  }, [citas, fecha, especialistaId]);

  const handleConfirmar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pacienteNombre.trim() || !pacienteTelefono.trim()) {
      setErrorReserva('Completa el nombre y el teléfono del paciente.');
      return;
    }

    const resultado = agendarCita({
      servicioId,
      fecha,
      hora,
      especialistaId,
      pacienteNombre,
      pacienteTelefono,
    });

    if (!resultado.ok) {
      setErrorReserva(resultado.error);
      return;
    }

    setErrorReserva(null);
    setCitaConfirmada(resultado.cita);
  };

  const handleNuevaCita = () => {
    setCitaConfirmada(null);
    setPaso(1);
    setHora('');
    setPacienteNombre('');
    setPacienteTelefono('');
    setErrorReserva(null);
  };

  if (citaConfirmada) {
    const servicioCita = servicios.find((s) => s.id === citaConfirmada.servicioId);
    const especialistaCita = especialistas.find(
      (e) => e.id === citaConfirmada.especialistaId,
    );
    const telefonoDestino = normalizarTelefonoWhatsApp(
      citaConfirmada.pacienteTelefono,
    );
    const mensajeWhatsApp = [
      `Hola ${citaConfirmada.pacienteNombre}, tu cita en *${consultorio.nombre}* ha sido confirmada.`,
      '',
      `*Código:* ${citaConfirmada.codigo}`,
      `*Servicio:* ${servicioCita?.nombre ?? citaConfirmada.servicioId}`,
      `*Especialista:* ${especialistaCita?.nombre ?? citaConfirmada.especialistaId}`,
      `*Fecha y hora:* ${citaConfirmada.fecha} a las ${citaConfirmada.hora}`,
      `*Dirección:* ${consultorio.direccion}`,
      `*Referencia:* ${consultorio.referencia}`,
      '',
      'Tus insumos clínicos quedaron reservados automáticamente. ¡Te esperamos!',
    ].join('\n');

    const whatsappUrl = `https://wa.me/${telefonoDestino}?text=${encodeURIComponent(
      mensajeWhatsApp,
    )}`;

    return (
      <section className="view-shell" aria-label="Comprobante de cita confirmada">
        <div className="voucher">
          <div className="voucher-header">
            <div>
              <span className="badge badge--ok">Cita Confirmada · Stock Comprometido</span>
              <h1 style={{ margin: '0.5rem 0 0', fontSize: '1.45rem', color: '#fff' }}>
                Comprobante de Cita
              </h1>
            </div>
            <span className="voucher-code">{citaConfirmada.codigo}</span>
          </div>

          <div className="voucher-body">
            <div className="voucher-field">
              <span className="voucher-label">Paciente</span>
              <span className="voucher-value">{citaConfirmada.pacienteNombre}</span>
            </div>
            <div className="voucher-field">
              <span className="voucher-label">Teléfono</span>
              <span className="voucher-value">{citaConfirmada.pacienteTelefono}</span>
            </div>
            <div className="voucher-field">
              <span className="voucher-label">Servicio</span>
              <span className="voucher-value">
                {servicioCita?.nombre ?? citaConfirmada.servicioId}
              </span>
            </div>
            <div className="voucher-field">
              <span className="voucher-label">Especialista</span>
              <span className="voucher-value">
                {especialistaCita?.nombre ?? citaConfirmada.especialistaId}
              </span>
            </div>
            <div className="voucher-field">
              <span className="voucher-label">Fecha</span>
              <span className="voucher-value">{citaConfirmada.fecha}</span>
            </div>
            <div className="voucher-field">
              <span className="voucher-label">Hora</span>
              <span className="voucher-value">{citaConfirmada.hora}</span>
            </div>
            <div className="voucher-field voucher-field--full">
              <span className="voucher-label">Consultorio y dirección</span>
              <span className="voucher-value">
                {consultorio.nombre} — {consultorio.direccion}
              </span>
              <span style={{ fontSize: '0.84rem', color: '#475569' }}>
                Referencia: {consultorio.referencia}
              </span>
            </div>
          </div>

          <div className="voucher-footer">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleNuevaCita}
            >
              Agendar otra cita
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--whatsapp"
            >
              Enviar por WhatsApp
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="view-shell" aria-label="Agendar nueva cita">
      <div className="view-header">
        <div>
          <span className="view-eyebrow">Flujo guiado con Bloqueo Preventivo</span>
          <h1 className="view-title">Agendar Cita</h1>
          <p className="view-subtitle">
            Cada procedimiento valida el Stock Disponible Real antes de permitir
            la reserva.
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="stepper" aria-label="Progreso de agendamiento">
        <div
          className={`step-pill ${
            paso === 1 ? 'is-active' : paso > 1 ? 'is-done' : ''
          }`}
        >
          <span className="step-num">1</span>
          <span>Servicio y Stock</span>
        </div>
        <div
          className={`step-pill ${
            paso === 2 ? 'is-active' : paso > 2 ? 'is-done' : ''
          }`}
        >
          <span className="step-num">2</span>
          <span>Fecha, Hora y Especialista</span>
        </div>
        <div className={`step-pill ${paso === 3 ? 'is-active' : ''}`}>
          <span className="step-num">3</span>
          <span>Paciente y Comprobante</span>
        </div>
      </div>

      {/* PASO 1 */}
      {paso === 1 && (
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Paso 1 · Selecciona el servicio</h2>
            <span className="badge badge--teal">
              Validación automática de insumos críticos
            </span>
          </div>

          {!disponibilidadSeleccionada.disponible && servicioSeleccionado && (
            <div className="alert alert--danger" role="alert">
              <strong>Bloqueo preventivo activo:</strong>{' '}
              {servicioSeleccionado.nombre} requiere reposición antes de agendar.
              Faltantes:{' '}
              {disponibilidadSeleccionada.faltantes
                .map(
                  (f) =>
                    `${f.nombre} (requiere ${f.requerido}, disponible real ${f.disponibleReal})`,
                )
                .join(' · ')}
              .
            </div>
          )}

          <div className="service-grid">
            {servicios.map((servicio) => {
              const disp = verificarDisponibilidad(servicio.id);
              const seleccionado = servicio.id === servicioId;

              return (
                <button
                  key={servicio.id}
                  type="button"
                  className={`service-card ${seleccionado ? 'is-selected' : ''} ${
                    !disp.disponible ? 'is-blocked' : ''
                  }`}
                  onClick={() => {
                    setServicioId(servicio.id);
                    setErrorReserva(null);
                  }}
                >
                  <div className="service-card-top">
                    <h3 className="service-card-name">{servicio.nombre}</h3>
                    {disp.disponible ? (
                      <span className="badge badge--ok">Stock OK</span>
                    ) : (
                      <span className="badge badge--danger">
                        Reposición Requerida
                      </span>
                    )}
                  </div>

                  <p className="service-card-desc">{servicio.descripcion}</p>

                  {servicio.tipo === 'VALORACION' ? (
                    <div className="recipe-chips">
                      <span className="recipe-chip">Valoración · 0 insumos</span>
                    </div>
                  ) : (
                    <div className="recipe-chips">
                      {servicio.receta.map((item) => {
                        const insumo = insumoPorId.get(item.insumoId);
                        const disponibleReal = insumo
                          ? calcularStockDisponibleReal(insumo)
                          : 0;
                        const falta = disponibleReal < item.cantidad;

                        return (
                          <span
                            key={item.insumoId}
                            className={`recipe-chip ${
                              falta ? 'recipe-chip--missing' : ''
                            }`}
                          >
                            {item.cantidad}× {insumo?.nombre ?? item.insumoId} (disp:{' '}
                            {disponibleReal})
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="service-card-meta">
                    <span>{servicio.duracionMinutos} min</span>
                    <span>·</span>
                    <span>${servicio.precio}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="step-actions">
            <span style={{ fontSize: '0.86rem', color: '#475569' }}>
              {servicioSeleccionado
                ? `Seleccionado: ${servicioSeleccionado.nombre}`
                : 'Selecciona un servicio para continuar'}
            </span>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!servicioSeleccionado || !disponibilidadSeleccionada.disponible}
              onClick={() => setPaso(2)}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* PASO 2 */}
      {paso === 2 && (
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">
              Paso 2 · Elige fecha, especialista y franja horaria
            </h2>
            {servicioSeleccionado && (
              <span className="badge badge--ok">{servicioSeleccionado.nombre}</span>
            )}
          </div>

          <div className="form-grid" style={{ marginBottom: '1.25rem' }}>
            <div className="field">
              <label htmlFor="agendar-fecha">Fecha de la cita</label>
              <input
                id="agendar-fecha"
                type="date"
                className="input"
                value={fecha}
                onChange={(e) => {
                  setFecha(e.target.value);
                  setHora('');
                }}
              />
            </div>

            <div className="field">
              <label htmlFor="agendar-especialista">Especialista</label>
              <select
                id="agendar-especialista"
                className="select"
                value={especialistaId}
                onChange={(e) => {
                  setEspecialistaId(e.target.value);
                  setHora('');
                }}
              >
                {especialistas.map((esp) => (
                  <option key={esp.id} value={esp.id}>
                    {esp.nombre} — {esp.especialidad}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Franjas horarias disponibles ({fecha})</label>
            <div className="slots-grid">
              {FRANJAS_HORARIAS.map((franja) => {
                const ocupada = horasOcupadas.has(franja);
                const seleccionada = hora === franja;

                return (
                  <button
                    key={franja}
                    type="button"
                    disabled={ocupada}
                    className={`slot-btn ${seleccionada ? 'is-selected' : ''}`}
                    onClick={() => setHora(franja)}
                  >
                    <span>{franja}</span>
                    <span className="slot-tag">
                      {ocupada ? 'Ocupada' : seleccionada ? 'Elegida' : 'Libre'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="step-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setPaso(1)}
            >
              ← Anterior
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!fecha || !especialistaId || !hora}
              onClick={() => setPaso(3)}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* PASO 3 */}
      {paso === 3 && (
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Paso 3 · Datos del paciente</h2>
            <span className="badge badge--teal">
              {fecha} · {hora}
            </span>
          </div>

          {errorReserva && (
            <div className="alert alert--danger" role="alert">
              {errorReserva}
            </div>
          )}

          <div className="alert alert--info">
            <strong>Resumen:</strong> {servicioSeleccionado?.nombre} con{' '}
            {especialistaSeleccionado?.nombre} el {fecha} a las {hora}.
            {servicioSeleccionado?.tipo === 'PROCEDIMIENTO' && (
              <span>
                {' '}
                Al confirmar se comprometerá su receta de insumos críticos.
              </span>
            )}
          </div>

          <form onSubmit={handleConfirmar}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="paciente-nombre">Nombre completo del paciente</label>
                <input
                  id="paciente-nombre"
                  type="text"
                  className="input"
                  placeholder="Ej. María Fernanda Castro"
                  value={pacienteNombre}
                  onChange={(e) => setPacienteNombre(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="paciente-telefono">
                  Teléfono WhatsApp del paciente
                </label>
                <input
                  id="paciente-telefono"
                  type="tel"
                  className="input"
                  placeholder="Ej. 0991234567"
                  value={pacienteTelefono}
                  onChange={(e) => setPacienteTelefono(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="step-actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setPaso(2)}
              >
                ← Anterior
              </button>
              <button type="submit" className="btn btn--emerald">
                Confirmar Cita y Comprometer Stock
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
