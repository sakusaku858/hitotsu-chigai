const SIZE = 9;

/** 通常ナンプレの条件を保つランダムな行・列・数字変換を行います。 */
export function transformSolution(solution, random = Math.random) {
  if (!Array.isArray(solution) || solution.length !== 81 ||
      solution.some((value) => !Number.isInteger(value) || value < 1 || value > 9)) {
    throw new TypeError("solution must be an 81-element completed grid");
  }

  const rowOrder = shuffledGroupOrder(random);
  const colOrder = shuffledGroupOrder(random);
  const transpose = random() < 0.5;
  const digitMap = shuffle(Array.from({ length: SIZE }, (_, index) => index + 1), random);
  const result = Array(81);

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const sourceRow = rowOrder[row];
      const sourceCol = colOrder[col];
      const sourceIndex = transpose
        ? sourceCol * SIZE + sourceRow
        : sourceRow * SIZE + sourceCol;
      result[row * SIZE + col] = digitMap[solution[sourceIndex] - 1];
    }
  }
  return result;
}

function shuffledGroupOrder(random) {
  const groups = shuffle([0, 1, 2], random);
  return groups.flatMap((group) => shuffle([0, 1, 2], random).map((offset) => group * 3 + offset));
}

function shuffle(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}
