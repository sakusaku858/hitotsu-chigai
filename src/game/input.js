export function bindInput(getGame, render) {
  document.querySelector(".controls").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-value]");
    const game = getGame();
    if (!button || game.selected === null || game.givens[game.selected]) return;

    const value = Number(button.dataset.value);
    game.cells[game.selected] = value;
    render();
  });
}
