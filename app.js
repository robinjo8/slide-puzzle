export default function createSlidePuzzle(container) {
  // ---- 1) Zgradimo DOM ----
  const header = document.createElement('div');
  header.className = 'puzzle-header';
  header.innerHTML = `
    <button id="new">Nova igra</button>
    <button id="undo" disabled>Razveljavi</button>
    <button id="hint" disabled>Namig</button>
    <select id="size">
      <option value="3">3×3</option>
      <option value="4" selected>4×4</option>
      <option value="5">5×5</option>
    </select>
  `;
  const stats = document.createElement('div');
  stats.className = 'puzzle-stats';
  stats.innerHTML = `
    <span id="moves">Poteze: 0</span>
    <span id="timer">Čas: 0s</span>
    <span id="record">Rekord: –</span>
  `;
  const boardWrapper = document.createElement('div');
  boardWrapper.style.position = 'relative';
  const board = document.createElement('div');
  board.className = 'puzzle-board';
  const message = document.createElement('div');
  message.className = 'puzzle-message';
  message.textContent = 'Bravo, igra je končana!';
  boardWrapper.append(board, message);

  container.innerHTML = '';
  container.append(header, stats, boardWrapper);

  // ---- 2) Logika igre ----
  let size=4, grid=[], history=[], moves=0, timer=0, interval;
  const newBtn  = header.querySelector('#new');
  const undoBtn = header.querySelector('#undo');
  const hintBtn = header.querySelector('#hint');
  const sizeSel = header.querySelector('#size');
  const movesEl = stats.querySelector('#moves');
  const timerEl = stats.querySelector('#timer');
  const recEl   = stats.querySelector('#record');

  function init() {
    clearInterval(interval);
    moves=0; timer=0;
    size = +sizeSel.value;
    history=[]; message.classList.remove('show');
    grid = Array.from({length:size*size},(_,i)=>i);
    do { shuffle(); } while (!isSolvable() || isComplete());
    updateStats(); render(); startTimer();
  }

  function render() {
    const {width, height} = boardWrapper.getBoundingClientRect();
    const tileSize = Math.floor(Math.min(
      (width - (size-1)*4)/size,
      (height - (size-1)*4)/size
    ));
    board.style.gridTemplate = 
      `repeat(${size}, ${tileSize}px) / repeat(${size}, ${tileSize}px)`;
    board.innerHTML = '';
    grid.forEach((n,i) => {
      const t = document.createElement('div');
      t.className = n===0 ? 'tile empty' : 'tile';
      if (n) t.textContent = n;
      t.style.width = t.style.height = tileSize+'px';
      t.addEventListener('click', ()=>move(i));
      board.append(t);
    });
    undoBtn.disabled = !history.length;
    hintBtn.disabled = moves===0;
  }

  function move(i) {
    const e = grid.indexOf(0);
    const [r1,c1] = [Math.floor(i/size), i%size];
    const [r2,c2] = [Math.floor(e/size), e%size];
    if (Math.abs(r1-r2)+Math.abs(c1-c2)!==1) return;
    history.push(grid.slice());
    [grid[e],grid[i]]=[grid[i],grid[e]];
    moves++; updateStats(); render();
    if (isComplete()) win();
  }

  function shuffle() {
    for (let i=grid.length-1; i>0; i--){
      const j=Math.floor(Math.random()*(i+1));
      [grid[i],grid[j]]=[grid[j],grid[i]];
    }
  }

  function isSolvable(){
    const arr=grid.filter(n=>n>0);
    let inv=0;
    for(let i=0;i<arr.length;i++)
      for(let j=i+1;j<arr.length;j++)
        if(arr[i]>arr[j]) inv++;
    if (size%2===1) return inv%2===0;
    const row = Math.floor(grid.indexOf(0)/size)+1;
    return (inv+row)%2===0;
  }

  function isComplete(){
    return grid.every((n,i)=> i===grid.length-1 ? n===0 : n===i+1);
  }

  function win(){
    clearInterval(interval);
    message.classList.add('show');
    saveRec();
  }

  function startTimer(){
    const start=Date.now();
    interval=setInterval(()=>{
      timer=Math.floor((Date.now()-start)/1000);
      updateStats();
    },500);
  }

  function updateStats(){
    movesEl.textContent=`Poteze: ${moves}`;
    timerEl.textContent=`Čas: ${timer}s`;
    const key=`rec_${size}`;
    const rec=JSON.parse(localStorage.getItem(key)||'null');
    recEl.textContent=rec?`Rekord: ${rec.time}s/${rec.moves}`:'Rekord: –';
  }

  function saveRec(){
    const key=`rec_${size}`;
    const rec=JSON.parse(localStorage.getItem(key)||'null');
    if(!rec||timer<rec.time||(timer===rec.time&&moves<rec.moves))
      localStorage.setItem(key,JSON.stringify({time:timer,moves}));
  }

  newBtn.onclick=init;
  undoBtn.onclick=()=>{ if(history.length){grid=history.pop();moves--;updateStats();render();} };
  hintBtn.onclick=()=>{
    for(let i=1;i<grid.length;i++){
      if(grid[i-1]!==i){
        const idx=grid.indexOf(i);
        board.children[idx].classList.add('hint');
        setTimeout(()=>board.children[idx].classList.remove('hint'),500);
        break;
      }
    }
  };
  sizeSel.onchange=init;

  init();
}
