import type {
  Cita,
  InsumoCritico,
  InsumoFaltante,
  NivelStock,
  NuevaCitaInput,
  ResultadoDisponibilidad,
  ResultadoReservaCita,
  ResultadoTransicionCita,
  Servicio,
} from './types';

/**
 * Regla central del dominio:
 * Stock Disponible Real = Stock Físico - Stock Comprometido.
 */
export function calcularStockDisponibleReal(
  insumo: Pick<InsumoCritico, 'stockFisico' | 'stockComprometido'>,
): number {
  return insumo.stockFisico - insumo.stockComprometido;
}

/**
 * Clasifica el estado del insumo para el semáforo de inventario.
 */
export function obtenerNivelStock(insumo: InsumoCritico): NivelStock {
  const disponibleReal = calcularStockDisponibleReal(insumo);
  if (disponibleReal <= 0) {
    return 'AGOTADO';
  }
  if (disponibleReal <= insumo.stockMinimo) {
    return 'BAJO';
  }
  return 'OK';
}

/**
 * Verifica si existe stock disponible real suficiente para agendar un servicio.
 * Las valoraciones (0 insumos) siempre están disponibles.
 */
export function verificarDisponibilidadServicio(
  servicio: Servicio,
  insumos: readonly InsumoCritico[],
): ResultadoDisponibilidad {
  if (servicio.tipo === 'VALORACION' || servicio.receta.length === 0) {
    return { disponible: true, faltantes: [] };
  }

  const insumosPorId = new Map<string, InsumoCritico>(
    insumos.map((insumo) => [insumo.id, insumo]),
  );

  const faltantes: InsumoFaltante[] = [];

  for (const item of servicio.receta) {
    const insumo = insumosPorId.get(item.insumoId);
    if (!insumo) {
      faltantes.push({
        insumoId: item.insumoId,
        nombre: `Insumo no registrado (${item.insumoId})`,
        unidad: 'unidad',
        requerido: item.cantidad,
        disponibleReal: 0,
        faltante: item.cantidad,
      });
      continue;
    }

    const disponibleReal = calcularStockDisponibleReal(insumo);
    if (disponibleReal < item.cantidad) {
      const disponibleSeguro = Math.max(0, disponibleReal);
      faltantes.push({
        insumoId: insumo.id,
        nombre: insumo.nombre,
        unidad: insumo.unidad,
        requerido: item.cantidad,
        disponibleReal: disponibleSeguro,
        faltante: item.cantidad - disponibleSeguro,
      });
    }
  }

  return {
    disponible: faltantes.length === 0,
    faltantes,
  };
}

/**
 * Genera el siguiente código correlativo único de cita (ej. CITA-104).
 */
export function generarCodigoCita(citasExistentes: readonly Cita[]): string {
  const maxNumero = citasExistentes.reduce((max, cita) => {
    const match = /^CITA-(\d+)$/i.exec(cita.codigo);
    if (!match) return max;
    const numero = Number.parseInt(match[1], 10);
    return Number.isNaN(numero) ? max : Math.max(max, numero);
  }, 100);

  return `CITA-${maxNumero + 1}`;
}

/**
 * Reserva una cita aplicando Bloqueo Preventivo:
 * - Si el servicio no tiene stock disponible real suficiente, bloquea la reserva sin mutar estado.
 * - Si hay stock disponible real, crea la cita en estado RESERVADA y suma la receta al stockComprometido.
 */
export function reservarCita(params: {
  readonly nuevaCita: NuevaCitaInput;
  readonly citas: readonly Cita[];
  readonly servicios: readonly Servicio[];
  readonly insumos: readonly InsumoCritico[];
}): ResultadoReservaCita {
  const { nuevaCita, citas, servicios, insumos } = params;
  const citasCopia = [...citas];
  const insumosCopia = [...insumos];

  const servicio = servicios.find((s) => s.id === nuevaCita.servicioId);
  if (!servicio) {
    return {
      ok: false,
      error: 'El servicio seleccionado no existe.',
      faltantes: [],
      citas: citasCopia,
      insumos: insumosCopia,
    };
  }

  const disponibilidad = verificarDisponibilidadServicio(servicio, insumos);
  if (!disponibilidad.disponible) {
    const detalleFaltantes = disponibilidad.faltantes
      .map((f) => `${f.nombre} (requiere ${f.requerido}, disponible ${f.disponibleReal})`)
      .join(', ');

    return {
      ok: false,
      error: `Bloqueo preventivo: stock disponible real insuficiente para ${servicio.nombre}. Faltantes: ${detalleFaltantes}.`,
      faltantes: disponibilidad.faltantes,
      citas: citasCopia,
      insumos: insumosCopia,
    };
  }

  const recetaPorInsumo = new Map<string, number>(
    servicio.receta.map((item) => [item.insumoId, item.cantidad]),
  );

  const nuevosInsumos: InsumoCritico[] = insumos.map((insumo) => {
    const cantidadRequerida = recetaPorInsumo.get(insumo.id);
    if (cantidadRequerida === undefined) {
      return insumo;
    }
    return {
      ...insumo,
      stockComprometido: insumo.stockComprometido + cantidadRequerida,
    };
  });

  const codigo = generarCodigoCita(citas);
  const citaCreada: Cita = {
    id: `cita-${codigo.toLowerCase()}`,
    codigo,
    estado: 'RESERVADA',
    fecha: nuevaCita.fecha,
    hora: nuevaCita.hora,
    pacienteNombre: nuevaCita.pacienteNombre.trim(),
    pacienteTelefono: nuevaCita.pacienteTelefono.trim(),
    servicioId: nuevaCita.servicioId,
    especialistaId: nuevaCita.especialistaId,
  };

  return {
    ok: true,
    cita: citaCreada,
    citas: [...citas, citaCreada],
    insumos: nuevosInsumos,
  };
}

