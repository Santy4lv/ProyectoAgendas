import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  CITAS_INICIALES,
  CONSULTORIO_CONFIG,
  ESPECIALISTAS_INICIALES,
  INSUMOS_CRITICOS_INICIALES,
  SERVICIOS_INICIALES,
} from '../data/mockClinicData';
import {
  cancelarCita,
  completarCita,
  reponerStockInsumo,
  reservarCita,
  verificarDisponibilidadServicio,
} from '../domain/stockEngine';
import type {
  Cita,
  ConsultorioConfig,
  Especialista,
  InsumoCritico,
  NuevaCitaInput,
  RecetaItem,
  ResultadoDisponibilidad,
  ResultadoReservaCita,
  ResultadoTransicionCita,
  RolUsuario,
  Servicio,
} from '../domain/types';

const STORAGE_KEY = 'clinica-stock-mvp:estado:v1';

interface EstadoPersistido {
  insumos: InsumoCritico[];
  citas: Cita[];
  servicios: Servicio[];
  rolActual: RolUsuario | null;
}

function clonarServiciosIniciales(): Servicio[] {
  return SERVICIOS_INICIALES.map((servicio) =>
    servicio.tipo === 'VALORACION'
      ? { ...servicio, receta: [] }
      : {
          ...servicio,
          receta: servicio.receta.map((item) => ({ ...item })),
        },
  );
}

function crearEstadoInicial(): EstadoPersistido {
  return {
    insumos: INSUMOS_CRITICOS_INICIALES.map((insumo) => ({ ...insumo })),
    citas: CITAS_INICIALES.map((cita) => ({ ...cita })),
    servicios: clonarServiciosIniciales(),
    rolActual: null,
  };
}

function cargarEstadoDesdeStorage(): EstadoPersistido {
  if (typeof window === 'undefined') {
    return crearEstadoInicial();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return crearEstadoInicial();
    }

    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('insumos' in parsed) ||
      !('citas' in parsed)
    ) {
      return crearEstadoInicial();
    }

    const candidato = parsed as Partial<EstadoPersistido>;
    if (!Array.isArray(candidato.insumos) || !Array.isArray(candidato.citas)) {
      return crearEstadoInicial();
    }

    const rolValido: RolUsuario | null =
      candidato.rolActual === 'RECEPCIONISTA' ||
      candidato.rolActual === 'ADMIN_BODEGA'
        ? candidato.rolActual
        : null;

    const serviciosValidos = Array.isArray(candidato.servicios)
      ? candidato.servicios
      : clonarServiciosIniciales();

    return {
      insumos: candidato.insumos,
      citas: candidato.citas,
      servicios: serviciosValidos,
      rolActual: rolValido,
    };
  } catch {
    return crearEstadoInicial();
  }
}

export interface ClinicContextValue {
  readonly consultorio: ConsultorioConfig;
  readonly especialistas: readonly Especialista[];
  readonly servicios: readonly Servicio[];
  readonly insumos: readonly InsumoCritico[];
  readonly citas: readonly Cita[];
  readonly rolActual: RolUsuario | null;
  readonly ultimaCitaCreada: Cita | null;
  readonly iniciarSesion: (rol: RolUsuario) => void;
  readonly cerrarSesion: () => void;
  readonly verificarDisponibilidad: (servicioId: string) => ResultadoDisponibilidad;
  readonly agendarCita: (nuevaCita: NuevaCitaInput) => ResultadoReservaCita;
  readonly marcarCitaCompletada: (citaId: string) => ResultadoTransicionCita;
  readonly marcarCitaCancelada: (citaId: string) => ResultadoTransicionCita;
  readonly reponerStock: (insumoId: string, cantidad: number) => void;
  readonly actualizarRecetaServicio: (
    servicioId: string,
    receta: readonly RecetaItem[],
  ) => void;
  readonly restaurarDatosDemo: () => void;
}

const ClinicContext = createContext<ClinicContextValue | null>(null);

interface ClinicProviderProps {
  readonly children: ReactNode;
}

