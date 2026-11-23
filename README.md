# ProyectoAgendas — Sistema de Agendamiento Vinculado a Stock (MVP)

MVP funcional en React + TypeScript + Vite para **Clínica Dental & Estética Lumina**, enfocado en prevenir quiebres de inventario en cabina mediante **Bloqueo Preventivo** y la regla central:

> **Stock Disponible Real = Stock Físico − Stock Comprometido**

## Arquitectura (`src/`)

- `src/domain/types.ts`: Tipos estrictos de `ConsultorioConfig`, `Especialista`, `InsumoCritico`, `Servicio` (`VALORACION` | `PROCEDIMIENTO`) y `Cita` (`RESERVADA` | `COMPLETADA` | `CANCELADA`).
- `src/domain/stockEngine.ts`: Funciones puras para cálculo de stock disponible real, verificación de disponibilidad, reserva con bloqueo preventivo, completado (descuenta Físico y Comprometido), cancelación (libera Comprometido) y reposición.
- `src/data/mockClinicData.ts`: Escenario inicial de demostración (2 especialistas, Top 8 insumos críticos y 3 citas activas) calibrado con la última unidad disponible para probar el bloqueo preventivo en vivo.
- `src/context/ClinicContext.tsx`: Estado global en memoria con persistencia automática en `localStorage` y botón **Restaurar datos demo**.
- `src/engine/`: Motor `Scroll Craft` (`scrollcraft.js` + `scrollcraft.css`) integrado sin modificaciones.
- `src/components/`: `ScrollShowcase.tsx` (introducción interactiva conducida por scroll) y `Navbar.tsx`.
- `src/views/`: `LoginView.tsx`, `AgendarView.tsx` (flujo en 3 pasos + comprobante + `wa.me`), `AgendaView.tsx` e `InventarioView.tsx` (semáforo, reposición rápida y editor de recetas).

## Ejecución local

```bash
npm install
npm run dev
```

## Validación

```bash
npm run build
npm run lint
```
