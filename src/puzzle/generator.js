import { createDoubleEdges, countSolutions } from "./solver.js";
import { transformSolution } from "./transforms.js";

/**
 * シード完成盤面からランダムな一意解の問題を作ります。
 * 数字を削除して解数が1でなくなったら、直前の盤面を採用します。
 */
export function generatePuzzle(solutionSeeds, random = Math.random) {
  if (!Array.isArray(solutionSeeds) || solutionSeeds.length === 0) {
    throw new TypeError("solutionSeeds must contain at least one completed grid");
  }

  const seed = solutionSeeds[Math.floor(random() * solutionSeeds.length)];
  const solution = transformSolution(seed, random);
  const doubleEdges = createDoubleEdges(solution);
  const puzzle = [...solution];
  const removalOrder = shuffle(Array.from({ length: 81 }, (_, index) => index), random);

  for (const index of removalOrder) {
    const previous = puzzle[index];
    puzzle[index] = 0;
    const result = countSolutions(puzzle, doubleEdges, 2);
    if (result.count !== 1) {
      puzzle[index] = previous;
      break;
    }
  }

  return { puzzle, solution, doubleEdges };
}

function shuffle(values, random) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [values[index], values[other]] = [values[other], values[index]];
  }
  return values;
}