/**
 * Completa una cita RESERVADA:
 * - Cambia el estado a COMPLETADA.
 * - Descuenta la receta tanto de stockFisico como de stockComprometido
 *   (el stockDisponibleReal permanece invariante porque ya estaba comprometido).
 */
export function completarCita(params: {
  readonly citaId: string;
  readonly citas: readonly Cita[];
  readonly servicios: readonly Servicio[];
  readonly insumos: readonly InsumoCritico[];
}): ResultadoTransicionCita {
  const { citaId, citas, servicios, insumos } = params;
  const citaActual = citas.find((c) => c.id === citaId);

  if (!citaActual) {
    return {
      ok: false,
      error: 'Cita no encontrada.',
      citas: [...citas],
      insumos: [...insumos],
    };
  }

  if (citaActual.estado !== 'RESERVADA') {
    return {
      ok: false,
      error: `Solo se pueden completar citas en estado RESERVADA (estado actual: ${citaActual.estado}).`,
      citas: [...citas],
      insumos: [...insumos],
    };
  }

  const servicio = servicios.find((s) => s.id === citaActual.servicioId);
  if (!servicio) {
    return {
      ok: false,
      error: 'No se encontró el servicio asociado a la cita.',
      citas: [...citas],
      insumos: [...insumos],
    };
  }

  const recetaPorInsumo = new Map<string, number>(
    servicio.receta.map((item) => [item.insumoId, item.cantidad]),
  );

  const nuevosInsumos: InsumoCritico[] = insumos.map((insumo) => {
    const cantidadUsada = recetaPorInsumo.get(insumo.id);
    if (cantidadUsada === undefined) {
      return insumo;
    }
    return {
      ...insumo,
      stockFisico: Math.max(0, insumo.stockFisico - cantidadUsada),
      stockComprometido: Math.max(0, insumo.stockComprometido - cantidadUsada),
    };
  });

  const citaCompletada: Cita = {
    ...citaActual,
    estado: 'COMPLETADA',
  };

  const nuevasCitas = citas.map((c) => (c.id === citaId ? citaCompletada : c));

  return {
    ok: true,
    cita: citaCompletada,
    citas: nuevasCitas,
    insumos: nuevosInsumos,
  };
}

/**
 * Cancela una cita RESERVADA:
 * - Cambia el estado a CANCELADA.
 * - Libera la reserva restando la receta únicamente de stockComprometido
 *   (el stockFisico no cambia y el stockDisponibleReal aumenta).
 */
export function cancelarCita(params: {
  readonly citaId: string;
  readonly citas: readonly Cita[];
  readonly servicios: readonly Servicio[];
  readonly insumos: readonly InsumoCritico[];
}): ResultadoTransicionCita {
  const { citaId, citas, servicios, insumos } = params;
  const citaActual = citas.find((c) => c.id === citaId);

  if (!citaActual) {
    return {
      ok: false,
      error: 'Cita no encontrada.',
      citas: [...citas],
      insumos: [...insumos],
    };
  }

  if (citaActual.estado !== 'RESERVADA') {
    return {
      ok: false,
      error: `Solo se pueden cancelar citas en estado RESERVADA (estado actual: ${citaActual.estado}).`,
      citas: [...citas],
      insumos: [...insumos],
    };
  }

  const servicio = servicios.find((s) => s.id === citaActual.servicioId);
  if (!servicio) {
    return {
      ok: false,
      error: 'No se encontró el servicio asociado a la cita.',
      citas: [...citas],
      insumos: [...insumos],
    };
  }

  const recetaPorInsumo = new Map<string, number>(
    servicio.receta.map((item) => [item.insumoId, item.cantidad]),
  );

  const nuevosInsumos: InsumoCritico[] = insumos.map((insumo) => {
    const cantidadLiberada = recetaPorInsumo.get(insumo.id);
    if (cantidadLiberada === undefined) {
      return insumo;
    }
    return {
      ...insumo,
      stockComprometido: Math.max(0, insumo.stockComprometido - cantidadLiberada),
    };
  });

  const citaCancelada: Cita = {
    ...citaActual,
    estado: 'CANCELADA',
  };

  const nuevasCitas = citas.map((c) => (c.id === citaId ? citaCancelada : c));

  return {
    ok: true,
    cita: citaCancelada,
    citas: nuevasCitas,
    insumos: nuevosInsumos,
  };
}

/**
 * Repone stock físico de un insumo crítico (acción rápida de Admin Bodega).
 */
export function reponerStockInsumo(
  insumos: readonly InsumoCritico[],
  insumoId: string,
  cantidad: number,
): InsumoCritico[] {
  if (cantidad <= 0) {
    return [...insumos];
  }
  return insumos.map((insumo) =>
    insumo.id === insumoId
      ? { ...insumo, stockFisico: insumo.stockFisico + cantidad }
      : insumo,
  );
}
