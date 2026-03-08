import type { CellMap, FormulaResult } from '@/lib/types';

/** Expand a range like "A1:C3" into an array of cell IDs */
function expandRange(range: string): string[] {
  const match = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(range);
  if (!match) return [];
  const [, startCol, startRow, endCol, endRow] = match;
  const cells: string[] = [];
  const c1 = startCol!.charCodeAt(0);
  const c2 = endCol!.charCodeAt(0);
  const r1 = parseInt(startRow!, 10);
  const r2 = parseInt(endRow!, 10);
  for (let c = c1; c <= c2; c++) {
    for (let r = r1; r <= r2; r++) {
      cells.push(`${String.fromCharCode(c)}${r}`);
    }
  }
  return cells;
}

/** Get numeric value of a cell (0 if empty or non-numeric) */
function cellNumeric(cellId: string, cells: CellMap): number {
  const val = cells[cellId]?.computed ?? cells[cellId]?.value ?? '';
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

/** Get string value of a cell */
function cellString(cellId: string, cells: CellMap): string {
  return cells[cellId]?.computed ?? cells[cellId]?.value ?? '';
}

/** Get all numeric values from a range (skips non-numeric/empty) */
function rangeNums(range: string, cells: CellMap): number[] {
  return expandRange(range)
    .map((id) => {
      const v = parseFloat(cells[id]?.computed ?? cells[id]?.value ?? '');
      return isNaN(v) ? null : v;
    })
    .filter((v): v is number => v !== null);
}

/** Evaluate a formula string against the current cell map */
export function evaluateFormula(raw: string, cells: CellMap): FormulaResult {
  if (!raw.startsWith('=')) return raw;

  try {
    let expr = raw.slice(1).toUpperCase();

    // ── Multi-argument functions (must run before cell-ref replacement) ────────

    // IF(condition, true_val, false_val)
    expr = expr.replace(
      /IF\(([^,]+),([^,]+),([^)]+)\)/g,
      (_, cond: string, tVal: string, fVal: string) => {
        try {
          const evalCond = cond
            .trim()
            .replace(/([A-Z]+\d+)/g, (id) => String(cellNumeric(id, cells)));
          const result: unknown = Function(`'use strict'; return !!(${evalCond})`)();
          const chosen = (result ? tVal : fVal).trim();
          // Strip surrounding quotes from string literals before re-quoting
          const inner = chosen.replace(/^["']|["']$/g, '');
          const isNumeric = !isNaN(parseFloat(inner)) && isFinite(Number(inner));
          return isNumeric ? inner : `"${inner}"`;
        } catch {
          return '0';
        }
      }
    );

    // ROUND(cell_or_number, digits)
    expr = expr.replace(
      /ROUND\(([A-Z]+\d+|[-\d.]+),(\d+)\)/g,
      (_, ref: string, digitsStr: string) => {
        const val = /^[A-Z]/.test(ref) ? cellNumeric(ref, cells) : parseFloat(ref);
        const digits = parseInt(digitsStr, 10);
        return String(Math.round(val * 10 ** digits) / 10 ** digits);
      }
    );

    // CONCAT(a, b, ...) — comma-separated cells or string literals
    expr = expr.replace(/CONCAT\(([^)]+)\)/g, (_, args: string) => {
      const parts = args.split(',').map((a) => {
        const t = a.trim();
        if (/^[A-Z]+\d+$/.test(t)) return cellString(t, cells);
        return t.replace(/^["']|["']$/g, '');
      });
      return `"${parts.join('')}"`;
    });

    // ── Range functions ────────────────────────────────────────────────────────

    // SUM(range)
    expr = expr.replace(/SUM\(([A-Z]+\d+:[A-Z]+\d+)\)/g, (_, range: string) => {
      const sum = expandRange(range).reduce((acc, id) => acc + cellNumeric(id, cells), 0);
      return String(sum);
    });

    // AVERAGE(range)
    expr = expr.replace(/AVERAGE\(([A-Z]+\d+:[A-Z]+\d+)\)/g, (_, range: string) => {
      const nums = rangeNums(range, cells);
      if (nums.length === 0) return '0';
      return String(nums.reduce((a, b) => a + b, 0) / nums.length);
    });

    // MEDIAN(range)
    expr = expr.replace(/MEDIAN\(([A-Z]+\d+:[A-Z]+\d+)\)/g, (_, range: string) => {
      const sorted = rangeNums(range, cells).sort((a, b) => a - b);
      if (sorted.length === 0) return '0';
      const mid = Math.floor(sorted.length / 2);
      const result =
        sorted.length % 2 === 0
          ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
          : (sorted[mid] ?? 0);
      return String(result);
    });

    // MODE(range) — most frequent numeric value
    expr = expr.replace(/MODE\(([A-Z]+\d+:[A-Z]+\d+)\)/g, (_, range: string) => {
      const nums = rangeNums(range, cells);
      if (nums.length === 0) return '0';
      const freq: Record<number, number> = {};
      let maxFreq = 0;
      let mode = nums[0] ?? 0;
      for (const n of nums) {
        freq[n] = (freq[n] ?? 0) + 1;
        if ((freq[n] ?? 0) > maxFreq) {
          maxFreq = freq[n] ?? 0;
          mode = n;
        }
      }
      return String(mode);
    });

    // COUNT(range) — count numeric cells
    expr = expr.replace(/COUNT\(([A-Z]+\d+:[A-Z]+\d+)\)/g, (_, range: string) =>
      String(rangeNums(range, cells).length)
    );

    // COUNTA(range) — count non-empty cells
    expr = expr.replace(/COUNTA\(([A-Z]+\d+:[A-Z]+\d+)\)/g, (_, range: string) => {
      const count = expandRange(range).filter(
        (id) => (cells[id]?.computed ?? cells[id]?.value ?? '') !== ''
      ).length;
      return String(count);
    });

    // MIN(range)
    expr = expr.replace(/MIN\(([A-Z]+\d+:[A-Z]+\d+)\)/g, (_, range: string) => {
      const nums = rangeNums(range, cells);
      return nums.length === 0 ? '0' : String(Math.min(...nums));
    });

    // MAX(range)
    expr = expr.replace(/MAX\(([A-Z]+\d+:[A-Z]+\d+)\)/g, (_, range: string) => {
      const nums = rangeNums(range, cells);
      return nums.length === 0 ? '0' : String(Math.max(...nums));
    });

    // ── Single-cell string functions ───────────────────────────────────────────

    // LEN(cell)
    expr = expr.replace(/LEN\(([A-Z]+\d+)\)/g, (_, id: string) =>
      String(cellString(id, cells).length)
    );

    // UPPER(cell) → quoted string literal
    expr = expr.replace(
      /UPPER\(([A-Z]+\d+)\)/g,
      (_, id: string) => `"${cellString(id, cells).toUpperCase()}"`
    );

    // LOWER(cell) → quoted string literal
    expr = expr.replace(
      /LOWER\(([A-Z]+\d+)\)/g,
      (_, id: string) => `"${cellString(id, cells).toLowerCase()}"`
    );

    // ── Cell references → numbers ──────────────────────────────────────────────
    expr = expr.replace(/([A-Z]+)(\d+)/g, (cellId) => String(cellNumeric(cellId, cells)));

    // ── Final eval ─────────────────────────────────────────────────────────────
    const result: unknown = Function(`'use strict'; return (${expr})`)();
    if (typeof result === 'number' && !isFinite(result)) return '#DIV0';
    return String(result);
  } catch {
    return '#ERR';
  }
}
