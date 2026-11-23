import type {
  Cita,
  ConsultorioConfig,
  Especialista,
  InsumoCritico,
  Servicio,
} from '../domain/types';

export const CONSULTORIO_CONFIG: ConsultorioConfig = {
  nombre: 'Clínica Dental & Estética Lumina',
  direccion: 'Av. República del Salvador N34-183, Torre Médica Áurea, Piso 4',
  referencia: 'Frente al Parque La Carolina, ingreso junto a Farmacia Fybeca',
  telefonoWhatsApp: '593991234567',
};

export const ESPECIALISTAS_INICIALES: readonly Especialista[] = [
  {
    id: 'esp-camila-paredes',
    nombre: 'Dra. Camila Paredes',
    especialidad: 'Odontología Estética y Rehabilitación Oral',
  },
  {
    id: 'esp-mateo-villalobos',
    nombre: 'Dr. Mateo Villalobos',
    especialidad: 'Armonización Orofacial y Periodoncia',
  },
];

/**
 * Top 8 Insumos Críticos de la clínica.
 *
 * Consistencia con CITAS_INICIALES (3 citas RESERVADA hoy):
 * - CITA-101 (Blanqueamiento LED): compromete 1 Gel Blanqueador + 1 Barrera Gingival
 * - CITA-102 (Blanqueamiento LED): compromete 1 Gel Blanqueador + 1 Barrera Gingival
 * - CITA-103 (Perfilado Labial):   compromete 1 Ácido Hialurónico + 1 Anestesia + 1 Kit Estéril
 *
 * Escenario listo para demostración en vivo de Bloqueo Preventivo:
 * - "Gel Blanqueador Peróxido 35%": Físico 3 - Comprometido 2 = 1 disponible real.
 *   Al agendar 1 Blanqueamiento Dental LED (CITA-104), pasa a 0 disponible real
 *   y el siguiente intento activa el bloqueo preventivo automáticamente.
 * - "Ácido Hialurónico Reticulado 1 ml": Físico 2 - Comprometido 1 = 1 disponible real.
 *   Mismo comportamiento para Perfilado Labial con Ácido Hialurónico.
 */
export const INSUMOS_CRITICOS_INICIALES: readonly InsumoCritico[] = [
  {
    id: 'ins-gel-blanqueador',
    nombre: 'Gel Blanqueador Peróxido 35%',
    unidad: 'jeringa',
    stockFisico: 3,
    stockComprometido: 2,
    stockMinimo: 2,
  },
  {
    id: 'ins-barrera-gingival',
    nombre: 'Barrera Gingival Fotopolimerizable',
    unidad: 'jeringa',
    stockFisico: 6,
    stockComprometido: 2,
    stockMinimo: 2,
  },
  {
    id: 'ins-acido-hialuronico',
    nombre: 'Ácido Hialurónico Reticulado 1 ml',
    unidad: 'jeringa',
    stockFisico: 2,
    stockComprometido: 1,
    stockMinimo: 2,
  },
  {
    id: 'ins-toxina-botulinica',
    nombre: 'Toxina Botulínica Tipo A 50U',
    unidad: 'vial',
    stockFisico: 4,
    stockComprometido: 0,
    stockMinimo: 2,
  },
  {
    id: 'ins-resina-estetica',
    nombre: 'Resina Nanohíbrida Estética A1/A2',
    unidad: 'jeringa',
    stockFisico: 8,
    stockComprometido: 0,
    stockMinimo: 3,
  },
  {
    id: 'ins-anestesia',
    nombre: 'Cartucho Anestésico Articaína 4%',
    unidad: 'cartucho',
    stockFisico: 15,
    stockComprometido: 1,
    stockMinimo: 5,
  },
  {
    id: 'ins-pasta-profilaxis',
    nombre: 'Kit Profilaxis Ultrasónica & Flúor',
    unidad: 'kit',
    stockFisico: 12,
    stockComprometido: 0,
    stockMinimo: 4,
  },
  {
    id: 'ins-kit-esteril',
    nombre: 'Kit Descartable Estéril de Bioseguridad',
    unidad: 'kit',
    stockFisico: 14,
    stockComprometido: 1,
    stockMinimo: 5,
  },
];

