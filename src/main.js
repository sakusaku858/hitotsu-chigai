import { solutionSeeds } from "./puzzle/solution-seeds.js";
import { generatePuzzle } from "./puzzle/generator.js";
import { createInitialBoard } from "./game/board.js";
import { bindInput } from "./game/input.js";

const boardElement = document.querySelector("#board");
const statusElement = document.querySelector("#status");
let game;

function render() {
  boardElement.replaceChildren();
  game.cells.forEach((value, index) => {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const edgeClasses = [];
    if (col < 8 && game.doubleEdges.horizontal[row][col]) edgeClasses.push("double-right");
    if (row < 8 && game.doubleEdges.vertical[row][col]) edgeClasses.push("double-bottom");
    const cell = document.createElement("div");
    cell.className = [
      "cell",
      game.givens[index] ? "given" : value ? "entry" : "",
      game.selected === index ? "selected" : "",
      ...edgeClasses,
    ].filter(Boolean).join(" ");
    cell.setAttribute("role", "gridcell");
    cell.textContent = value || "";
    cell.addEventListener("click", () => {
      game.selected = index;
      render();
    });
    boardElement.append(cell);
  });
}

function newGame() {
  const button = document.querySelector("#new-game");
  button.disabled = true;
  statusElement.textContent = "問題を生成しています…";
  requestAnimationFrame(() => {
    setTimeout(() => {
      try {
        const generated = generatePuzzle(solutionSeeds);
        game = createInitialBoard(generated.puzzle, generated.solution, generated.doubleEdges);
        statusElement.textContent = "マスを選び、数字を入力してください。";
        render();
      } catch (error) {
        console.error(error);
        statusElement.textContent = "問題を生成できませんでした。ページを再読み込みしてください。";
      } finally {
        button.disabled = false;
      }
    }, 0);
  });
}

bindInput(() => game, render);
document.querySelector("#new-game").addEventListener("click", newGame);
document.querySelector("#hint").addEventListener("click", () => {
  if (!game) return;

  let index = game.selected;
  if (index === null) {
    const emptyCells = game.cells
      .map((value, cellIndex) => value === 0 ? cellIndex : -1)
      .filter((cellIndex) => cellIndex !== -1);
    if (emptyCells.length === 0) {
      statusElement.textContent = "盤面はすべて埋まっています。";
      return;
    }
    index = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    game.selected = index;
  } else if (game.givens[index] || game.cells[index] !== 0) {
    statusElement.textContent = "ヒントを見たい空マスを選んでください。";
    return;
  }

  game.cells[index] = game.solution[index];
  statusElement.textContent = "ヒントを表示しました。";
  render();
});
newGame();
