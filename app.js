document.addEventListener('DOMContentLoaded', () => {
  const puzzle      = document.getElementById('puzzle');
  const newGameBtn  = document.getElementById('new-game');
  const undoBtn     = document.getElementById('undo');
  const hintBtn     = document.getElementById('hint');
  const diffSelect  = document.getElementById('difficulty');
  const movesEl     = document.getElementById('moves');
  const timerEl     = document.getElementById('timer');
  const recordEl    = document.getElementById('record');
  const messageEl   = document.getElementById('message');
  const helpBtn     = document.getElementById('help-btn');
  const helpModal   = document.getElementById('help-modal');
  const closeHelp   = document.getElementById('close-help');

  let size, grid, history, moves, timer, timerInt;

  function init() {
    clearInterval(timerInt);
    moves = 0; timer = 0;
    size  = +diffSelect.value;
    history = [];
    messageEl.style.display = 'none';
    grid = Array.from({length: size*size}, (_,i) => i);
    do { shuffle(); } while (!isSolvable() || isComplete());
    updateStats();
    render();
  }

  function render() {
    puzzle.style.gridTemplateColumns = `repeat(${size}, var(--tile-size))`;
    puzzle.style.gridTemplateRows    = `repeat(${size}, var(--tile-size))`;
    puzzle.innerHTML = '';
    grid.forEach((n, i) => {
      const t = document.createElement('div');
      t.className = n === 0 ? 'tile empty' : 'tile';
      if (n !== 0) t.textContent = n;
      t.addEventListener('click', () => move(i));
      puzzle.appendChild(t);
    });
    undoBtn.disabled = history.length === 0;
    hintBtn.disabled = moves === 0;
  }

  function move(idx) {
    if (moves === 0) startTimer();
    const e = grid.indexOf(0);
    const [r1, c1] = [Math.floor(idx/size), idx%size];
    const [r2, c2] = [Math.floor(e/size), e%size];
    if (Math.abs(r1-r2) + Math.abs(c1-c2) === 1) {
      history.push(grid.slice());
      [grid[idx], grid[e]] = [grid[e], grid[idx]];
      moves++;
      updateStats();
      render();
      if (isComplete()) win();
    }
  }

  function shuffle() {
    for (let i = grid.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [grid[i], grid[j]] = [grid[j], grid[i]];
    }
  }

  function isSolvable() {
    const arr = grid.filter(n => n > 0);
    let inv = 0;
    for (let i = 0; i < arr.length; i++)
      for (let j = i+1; j < arr.length; j++)
        if (arr[i] > arr[j]) inv++;
    if (size % 2 === 1) return inv % 2 === 0;
    const row = Math.floor(grid.indexOf(0)/size) + 1;
    return (inv + row) % 2 === 0;
  }

  function isComplete() {
    for (let i = 1; i < grid.length; i++)
      if (grid[i-1] !== i) return false;
    return grid[grid.length-1] === 0;
  }

  function win() {
    clearInterval(timerInt);
    messageEl.style.display = 'block';
    saveRecord();
  }

  function startTimer() {
    timerInt = setInterval(() => {
      timer++;
      updateStats();
    }, 1000);
  }

  function updateStats() {
    movesEl.textContent  = `Poteze: ${moves}`;
    timerEl.textContent  = `Čas: ${timer}s`;
    const key = `rec_${size}`;
    const rec = JSON.parse(localStorage.getItem(key) || 'null');
    recordEl.textContent = rec
      ? `Rekord: ${rec.time}s / ${rec.moves} potez`
      : 'Rekord: –';
  }

  function saveRecord() {
    const key = `rec_${size}`;
    const rec = JSON.parse(localStorage.getItem(key) || 'null');
    if (!rec || timer < rec.time || (timer === rec.time && moves < rec.moves)) {
      localStorage.setItem(key, JSON.stringify({time:timer, moves}));
    }
  }

  undoBtn.onclick = () => {
    if (history.length === 0) return;
    grid = history.pop();
    moves--;
    updateStats();
    render();
  };

  hintBtn.onclick = () => {
    // highlight first wrong tile
    for (let i = 1; i < grid.length; i++) {
      if (grid[i-1] !== i) {
        const idx = grid.indexOf(i);
        const t = puzzle.children[idx];
        t.classList.add('hint');
        setTimeout(() => t.classList.remove('hint'), 500);
        break;
      }
    }
  };

  newGameBtn.onclick  = init;
  diffSelect.onchange = init;

  puzzle.addEventListener('keydown', e => {
    const eidx = grid.indexOf(0);
    let t;
    if (e.key === 'ArrowUp')    t = eidx + size;
    if (e.key === 'ArrowDown')  t = eidx - size;
    if (e.key === 'ArrowLeft')  t = eidx + 1;
    if (e.key === 'ArrowRight') t = eidx - 1;
    if (t >= 0 && t < grid.length) move(t);
  });

  helpBtn.onclick    = () => helpModal.style.display = 'flex';
  closeHelp.onclick  = () => helpModal.style.display  = 'none';

  init();
});
