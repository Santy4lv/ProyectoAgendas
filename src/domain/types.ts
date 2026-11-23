export type RolUsuario = 'RECEPCIONISTA' | 'ADMIN_BODEGA';

export interface ConsultorioConfig {
  readonly nombre: string;
  readonly direccion: string;
  readonly referencia: string;
  readonly telefonoWhatsApp?: string;
}

export interface Especialista {
  readonly id: string;
  readonly nombre: string;
  readonly especialidad: string;
}

export interface InsumoCritico {
  readonly id: string;
  readonly nombre: string;
  readonly unidad: string;
  readonly stockFisico: number;
  readonly stockComprometido: number;
  readonly stockMinimo: number;
}

export type NivelStock = 'OK' | 'BAJO' | 'AGOTADO';

export interface RecetaItem {
  readonly insumoId: string;
  readonly cantidad: number;
}

export type TipoServicio = 'VALORACION' | 'PROCEDIMIENTO';

interface ServicioBase {
  readonly id: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly duracionMinutos: number;
  readonly precio: number;
}

export interface ServicioValoracion extends ServicioBase {
  readonly tipo: 'VALORACION';
  readonly receta: readonly [];
}

export interface ServicioProcedimiento extends ServicioBase {
  readonly tipo: 'PROCEDIMIENTO';
  readonly receta: readonly RecetaItem[];
}

export type Servicio = ServicioValoracion | ServicioProcedimiento;

export type EstadoCita = 'RESERVADA' | 'COMPLETADA' | 'CANCELADA';

export interface Cita {
  readonly id: string;
  readonly codigo: string;
  readonly estado: EstadoCita;
  readonly fecha: string; // YYYY-MM-DD
  readonly hora: string; // HH:mm
  readonly pacienteNombre: string;
  readonly pacienteTelefono: string;
  readonly servicioId: string;
  readonly especialistaId: string;
}

export interface NuevaCitaInput {
  readonly fecha: string;
  readonly hora: string;
  readonly pacienteNombre: string;
  readonly pacienteTelefono: string;
  readonly servicioId: string;
  readonly especialistaId: string;
}

export interface InsumoFaltante {
  readonly insumoId: string;
  readonly nombre: string;
  readonly unidad: string;
  readonly requerido: number;
  readonly disponibleReal: number;
  readonly faltante: number;
}

export interface ResultadoDisponibilidad {
  readonly disponible: boolean;
  readonly faltantes: readonly InsumoFaltante[];
}

export type ResultadoReservaCita =
  | {
      readonly ok: true;
      readonly cita: Cita;
      readonly citas: Cita[];
      readonly insumos: InsumoCritico[];
    }
  | {
      readonly ok: false;
      readonly error: string;
      readonly faltantes: readonly InsumoFaltante[];
      readonly citas: Cita[];
      readonly insumos: InsumoCritico[];
    };

export type ResultadoTransicionCita =
  | {
      readonly ok: true;
      readonly cita: Cita;
      readonly citas: Cita[];
      readonly insumos: InsumoCritico[];
    }
  | {
      readonly ok: false;
      readonly error: string;
      readonly citas: Cita[];
      readonly insumos: InsumoCritico[];
    };