export const SERVICIOS_INICIALES: readonly Servicio[] = [
  {
    id: 'srv-valoracion-dental',
    nombre: 'Valoración Odontológica Integral',
    descripcion: 'Diagnóstico clínico, plan de tratamiento y presupuesto sin consumo de insumos críticos.',
    tipo: 'VALORACION',
    duracionMinutos: 30,
    precio: 25,
    receta: [],
  },
  {
    id: 'srv-valoracion-estetica',
    nombre: 'Evaluación de Armonización Facial',
    descripcion: 'Análisis facial y planificación estética personalizada sin consumo de insumos críticos.',
    tipo: 'VALORACION',
    duracionMinutos: 30,
    precio: 30,
    receta: [],
  },
  {
    id: 'srv-blanqueamiento-led',
    nombre: 'Blanqueamiento Dental LED',
    descripcion: 'Sesión clínica de aclaramiento dental con gel de peróxido al 35% y protección gingival.',
    tipo: 'PROCEDIMIENTO',
    duracionMinutos: 60,
    precio: 140,
    receta: [
      { insumoId: 'ins-gel-blanqueador', cantidad: 1 },
      { insumoId: 'ins-barrera-gingival', cantidad: 1 },
    ],
  },
  {
    id: 'srv-perfilado-labial',
    nombre: 'Perfilado Labial con Ácido Hialurónico',
    descripcion: 'Hidratación y definición labial con ácido hialurónico reticulado de alta pureza.',
    tipo: 'PROCEDIMIENTO',
    duracionMinutos: 45,
    precio: 280,
    receta: [
      { insumoId: 'ins-acido-hialuronico', cantidad: 1 },
      { insumoId: 'ins-anestesia', cantidad: 1 },
      { insumoId: 'ins-kit-esteril', cantidad: 1 },
    ],
  },
  {
    id: 'srv-armonizacion-botox',
    nombre: 'Aplicación de Toxina Botulínica (Tercio Superior)',
    descripcion: 'Atenuación de líneas de expresión en frente, entrecejo y contorno ocular.',
    tipo: 'PROCEDIMIENTO',
    duracionMinutos: 40,
    precio: 240,
    receta: [
      { insumoId: 'ins-toxina-botulinica', cantidad: 1 },
      { insumoId: 'ins-kit-esteril', cantidad: 1 },
    ],
  },
  {
    id: 'srv-carilla-resina',
    nombre: 'Diseño de Carilla en Resina Estética',
    descripcion: 'Restauración estética directa con resina nanohíbrida de alto pulido.',
    tipo: 'PROCEDIMIENTO',
    duracionMinutos: 60,
    precio: 110,
    receta: [
      { insumoId: 'ins-resina-estetica', cantidad: 1 },
      { insumoId: 'ins-anestesia', cantidad: 1 },
      { insumoId: 'ins-kit-esteril', cantidad: 1 },
    ],
  },
  {
    id: 'srv-profilaxis',
    nombre: 'Profilaxis Dental Ultrasónica + Flúor',
    descripcion: 'Limpieza dental profunda, pulido y aplicación tópica de flúor remineralizante.',
    tipo: 'PROCEDIMIENTO',
    duracionMinutos: 45,
    precio: 55,
    receta: [
      { insumoId: 'ins-pasta-profilaxis', cantidad: 1 },
      { insumoId: 'ins-kit-esteril', cantidad: 1 },
    ],
  },
];

function obtenerFechaHoyISO(): string {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export const FECHA_DEMO_HOY: string = obtenerFechaHoyISO();

export const CITAS_INICIALES: readonly Cita[] = [
  {
    id: 'cita-cita-101',
    codigo: 'CITA-101',
    estado: 'RESERVADA',
    fecha: FECHA_DEMO_HOY,
    hora: '09:30',
    pacienteNombre: 'Valeria Mendoza',
    pacienteTelefono: '0998412301',
    servicioId: 'srv-blanqueamiento-led',
    especialistaId: 'esp-camila-paredes',
  },
  {
    id: 'cita-cita-102',
    codigo: 'CITA-102',
    estado: 'RESERVADA',
    fecha: FECHA_DEMO_HOY,
    hora: '11:00',
    pacienteNombre: 'Sebastián Ortiz',
    pacienteTelefono: '0987654321',
    servicioId: 'srv-blanqueamiento-led',
    especialistaId: 'esp-camila-paredes',
  },
  {
    id: 'cita-cita-103',
    codigo: 'CITA-103',
    estado: 'RESERVADA',
    fecha: FECHA_DEMO_HOY,
    hora: '15:00',
    pacienteNombre: 'Andrea Salgado',
    pacienteTelefono: '0993104822',
    servicioId: 'srv-perfilado-labial',
    especialistaId: 'esp-mateo-villalobos',
  },
];
