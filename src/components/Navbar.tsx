import { useMemo, useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { obtenerNivelStock } from '../domain/stockEngine';
import './Navbar.css';

export type RutaApp = '/' | '/login' | '/agendar' | '/agenda' | '/inventario';

interface NavbarProps {
  readonly rutaActual: RutaApp;
  readonly onNavegar: (ruta: RutaApp) => void;
}

export function Navbar({ rutaActual, onNavegar }: NavbarProps) {
  const { consultorio, citas, insumos, rolActual, restaurarDatosDemo } = useClinic();
  const [recienRestaurado, setRecienRestaurado] = useState(false);

  const citasReservadas = useMemo(
    () => citas.filter((c) => c.estado === 'RESERVADA').length,
    [citas],
  );

  const insumosCriticosEnAlerta = useMemo(
    () =>
      insumos.filter((ins) => {
        const nivel = obtenerNivelStock(ins);
        return nivel === 'AGOTADO' || nivel === 'BAJO';
      }).length,
    [insumos],
  );

  const handleRestaurar = () => {
    restaurarDatosDemo();
    setRecienRestaurado(true);
    window.setTimeout(() => setRecienRestaurado(false), 1800);
  };

  const enlaces: readonly {
    readonly ruta: Exclude<RutaApp, '/'>;
    readonly etiqueta: string;
    readonly contador?: number;
    readonly alerta?: boolean;
  }[] = [
    { ruta: '/agendar', etiqueta: 'Agendar' },
    { ruta: '/agenda', etiqueta: 'Agenda', contador: citasReservadas },
    {
      ruta: '/inventario',
      etiqueta: 'Inventario',
      contador: insumosCriticosEnAlerta,
      alerta: insumosCriticosEnAlerta > 0,
    },
    { ruta: '/login', etiqueta: 'Acceso / Rol' },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <button
          type="button"
          className="navbar-brand"
          onClick={() => onNavegar('/')}
          title="Volver a la presentación inicial"
        >
          <span className="navbar-brand-mark" aria-hidden="true" />
          <span className="navbar-brand-text">
            <strong>{consultorio.nombre}</strong>
            <small>Agendamiento Vinculado a Stock</small>
          </span>
        </button>

        <nav className="navbar-links" aria-label="Navegación principal">
          {enlaces.map((item) => {
            const activo = rutaActual === item.ruta;
            return (
              <a
                key={item.ruta}
                href={item.ruta}
                className={`navbar-link ${activo ? 'is-active' : ''}`}
                aria-current={activo ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  onNavegar(item.ruta);
                }}
              >
                <span>{item.etiqueta}</span>
                {item.contador !== undefined && item.contador > 0 && (
                  <span
                    className={`navbar-pill ${
                      item.alerta ? 'navbar-pill--alert' : ''
                    }`}
                  >
                    {item.contador}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        <div className="navbar-actions">
          <button
            type="button"
            className="navbar-role-chip"
            onClick={() => onNavegar('/login')}
            title="Cambiar rol operativo"
          >
            <span
              className={`navbar-role-dot ${rolActual ? 'is-online' : ''}`}
              aria-hidden="true"
            />
            <span>
              {rolActual === 'RECEPCIONISTA'
                ? 'Recepcionista'
                : rolActual === 'ADMIN_BODEGA'
                  ? 'Admin Bodega'
                  : 'Sin sesión'}
            </span>
          </button>

          <button
            type="button"
            className={`navbar-reset-btn ${recienRestaurado ? 'is-done' : ''}`}
            onClick={handleRestaurar}
            title="Restaura inventario, recetas y citas al escenario inicial de la demo"
          >
            {recienRestaurado ? '✓ Datos restaurados' : 'Restaurar datos demo'}
          </button>
        </div>
      </div>
    </header>
  );
}
