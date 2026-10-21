export function createInitialBoard(puzzle, solution, doubleEdges) {
  const givens = puzzle.map((value) => value !== 0);
  return {
    solution: [...solution],
    givens,
    cells: [...puzzle],
    doubleEdges,
    selected: null,
    revealed: false,
  };
}
