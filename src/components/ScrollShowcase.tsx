import { useEffect, useRef, useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { calcularStockDisponibleReal } from '../domain/stockEngine';
import './ScrollShowcase.css';

interface ScrollShowcaseProps {
  readonly onIrAlSistema: () => void;
}

export function ScrollShowcase({ onIrAlSistema }: ScrollShowcaseProps) {
  const { consultorio, insumos, citas, restaurarDatosDemo } = useClinic();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [recienRestaurado, setRecienRestaurado] = useState(false);

  const insumoDemo =
    insumos.find((item) => item.id === 'ins-gel-blanqueador') ?? insumos[0];
  const fisicoDemo = insumoDemo ? insumoDemo.stockFisico : 3;
  const comprometidoDemo = insumoDemo ? insumoDemo.stockComprometido : 2;
  const disponibleDemo = insumoDemo ? calcularStockDisponibleReal(insumoDemo) : 1;
  const porcentajeComprometido =
    fisicoDemo > 0 ? Math.min(100, Math.round((comprometidoDemo / fisicoDemo) * 100)) : 0;

  const citasActivas = citas.filter((c) => c.estado === 'RESERVADA').length;
  const engineKey = `${fisicoDemo}-${comprometidoDemo}-${disponibleDemo}`;

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !window.ScrollCraft) return;

    const instance = window.ScrollCraft.mount(el);

    return () => {
      instance.destroy();
      document.documentElement.style.removeProperty('--sc-canvas');
    };
  }, [engineKey]);

  const handleRestaurar = () => {
    restaurarDatosDemo();
    setRecienRestaurado(true);
    window.setTimeout(() => setRecienRestaurado(false), 1800);
  };

  return (
    <div
      key={engineKey}
      ref={rootRef}
      className="showcase"
      aria-label="Presentación interactiva con Scroll Craft"
    >
      {/* Barra de progreso superior conducida por scrollcraft.js */}
      <div data-sc-progress="" aria-hidden="true" />
      <div className="sc-grain" aria-hidden="true" />

      {/* Header fijo con botón de restauración rápida */}
      <header className="showcase-topbar">
        <div className="showcase-brand">
          <span className="showcase-brand-dot" aria-hidden="true" />
          <span className="showcase-brand-name">{consultorio.nombre}</span>
        </div>
        <div className="showcase-topbar-actions">
          <button
            type="button"
            className="showcase-btn-ghost"
            onClick={handleRestaurar}
            title="Reinicia el inventario y las citas a los valores iniciales de la demo"
          >
            {recienRestaurado ? '✓ Datos restaurados' : 'Restaurar datos demo'}
          </button>
          <button
            type="button"
            className="showcase-btn-mini"
            onClick={onIrAlSistema}
          >
            Ir al Sistema →
          </button>
        </div>
      </header>

      {/* ===================================================================
          ACTO 1 (FLOW + PARALLAX + TILT + DRIFT):
          Hero dimensional y el problema de agendar sin validar insumos
         =================================================================== */}
      <section
        className="sc-section showcase-act showcase-act--hero"
        data-sc-act="flow"
        data-sc-drift="#0b1320"
      >
        {/* Planos dimensionales independientes movidos por data-sc-parallax */}
        <div
          className="hero-plane hero-plane--grid"
          data-sc-parallax="-0.22"
          aria-hidden="true"
        />
        <div
          className="hero-plane hero-plane--glow"
          data-sc-parallax="0.18"
          aria-hidden="true"
        />

        <div className="sc-wrap showcase-hero-grid">
          <div className="showcase-hero-copy" data-sc-stagger="85">
            <span className="sc-label showcase-eyebrow">
              01 · El problema operativo
            </span>
            <h1 className="sc-display sc-display--lg showcase-hero-title">
              Agendar mirando solo el calendario{' '}
              <span className="showcase-accent-text">
                provoca quiebres en cabina.
              </span>
            </h1>
            <p className="sc-lede showcase-hero-lede">
              Confirmar un procedimiento sin descontar los insumos críticos ya
              comprometidos por otras citas termina en pacientes reprogramados en
              plena consulta y pérdida de confianza.
            </p>
            <div className="showcase-hero-scroll-hint">
              <span className="sc-label">Desliza para ver la regla en vivo</span>
              <span className="showcase-scroll-line" aria-hidden="true" />
            </div>
          </div>

          {/* Plano frontal dimensional con tilt 3D + spotlight */}
          <div
            className="hero-telemetry-stack"
            data-sc-parallax="0.28"
          >
            <div
              className="telemetry-card telemetry-card--danger"
              data-sc-tilt="6"
              data-sc-spotlight=""
            >
              <div className="telemetry-card-head">
                <span className="sc-label">Sin control de stock</span>
                <span className="telemetry-tag telemetry-tag--danger">
                  Quiebre en cabina
                </span>
              </div>
              <h3>Agenda desconectada de bodega</h3>
              <p>
                Recepción ve {fisicoDemo} jeringas físicas y agenda 4
                blanqueamientos. Al llegar el paciente, el insumo ya se agotó.
              </p>
            </div>

            <div
              className="telemetry-card telemetry-card--ok"
              data-sc-tilt="6"
              data-sc-spotlight=""
            >
              <div className="telemetry-card-head">
                <span className="sc-label">Con Bloqueo Preventivo</span>
                <span className="telemetry-tag telemetry-tag--ok">
                  {citasActivas} citas protegidas hoy
                </span>
              </div>
              <h3>Validación al instante de reservar</h3>
              <p>
                Cada procedimiento compromete su receta al agendar. Si el
                disponible real llega a cero, la sobreventa se bloquea antes de
                confirmar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          ACTO 2 (PIN + DWELL + CUE + COUNT + REVEAL + KINETIC + DRIFT):
          La fórmula visual interactiva conducida por el scroll
         =================================================================== */}
      <section
        className="showcase-act showcase-act--pin"
        data-sc-act="pin"
        data-sc-span="2.3"
        data-sc-dwell="0.35"
        data-sc-drift="#082f2e"
      >
        <div className="sc-stage showcase-pin-stage" data-sc-stage="">
          <div className="sc-wrap showcase-pin-inner">
            <div className="showcase-pin-chrome">
              <span className="sc-label showcase-eyebrow">
                02 · Arquitectura de inventario
              </span>
              <div className="pin-progress-track" aria-hidden="true">
                <div className="pin-progress-fill" />
              </div>
            </div>

            {/* CUE 1: La fórmula visual + contadores animados por scroll */}
            <div
              className="pin-scene"
              data-sc-cue="0.0 0.48 0.0 0.24"
              data-sc-rise="0.7"
            >
              <h2 className="sc-display sc-display--md showcase-pin-title">
                La fórmula que gobierna cada cita
              </h2>
              <p className="sc-body showcase-pin-body">
                No agendamos con el stock físico bruto. La única verdad operativa
                es el <strong>Stock Disponible Real</strong>, calculado en tiempo
                real sobre <strong>{insumoDemo?.nombre ?? 'Gel Blanqueador'}</strong>.
              </p>

              <div
                className="showcase-formula"
                role="group"
                aria-label="Fórmula de Stock Disponible Real"
              >
                <div className="formula-term formula-term--result">
                  <span className="sc-label">Stock Disponible Real</span>
                  <strong
                    className="formula-value sc-nums"
                    data-sc-count={`0 ${disponibleDemo}`}
                    data-sc-count-at="0.02 0.28"
                  >
                    {disponibleDemo}
                  </strong>
                  <span className="formula-hint">
                    {disponibleDemo <= 0
                      ? 'Bloqueo preventivo activo'
                      : 'Libre para confirmar ahora'}
                  </span>
                </div>

                <span className="formula-operator" aria-hidden="true">
                  =
                </span>

                <div className="formula-term">
                  <span className="sc-label">Stock Físico</span>
                  <strong
                    className="formula-value sc-nums"
                    data-sc-count={`0 ${fisicoDemo}`}
                    data-sc-count-at="0.02 0.24"
                  >
                    {fisicoDemo}
                  </strong>
                  <span className="formula-hint">Unidades hoy en bodega</span>
                </div>

                <span className="formula-operator" aria-hidden="true">
                  −
                </span>

                <div className="formula-term formula-term--committed">
                  <span className="sc-label">Stock Comprometido</span>
                  <strong
                    className="formula-value sc-nums"
                    data-sc-count={`0 ${comprometidoDemo}`}
                    data-sc-count-at="0.04 0.28"
                  >
                    {comprometidoDemo}
                  </strong>
                  <span className="formula-hint">
                    Reservado por citas activas
                  </span>
                </div>
              </div>

              <div className="formula-bar-wrap">
                <div className="formula-bar-labels">
                  <span className="sc-label">
                    Capacidad comprometida: {porcentajeComprometido}%
                  </span>
                  <span className="sc-label">
                    {insumoDemo?.nombre} ({insumoDemo?.unidad}s)
                  </span>
                </div>
                <div className="formula-bar-track">
                  <div
                    className="formula-bar-fill"
                    style={{ width: `${porcentajeComprometido}%` }}
                    data-sc-reveal="left"
                    data-sc-reveal-at="0.05 0.32"
                  />
                </div>
              </div>
            </div>

            {/* CUE 2: El momento pico — Bloqueo Preventivo + texto cinético */}
            <div
              className="pin-scene pin-scene--peak"
              data-sc-cue="0.52 1.0 0.25 0.0"
              data-sc-rise="0.7"
            >
              <span className="peak-badge">Bloqueo Preventivo en vivo</span>
              <h2
                className="sc-display sc-display--md showcase-pin-title"
                data-sc-cue="0.54 1.0 0.28 0.0"
                data-sc-kinetic="words"
              >
                Cuando el disponible real llega a cero el sistema frena la reserva antes de fallarle al paciente
              </h2>
              <div className="peak-transitions">
                <div className="peak-rule">
                  <span className="sc-label">Al Reservar</span>
                  <strong>+ Comprometido</strong>
                  <p>Valida disponible real y aparta la receta al instante.</p>
                </div>
                <div className="peak-rule">
                  <span className="sc-label">Al Completar</span>
                  <strong>− Físico y − Comprometido</strong>
                  <p>Registra el consumo clínico definitivo en bodega.</p>
                </div>
                <div className="peak-rule">
                  <span className="sc-label">Al Cancelar</span>
                  <strong>− Comprometido</strong>
                  <p>Libera las unidades y desbloquea la agenda al momento.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          ACTO 3 (FLOW + STAGGER + SPOTLIGHT + MAGNET + DRIFT -> LIGHT):
          Llamado directo al Sistema Operativo
         =================================================================== */}
      <section
        className="sc-section showcase-act showcase-act--cta"
        data-sc-act="flow"
        data-sc-drift="#f8fafc"
      >
        <div className="sc-wrap">
          <div
            className="cta-surface"
            data-sc-in=""
            data-sc-spotlight=""
          >
            <div className="cta-content" data-sc-stagger="90">
              <span className="sc-label showcase-eyebrow showcase-eyebrow--light">
                03 · Demostración interactiva
              </span>
              <h2 className="sc-display sc-display--md cta-title">
                Pon a prueba el bloqueo preventivo en 3 pasos
              </h2>
              <p className="sc-body cta-body">
                Ahora mismo queda{' '}
                <strong>
                  {disponibleDemo} unidad disponible real
                </strong>{' '}
                de <strong>{insumoDemo?.nombre}</strong>. Agenda un{' '}
                <strong>Blanqueamiento Dental LED</strong>, genera su
                comprobante por WhatsApp y comprueba cómo la siguiente reserva
                queda bloqueada automáticamente.
              </p>
              <div className="cta-actions">
                <button
                  type="button"
                  className="showcase-btn-primary"
                  data-sc-magnet="0.28"
                  onClick={onIrAlSistema}
                >
                  Ir al Sistema Operativo
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
