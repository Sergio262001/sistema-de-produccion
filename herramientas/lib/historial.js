// ════════════════════════════════════════════════════════════
//  HISTORIAL — que el sistema recuerde lo que pasó.
//
//  Hasta ahora todo se deducía del disco en cada consulta: no había
//  forma de saber qué auditaste la semana pasada, ni si los hallazgos
//  bajan o suben, ni qué le entregaste a quién.
//
//  node:sqlite viene con Node — cero dependencias, un archivo en disco.
//  Si por lo que sea no está disponible, el panel sigue funcionando
//  igual: el historial es una mejora, no un requisito.
// ════════════════════════════════════════════════════════════

import { join } from 'node:path';
import { createRequire } from 'node:module';

// node:sqlite se carga así porque `abrirHistorial` es síncrona y un
// `await import` la obligaría a ser asíncrona en todos sus llamadores.
const requerir = createRequire(import.meta.url);

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS eventos (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha     TEXT    NOT NULL,           -- ISO 8601
  tipo      TEXT    NOT NULL,           -- validacion | auditoria | proyecto | agente | error
  proyecto  TEXT,                       -- slug, o NULL si es del sistema
  resumen   TEXT    NOT NULL,
  errores   INTEGER DEFAULT 0,
  avisos    INTEGER DEFAULT 0,
  costo     REAL    DEFAULT 0,
  detalle   TEXT                        -- JSON libre
);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha    ON eventos(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_proyecto ON eventos(proyecto, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo     ON eventos(tipo, fecha DESC);
`;

export function abrirHistorial(directorio) {
  let db = null;
  let motivo = null;

  try {
    // Import perezoso: si node:sqlite no está, el panel no se cae.
    const { DatabaseSync } = requerir('node:sqlite');
    db = new DatabaseSync(join(directorio, 'historial.db'));
    db.exec(ESQUEMA);
  } catch (e) {
    motivo = e.message;
  }

  const vivo = () => db !== null;

  return {
    disponible: vivo,
    motivo,

    /** Registra un evento. Nunca lanza: perder un registro no puede tumbar una operación. */
    anotar({ tipo, proyecto = null, resumen, errores = 0, avisos = 0, costo = 0, detalle = null }) {
      if (!vivo()) return false;
      try {
        db.prepare(`INSERT INTO eventos
          (fecha, tipo, proyecto, resumen, errores, avisos, costo, detalle)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(new Date().toISOString(), tipo, proyecto, String(resumen),
               errores | 0, avisos | 0, Number(costo) || 0,
               detalle ? JSON.stringify(detalle) : null);
        return true;
      } catch { return false; }
    },

    /** Los últimos eventos, opcionalmente de un proyecto */
    recientes({ proyecto = null, limite = 40 } = {}) {
      if (!vivo()) return [];
      try {
        const sql = proyecto
          ? 'SELECT * FROM eventos WHERE proyecto = ? ORDER BY fecha DESC LIMIT ?'
          : 'SELECT * FROM eventos ORDER BY fecha DESC LIMIT ?';
        const args = proyecto ? [proyecto, limite] : [limite];
        return db.prepare(sql).all(...args);
      } catch { return []; }
    },

    /**
     * ¿Los hallazgos suben o bajan? Compara las dos últimas validaciones
     * del mismo objetivo. Es la pregunta que un historial debe poder responder.
     */
    tendencia(proyecto) {
      if (!vivo()) return null;
      try {
        const dos = db.prepare(
          `SELECT errores, avisos, fecha FROM eventos
           WHERE tipo = 'validacion' AND proyecto IS ?
           ORDER BY fecha DESC LIMIT 2`).all(proyecto ?? null);
        if (dos.length < 2) return null;
        const [ahora, antes] = dos;
        return {
          errores: ahora.errores - antes.errores,
          avisos: ahora.avisos - antes.avisos,
          desde: antes.fecha,
        };
      } catch { return null; }
    },

    /** Cuánto se ha gastado en IA, por si acaso */
    gastoTotal(desdeIso = null) {
      if (!vivo()) return 0;
      try {
        const r = desdeIso
          ? db.prepare('SELECT SUM(costo) AS t FROM eventos WHERE fecha >= ?').get(desdeIso)
          : db.prepare('SELECT SUM(costo) AS t FROM eventos').get();
        return Math.round((r?.t || 0) * 10000) / 10000;
      } catch { return 0; }
    },

    /** Resumen para la pantalla de inicio */
    resumen() {
      if (!vivo()) return { eventos: 0, gastoMes: 0, ultima: null };
      try {
        const mes = new Date(Date.now() - 30 * 864e5).toISOString();
        const n = db.prepare('SELECT COUNT(*) AS n FROM eventos').get();
        const u = db.prepare('SELECT fecha, tipo, resumen FROM eventos ORDER BY fecha DESC LIMIT 1').get();
        return { eventos: n?.n || 0, gastoMes: this.gastoTotal(mes), ultima: u || null };
      } catch { return { eventos: 0, gastoMes: 0, ultima: null }; }
    },

    cerrar() { if (vivo()) { try { db.close(); } catch { /* ya cerrada */ } } },
  };
}