export function ClinicProvider({ children }: ClinicProviderProps) {
  const [estado, setEstado] = useState<EstadoPersistido>(cargarEstadoDesdeStorage);
  const [ultimaCitaCreada, setUltimaCitaCreada] = useState<Cita | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    } catch {
      // Si el almacenamiento está lleno o bloqueado, continuamos en memoria.
    }
  }, [estado]);

  const iniciarSesion = useCallback((rol: RolUsuario) => {
    setEstado((prev) => ({ ...prev, rolActual: rol }));
  }, []);

  const cerrarSesion = useCallback(() => {
    setEstado((prev) => ({ ...prev, rolActual: null }));
  }, []);

  const verificarDisponibilidad = useCallback(
    (servicioId: string): ResultadoDisponibilidad => {
      const servicio = estado.servicios.find((s) => s.id === servicioId);
      if (!servicio) {
        return { disponible: false, faltantes: [] };
      }
      return verificarDisponibilidadServicio(servicio, estado.insumos);
    },
    [estado.servicios, estado.insumos],
  );

  const agendarCita = useCallback(
    (nuevaCita: NuevaCitaInput): ResultadoReservaCita => {
      const resultado = reservarCita({
        nuevaCita,
        citas: estado.citas,
        servicios: estado.servicios,
        insumos: estado.insumos,
      });

      if (resultado.ok) {
        setEstado((prev) => ({
          ...prev,
          citas: resultado.citas,
          insumos: resultado.insumos,
        }));
        setUltimaCitaCreada(resultado.cita);
      }

      return resultado;
    },
    [estado.citas, estado.servicios, estado.insumos],
  );

  const marcarCitaCompletada = useCallback(
    (citaId: string): ResultadoTransicionCita => {
      const resultado = completarCita({
        citaId,
        citas: estado.citas,
        servicios: estado.servicios,
        insumos: estado.insumos,
      });

      if (resultado.ok) {
        setEstado((prev) => ({
          ...prev,
          citas: resultado.citas,
          insumos: resultado.insumos,
        }));
      }

      return resultado;
    },
    [estado.citas, estado.servicios, estado.insumos],
  );

  const marcarCitaCancelada = useCallback(
    (citaId: string): ResultadoTransicionCita => {
      const resultado = cancelarCita({
        citaId,
        citas: estado.citas,
        servicios: estado.servicios,
        insumos: estado.insumos,
      });

      if (resultado.ok) {
        setEstado((prev) => ({
          ...prev,
          citas: resultado.citas,
          insumos: resultado.insumos,
        }));
      }

      return resultado;
    },
    [estado.citas, estado.servicios, estado.insumos],
  );

  const reponerStock = useCallback((insumoId: string, cantidad: number) => {
    setEstado((prev) => ({
      ...prev,
      insumos: reponerStockInsumo(prev.insumos, insumoId, cantidad),
    }));
  }, []);

  const actualizarRecetaServicio = useCallback(
    (servicioId: string, receta: readonly RecetaItem[]) => {
      const recetaLimpia = receta
        .filter((item) => item.cantidad > 0)
        .map((item) => ({
          insumoId: item.insumoId,
          cantidad: Math.max(1, Math.floor(item.cantidad)),
        }));

      setEstado((prev) => ({
        ...prev,
        servicios: prev.servicios.map((servicio) => {
          if (servicio.id !== servicioId || servicio.tipo !== 'PROCEDIMIENTO') {
            return servicio;
          }
          return {
            ...servicio,
            receta: recetaLimpia,
          };
        }),
      }));
    },
    [],
  );

  const restaurarDatosDemo = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignorar si localStorage no está disponible.
    }
    setEstado((prev) => ({
      ...crearEstadoInicial(),
      rolActual: prev.rolActual,
    }));
    setUltimaCitaCreada(null);
  }, []);

  const value = useMemo<ClinicContextValue>(
    () => ({
      consultorio: CONSULTORIO_CONFIG,
      especialistas: ESPECIALISTAS_INICIALES,
      servicios: estado.servicios,
      insumos: estado.insumos,
      citas: estado.citas,
      rolActual: estado.rolActual,
      ultimaCitaCreada,
      iniciarSesion,
      cerrarSesion,
      verificarDisponibilidad,
      agendarCita,
      marcarCitaCompletada,
      marcarCitaCancelada,
      reponerStock,
      actualizarRecetaServicio,
      restaurarDatosDemo,
    }),
    [
      estado.servicios,
      estado.insumos,
      estado.citas,
      estado.rolActual,
      ultimaCitaCreada,
      iniciarSesion,
      cerrarSesion,
      verificarDisponibilidad,
      agendarCita,
      marcarCitaCompletada,
      marcarCitaCancelada,
      reponerStock,
      actualizarRecetaServicio,
      restaurarDatosDemo,
    ],
  );

  return (
    <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>
  );
}

export function useClinic(): ClinicContextValue {
  const ctx = useContext(ClinicContext);
  if (!ctx) {
    throw new Error('useClinic debe utilizarse dentro de un <ClinicProvider>.');
  }
  return ctx;
}
