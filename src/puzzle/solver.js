const SIZE = 9;
const FULL_MASK = 0b1111111110;

/**
 * 隣接ルールを満たすか調べます。
 * doubleEdges.horizontal[r][c] は (r,c) と (r,c+1) の境界、
 * doubleEdges.vertical[r][c] は (r,c) と (r+1,c) の境界です。
 * true が二重線、false が通常の境界です。
 */
export function satisfiesAdjacentRule(a, b, isDouble) {
  const difference = Math.abs(a - b);
  return isDouble ? difference === 1 : difference >= 2;
}

/** 完成盤面から二重線の位置を作ります。 */
export function createDoubleEdges(solution) {
  if (!Array.isArray(solution) || solution.length !== 81) {
    throw new TypeError("solution must contain 81 numbers");
  }

  const horizontal = Array.from({ length: SIZE }, (_, row) =>
    Array.from({ length: SIZE - 1 }, (_, col) =>
      Math.abs(solution[row * SIZE + col] - solution[row * SIZE + col + 1]) === 1,
    ),
  );
  const vertical = Array.from({ length: SIZE - 1 }, (_, row) =>
    Array.from({ length: SIZE }, (_, col) =>
      Math.abs(solution[row * SIZE + col] - solution[(row + 1) * SIZE + col]) === 1,
    ),
  );

  return { horizontal, vertical };
}

/**
 * 与えられた盤面の解を最大 limit 個まで数えます。
 * board は行優先の81要素配列で、空マスは 0 です。
 * 戻り値の count は limit で打ち切られるため、limit=2 なら
 * 一意解かどうかの判定に使えます。
 */
export function countSolutions(board, doubleEdges, limit = 2) {
  validateArguments(board, doubleEdges, limit);

  const cells = [...board];
  const rowMasks = Array(SIZE).fill(0);
  const colMasks = Array(SIZE).fill(0);
  const boxMasks = Array(SIZE).fill(0);

  for (let index = 0; index < cells.length; index += 1) {
    const value = cells[index];
    if (value === 0) continue;

    const row = Math.floor(index / SIZE);
    const col = index % SIZE;
    const box = boxIndex(row, col);
    const bit = 1 << value;
    if ((rowMasks[row] & bit) || (colMasks[col] & bit) || (boxMasks[box] & bit)) {
      return { count: 0, solution: null };
    }
    rowMasks[row] |= bit;
    colMasks[col] |= bit;
    boxMasks[box] |= bit;
  }

  // 初期ヒント同士の隣接制約を先に確認します。
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const index = row * SIZE + col;
      if (col < SIZE - 1 && cells[index] && cells[index + 1] &&
          !satisfiesAdjacentRule(cells[index], cells[index + 1], doubleEdges.horizontal[row][col])) {
        return { count: 0, solution: null };
      }
      if (row < SIZE - 1 && cells[index] && cells[index + SIZE] &&
          !satisfiesAdjacentRule(cells[index], cells[index + SIZE], doubleEdges.vertical[row][col])) {
        return { count: 0, solution: null };
      }
    }
  }

  let count = 0;
  let firstSolution = null;

  function search() {
    if (count >= limit) return;

    let bestIndex = -1;
    let bestCandidates = 0;
    let bestCount = SIZE + 1;

    for (let index = 0; index < cells.length; index += 1) {
      if (cells[index] !== 0) continue;
      const candidates = candidatesFor(index);
      const candidateCount = bitCount(candidates);
      if (candidateCount === 0) return;
      if (candidateCount < bestCount) {
        bestIndex = index;
        bestCandidates = candidates;
        bestCount = candidateCount;
        if (candidateCount === 1) break;
      }
    }

    if (bestIndex === -1) {
      count += 1;
      if (firstSolution === null) firstSolution = [...cells];
      return;
    }

    const row = Math.floor(bestIndex / SIZE);
    const col = bestIndex % SIZE;
    const box = boxIndex(row, col);
    for (let value = 1; value <= SIZE && count < limit; value += 1) {
      const bit = 1 << value;
      if (!(bestCandidates & bit)) continue;
      cells[bestIndex] = value;
      rowMasks[row] |= bit;
      colMasks[col] |= bit;
      boxMasks[box] |= bit;
      search();
      cells[bestIndex] = 0;
      rowMasks[row] &= ~bit;
      colMasks[col] &= ~bit;
      boxMasks[box] &= ~bit;
    }
  }

  function candidatesFor(index) {
    const row = Math.floor(index / SIZE);
    const col = index % SIZE;
    const used = rowMasks[row] | colMasks[col] | boxMasks[boxIndex(row, col)];
    let candidates = FULL_MASK & ~used;

    // 二重線なら差が1、通常境界なら差が2以上となる数字に絞ります。
    for (const neighbor of neighbors(index, doubleEdges)) {
      const neighborValue = cells[neighbor.index];
      if (neighborValue === 0) continue;
      let allowed = 0;
      for (let value = 1; value <= SIZE; value += 1) {
        if (satisfiesAdjacentRule(value, neighborValue, neighbor.isDouble)) {
          allowed |= 1 << value;
        }
      }
      candidates &= allowed;
      if (candidates === 0) break;
    }
    return candidates;
  }

  search();
  return { count, solution: firstSolution };
}

function neighbors(index, edges) {
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  const result = [];
  if (col > 0) result.push({ index: index - 1, isDouble: edges.horizontal[row][col - 1] });
  if (col < SIZE - 1) result.push({ index: index + 1, isDouble: edges.horizontal[row][col] });
  if (row > 0) result.push({ index: index - SIZE, isDouble: edges.vertical[row - 1][col] });
  if (row < SIZE - 1) result.push({ index: index + SIZE, isDouble: edges.vertical[row][col] });
  return result;
}

function boxIndex(row, col) {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

function bitCount(mask) {
  let count = 0;
  while (mask) {
    mask &= mask - 1;
    count += 1;
  }
  return count;
}

function validateArguments(board, edges, limit) {
  if (!Array.isArray(board) || board.length !== 81 ||
      board.some((value) => !Number.isInteger(value) || value < 0 || value > 9)) {
    throw new TypeError("board must be an 81-element array of integers from 0 to 9");
  }
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError("limit must be a positive integer");
  }
  if (!edges || !Array.isArray(edges.horizontal) || edges.horizontal.length !== 9 ||
      edges.horizontal.some((row) => !Array.isArray(row) || row.length !== 8 || row.some((v) => typeof v !== "boolean")) ||
      !Array.isArray(edges.vertical) || edges.vertical.length !== 8 ||
      edges.vertical.some((row) => !Array.isArray(row) || row.length !== 9 || row.some((v) => typeof v !== "boolean"))) {
    throw new TypeError("doubleEdges must contain horizontal 9x8 and vertical 8x9 boolean arrays");
  }
}
