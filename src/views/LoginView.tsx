import { useState, type FormEvent } from 'react';
import { useClinic } from '../context/ClinicContext';
import type { RolUsuario } from '../domain/types';
import './views.css';

interface LoginViewProps {
  readonly onLoginSuccess?: (rol: RolUsuario) => void;
}

const CREDENCIALES_DEMO: Record<RolUsuario, { correo: string; password: string }> = {
  RECEPCIONISTA: {
    correo: 'recepcion@clinicalumina.ec',
    password: 'Lumina2026!',
  },
  ADMIN_BODEGA: {
    correo: 'bodega@clinicalumina.ec',
    password: 'Bodega2026!',
  },
};

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const { consultorio, rolActual, iniciarSesion, cerrarSesion } = useClinic();
  const [rolSeleccionado, setRolSeleccionado] = useState<RolUsuario>(
    rolActual ?? 'RECEPCIONISTA',
  );
  const [correo, setCorreo] = useState<string>(
    CREDENCIALES_DEMO[rolActual ?? 'RECEPCIONISTA'].correo,
  );
  const [password, setPassword] = useState<string>(
    CREDENCIALES_DEMO[rolActual ?? 'RECEPCIONISTA'].password,
  );
  const [error, setError] = useState<string | null>(null);

  const handleSeleccionarRol = (rol: RolUsuario) => {
    setRolSeleccionado(rol);
    setCorreo(CREDENCIALES_DEMO[rol].correo);
    setPassword(CREDENCIALES_DEMO[rol].password);
    setError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!correo.trim() || !password.trim()) {
      setError('Ingresa correo y contraseña para continuar.');
      return;
    }

    setError(null);
    iniciarSesion(rolSeleccionado);
    onLoginSuccess?.(rolSeleccionado);
  };

  return (
    <section className="view-shell" aria-label="Inicio de sesión">
      <div className="login-container">
        <div className="view-header">
          <div>
            <span className="view-eyebrow">Acceso operativo · Demo</span>
            <h1 className="view-title">{consultorio.nombre}</h1>
            <p className="view-subtitle">
              Selecciona un rol operativo para ingresar con credenciales
              precargadas.
            </p>
          </div>
        </div>

        <div className="panel">
          {rolActual && (
            <div className="alert alert--info">
              Sesión activa como{' '}
              <strong>
                {rolActual === 'RECEPCIONISTA'
                  ? 'Recepcionista'
                  : 'Administrador de Bodega'}
              </strong>
              . Puedes cambiar de rol o cerrar sesión abajo.
            </div>
          )}

          {error && <div className="alert alert--danger">{error}</div>}

          <form onSubmit={handleSubmit} className="login-stack">
            <div>
              <span className="view-eyebrow">1. Selector de rol</span>
              <div className="role-grid" role="radiogroup" aria-label="Rol de usuario">
                <button
                  type="button"
                  role="radio"
                  aria-checked={rolSeleccionado === 'RECEPCIONISTA'}
                  className={`role-card ${
                    rolSeleccionado === 'RECEPCIONISTA' ? 'is-selected' : ''
                  }`}
                  onClick={() => handleSeleccionarRol('RECEPCIONISTA')}
                >
                  <span className="role-card-title">Recepcionista</span>
                  <span className="role-card-desc">
                    Agenda citas en 3 pasos, valida stock en vivo y envía
                    comprobantes por WhatsApp.
                  </span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={rolSeleccionado === 'ADMIN_BODEGA'}
                  className={`role-card ${
                    rolSeleccionado === 'ADMIN_BODEGA' ? 'is-selected' : ''
                  }`}
                  onClick={() => handleSeleccionarRol('ADMIN_BODEGA')}
                >
                  <span className="role-card-title">Administrador de Bodega</span>
                  <span className="role-card-desc">
                    Supervisa semáforo Físico vs. Comprometido, repone stock y
                    gestiona recetas.
                  </span>
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="login-correo">Correo institucional</label>
              <input
                id="login-correo"
                type="email"
                className="input"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="login-password">Contraseña</label>
              <input
                id="login-password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="actions-inline">
              <button type="submit" className="btn btn--primary">
                Ingresar como{' '}
                {rolSeleccionado === 'RECEPCIONISTA'
                  ? 'Recepcionista'
                  : 'Admin de Bodega'}
              </button>
              {rolActual && (
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={cerrarSesion}
                >
                  Cerrar sesión
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
