import { useMemo, useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import {
  calcularStockDisponibleReal,
  obtenerNivelStock,
} from '../domain/stockEngine';
import type { RecetaItem, ServicioProcedimiento } from '../domain/types';
import './views.css';

export function InventarioView() {
  const {
    insumos,
    servicios,
    verificarDisponibilidad,
    reponerStock,
    actualizarRecetaServicio,
  } = useClinic();

  const [mensajeStock, setMensajeStock] = useState<string | null>(null);
  const [servicioEditandoId, setServicioEditandoId] = useState<string | null>(
    null,
  );
  const [borradorReceta, setBorradorReceta] = useState<RecetaItem[]>([]);
  const [nuevoInsumoId, setNuevoInsumoId] = useState<string>('');

  const insumoPorId = useMemo(
    () => new Map(insumos.map((item) => [item.id, item])),
    [insumos],
  );

  const procedimientos = useMemo(
    () =>
      servicios.filter(
        (s): s is ServicioProcedimiento => s.tipo === 'PROCEDIMIENTO',
      ),
    [servicios],
  );

  const kpis = useMemo(() => {
    let agotados = 0;
    let bajos = 0;
    let totalComprometido = 0;

    for (const item of insumos) {
      const nivel = obtenerNivelStock(item);
      if (nivel === 'AGOTADO') agotados += 1;
      else if (nivel === 'BAJO') bajos += 1;
      totalComprometido += item.stockComprometido;
    }

    return { agotados, bajos, totalComprometido };
  }, [insumos]);

  const handleReponer = (insumoId: string, nombre: string, cantidad: number) => {
    reponerStock(insumoId, cantidad);
    setMensajeStock(
      `Se repusieron +${cantidad} unidad(es) a "${nombre}". El Stock Disponible Real se actualizó al instante.`,
    );
  };

  const iniciarEdicionReceta = (servicio: ServicioProcedimiento) => {
    setServicioEditandoId(servicio.id);
    setBorradorReceta(servicio.receta.map((item) => ({ ...item })));
    const primeroDisponible =
      insumos.find(
        (ins) => !servicio.receta.some((r) => r.insumoId === ins.id),
      )?.id ?? '';
    setNuevoInsumoId(primeroDisponible);
  };

  const cambiarCantidadBorrador = (insumoId: string, delta: number) => {
    setBorradorReceta((prev) =>
      prev
        .map((item) =>
          item.insumoId === insumoId
            ? { ...item, cantidad: item.cantidad + delta }
            : item,
        )
        .filter((item) => item.cantidad > 0),
    );
  };

  const agregarInsumoBorrador = () => {
    if (!nuevoInsumoId) return;
    if (borradorReceta.some((item) => item.insumoId === nuevoInsumoId)) return;

    const actualizado = [
      ...borradorReceta,
      { insumoId: nuevoInsumoId, cantidad: 1 },
    ];
    setBorradorReceta(actualizado);

    const siguiente =
      insumos.find(
        (ins) => !actualizado.some((r) => r.insumoId === ins.id),
      )?.id ?? '';
    setNuevoInsumoId(siguiente);
  };

  const guardarReceta = (servicioId: string, nombreServicio: string) => {
    actualizarRecetaServicio(servicioId, borradorReceta);
    setServicioEditandoId(null);
    setMensajeStock(`Receta actualizada para "${nombreServicio}".`);
  };

  return (
    <section className="view-shell" aria-label="Inventario crítico y recetas">
      <div className="view-header">
        <div>
          <span className="view-eyebrow">Control de bodega · Top 8 críticos</span>
          <h1 className="view-title">Inventario y Recetas</h1>
          <p className="view-subtitle">
            Semáforo en tiempo real: <strong>Disponible Real = Físico − Comprometido</strong>.
          </p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card kpi-card--red">
          <span className="kpi-label">Agotados (Bloqueo activo)</span>
          <span className="kpi-value">{kpis.agotados}</span>
        </div>
        <div className="kpi-card kpi-card--amber">
          <span className="kpi-label">Stock bajo (Alerta)</span>
          <span className="kpi-value">{kpis.bajos}</span>
        </div>
        <div className="kpi-card kpi-card--teal">
          <span className="kpi-label">Unidades comprometidas</span>
          <span className="kpi-value">{kpis.totalComprometido}</span>
        </div>
      </div>

      {mensajeStock && (
        <div className="alert alert--ok" role="status">
          {mensajeStock}
        </div>
      )}

      {/* Tabla de Insumos Críticos */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Semáforo de Insumos Críticos</h2>
          <span className="badge badge--neutral">
            {insumos.length} insumos monitoreados
          </span>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Insumo Crítico</th>
                <th>Estado</th>
                <th>Stock Físico</th>
                <th>Comprometido</th>
                <th>Disponible Real</th>
                <th>Reposición Rápida</th>
              </tr>
            </thead>
            <tbody>
              {insumos.map((insumo) => {
                const disponibleReal = calcularStockDisponibleReal(insumo);
                const nivel = obtenerNivelStock(insumo);

                return (
                  <tr key={insumo.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {insumo.nombre}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Unidad: {insumo.unidad} · Mínimo sugerido: {insumo.stockMinimo}
                      </div>
                    </td>
                    <td>
                      {nivel === 'OK' && (
                        <span className="badge badge--ok">Stock OK</span>
                      )}
                      {nivel === 'BAJO' && (
                        <span className="badge badge--warn">Stock Bajo</span>
                      )}
                      {nivel === 'AGOTADO' && (
                        <span className="badge badge--danger">
                          Reposición Requerida
                        </span>
                      )}
                    </td>
                    <td className="num-cell">{insumo.stockFisico}</td>
                    <td className="num-cell" style={{ color: '#b45309' }}>
                      {insumo.stockComprometido}
                    </td>
                    <td
                      className={`num-cell ${
                        nivel === 'AGOTADO'
                          ? 'num-cell--real-zero'
                          : nivel === 'BAJO'
                            ? 'num-cell--real-low'
                            : 'num-cell--real-ok'
                      }`}
                    >
                      {disponibleReal}
                    </td>
                    <td>
                      <div className="actions-inline">
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => handleReponer(insumo.id, insumo.nombre, 1)}
                        >
                          + Reponer Stock (+1)
                        </button>
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          onClick={() => handleReponer(insumo.id, insumo.nombre, 5)}
                        >
                          +5
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visualizador / Editor de Recetas por Procedimiento */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Recetas por Procedimiento</h2>
            <p className="view-subtitle" style={{ marginTop: '0.2rem' }}>
              Las valoraciones consumen 0 insumos. Cada procedimiento descuenta
              su receta vinculada.
            </p>
          </div>
        </div>

        <div className="recipe-list">
          {procedimientos.map((proc) => {
            const disp = verificarDisponibilidad(proc.id);
            const editando = servicioEditandoId === proc.id;
            const insumosDisponiblesParaAgregar = insumos.filter(
              (ins) => !borradorReceta.some((r) => r.insumoId === ins.id),
            );

            return (
              <div key={proc.id} className="recipe-row">
                <div className="recipe-row-header">
                  <div>
                    <strong style={{ color: '#0f172a' }}>{proc.nombre}</strong>{' '}
                    {disp.disponible ? (
                      <span className="badge badge--ok">Stock OK</span>
                    ) : (
                      <span className="badge badge--danger">
                        Reposición Requerida
                      </span>
                    )}
                  </div>

                  {!editando ? (
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={() => iniciarEdicionReceta(proc)}
                    >
                      Editar receta
                    </button>
                  ) : (
                    <div className="actions-inline">
                      <button
                        type="button"
                        className="btn btn--emerald btn--sm"
                        onClick={() => guardarReceta(proc.id, proc.nombre)}
                      >
                        Guardar receta
                      </button>
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={() => setServicioEditandoId(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>

                {!editando ? (
                  <div className="recipe-chips">
                    {proc.receta.length === 0 ? (
                      <span className="recipe-chip">Sin insumos asignados</span>
                    ) : (
                      proc.receta.map((item) => {
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
                            {item.cantidad} {insumo?.unidad ?? 'u.'} ·{' '}
                            {insumo?.nombre ?? item.insumoId} (disp: {disponibleReal})
                          </span>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="recipe-editor-items">
                      {borradorReceta.length === 0 && (
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          No hay insumos en esta receta. Agrega al menos uno abajo.
                        </span>
                      )}
                      {borradorReceta.map((item) => {
                        const insumo = insumoPorId.get(item.insumoId);
                        return (
                          <div key={item.insumoId} className="recipe-editor-line">
                            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                              {insumo?.nombre ?? item.insumoId} ({insumo?.unidad ?? 'u.'})
                            </span>
                            <div className="qty-control">
                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() =>
                                  cambiarCantidadBorrador(item.insumoId, -1)
                                }
                                aria-label="Disminuir cantidad"
                              >
                                −
                              </button>
                              <span
                                className="num-cell"
                                style={{ minWidth: '24px', textAlign: 'center' }}
                              >
                                {item.cantidad}
                              </span>
                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() =>
                                  cambiarCantidadBorrador(item.insumoId, 1)
                                }
                                aria-label="Aumentar cantidad"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {insumosDisponiblesParaAgregar.length > 0 && (
                      <div className="actions-inline">
                        <select
                          className="select"
                          style={{ maxWidth: '340px' }}
                          value={nuevoInsumoId}
                          onChange={(e) => setNuevoInsumoId(e.target.value)}
                          aria-label="Seleccionar insumo para agregar a la receta"
                        >
                          {insumosDisponiblesParaAgregar.map((ins) => (
                            <option key={ins.id} value={ins.id}>
                              {ins.nombre} ({ins.unidad})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={agregarInsumoBorrador}
                        >
                          + Agregar insumo
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
