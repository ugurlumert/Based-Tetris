// TetriTiny — tetris.js (copy-paste full file)
// - Start dışarıdan çağrılabilir: window.tetrisStart() / window.__tetris.start()
// - Game Over veya Finish -> XP flush + onGameOver() hook
// - Klavye: ← → ↓ döndürme ↑, hard drop Space

const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');

const COLS = 12, ROWS = 20, SCALE = 20;
canvas.width = COLS * SCALE;
canvas.height = ROWS * SCALE;
ctx.scale(SCALE, SCALE);

const colors = [
  null,
  '#FF0D72', // T
  '#0DC2FF', // O
  '#0DFF72', // L
  '#F538FF', // J
  '#FF8E0D', // I
  '#FFE138', // S
  '#3877FF'  // Z
];

const arena = createMatrix(COLS, ROWS);
const player = { pos: { x: 0, y: 0 }, matrix: null };

let running = false;
let dropInterval = 1000;
let dropCounter  = 0;
let lastTime     = 0;

let score = 0, lines = 0, level = 1;
let piecesSinceLevel = 0;

const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');

/* ---------------- utilities ---------------- */
function createMatrix(w, h){
  const m = [];
  while (h--) m.push(new Array(w).fill(0));
  return m;
}

function createPiece(t){
  if (t==='T') return [[0,0,0],[1,1,1],[0,1,0]];
  if (t==='O') return [[2,2],[2,2]];
  if (t==='L') return [[0,3,0],[0,3,0],[0,3,3]];
  if (t==='J') return [[0,4,0],[0,4,0],[4,4,0]];
  if (t==='I') return [[0,0,0,0],[5,5,5,5],[0,0,0,0],[0,0,0,0]];
  if (t==='S') return [[0,6,6],[6,6,0],[0,0,0]];
  if (t==='Z') return [[7,7,0],[0,7,7],[0,0,0]];
}

function collide(arena, p){
  const m = p.matrix, o = p.pos;
  for (let y=0; y<m.length; y++){
    for (let x=0; x<m[y].length; x++){
      if (m[y][x]!==0 && ((arena[y+o.y] && arena[y+o.y][x+o.x])!==0)) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, p){
  p.matrix.forEach((row,y)=>row.forEach((v,x)=>{ if(v) arena[y+p.pos.y][x+p.pos.x]=v; }));
}

function rotate(mat, dir){
  for(let y=0;y<mat.length;y++){
    for(let x=0;x<y;x++){
      [mat[x][y], mat[y][x]] = [mat[y][x], mat[x][y]];
    }
  }
  if(dir>0) mat.forEach(r=>r.reverse()); else mat.reverse();
}

function drawMatrix(matrix, offset){
  matrix.forEach((row,y)=>row.forEach((v,x)=>{
    if(!v) return;
    ctx.fillStyle = colors[v];
    ctx.fillRect(x+offset.x, y+offset.y, 1, 1);
  }));
}

/* ---------------- render loop ---------------- */
function draw(){
  ctx.fillStyle = '#0b1020';
  ctx.fillRect(0,0,COLS,ROWS);
  drawMatrix(arena,{x:0,y:0});
  drawMatrix(player.matrix, player.pos);
}

function update(time=0){
  if(!running){ draw(); return; }
  const dt = time - lastTime; lastTime = time;
  dropCounter += dt;
  if(dropCounter > dropInterval){ playerDrop(); }
  draw();
  requestAnimationFrame(update);
}

function updateScore(){
  if(scoreEl) scoreEl.textContent = score;
  if(linesEl) linesEl.textContent = lines;
  if(levelEl) levelEl.textContent = level;
}

/* ---------------- game rules ---------------- */
function arenaSweep(){
  let cleared = 0;
  outer: for(let y=arena.length-1;y>=0;y--){
    for(let x=0;x<arena[y].length;x++){
      if(arena[y][x]===0) continue outer;
    }
    const row = arena.splice(y,1)[0].fill(0);
    arena.unshift(row);
    y++;
    cleared++;
  }
  if(cleared>0){
    const points=[0,40,100,300,1200][cleared] * Math.max(1, level);
    score += points;
    lines += cleared;
    updateScore();

    // XP kazanımı (yerel)
    try{
      if(window.__miniapp && typeof window.__miniapp.addXP==='function'){
        window.__miniapp.addXP(cleared*10);
      }
    }catch(_){}
  }
}

function onPieceLocked(){
  piecesSinceLevel++;
  if (piecesSinceLevel >= 20) {
    piecesSinceLevel = 0;
    level += 1;
    dropInterval = Math.max(120, dropInterval - 80);
    updateScore();
  }
}

/* ---------------- player actions ---------------- */
function playerReset(){
  const types = 'TJLOSZI';
  player.matrix = createPiece(types[types.length*Math.random()|0]);
  player.pos.y = 0;
  player.pos.x = (arena[0].length/2|0) - (player.matrix[0].length/2|0);

  // Başlangıçta çakışırsa: Game Over
  if(collide(arena, player)){
    endGame();
  }
}

function playerDrop(){
  player.pos.y++;
  if(collide(arena,player)){
    player.pos.y--;
    merge(arena,player);
    arenaSweep();
    onPieceLocked();
    playerReset();
  }
  dropCounter = 0;
}

function hardDrop(){
  while(!collide(arena, player)) player.pos.y++;
  player.pos.y--;
  merge(arena, player);
  arenaSweep();
  onPieceLocked();
  playerReset();
  dropCounter = 0;
}

function playerMove(dir){
  player.pos.x += dir;
  if(collide(arena,player)) player.pos.x -= dir;
}

function playerRotate(dir){
  const pos = player.pos.x;
  rotate(player.matrix, dir);
  let offset = 1;
  while(collide(arena, player)){
    player.pos.x += offset;
    offset = -(offset + (offset>0?1:-1));
    if(offset > player.matrix[0].length){
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

/* ---------------- end game ---------------- */
function endGame(){
  running = false;

  // 1) On-chain’e XP gönder (index.js tarafındaki flushXP)
  try{
    if (window.__miniapp && typeof window.__miniapp.flushXP === 'function') {
      window.__miniapp.flushXP();
    }
  }catch(_){}

  // 2) Harici dinleyiciye bildir (gerekirse)
  try{
    window.__miniapp?.onGameOver?.();
  }catch(_){}
  window.__tetrisGameOver = true; // yedek sinyal

  // 3) Sahnede sıfırla
  arena.forEach(r=>r.fill(0));
  score=0; lines=0; level=1; dropInterval=1000; piecesSinceLevel=0;
  updateScore();
}

/* ---------------- input ---------------- */
document.addEventListener('keydown', e=>{
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
    // sayfa kaymasın
    e.preventDefault();
  }
  if(!running) return;
  if(e.code==='ArrowLeft') playerMove(-1);
  else if(e.code==='ArrowRight') playerMove(1);
  else if(e.code==='ArrowDown') playerDrop();
  else if(e.code==='ArrowUp') playerRotate(1);
  else if(e.code==='Space') hardDrop();
});

/* ---------------- start/finish buttons ---------------- */
function _startGame(){
  if(running) return;
  running = true;
  lastTime = 0;
  playerReset();
  updateScore();
  requestAnimationFrame(update);
}

// Dışarıdan da çağrılabilsin (index.html fallback’leri için)
window.tetrisStart = _startGame;
window.startGame  = _startGame;
window.__tetris   = { start: _startGame };

const startBtn  = document.getElementById('startButton');
const finishBtn = document.getElementById('finishButton');

if(startBtn){  startBtn.addEventListener('click', _startGame); }
if(finishBtn){ finishBtn.addEventListener('click', ()=>{ if(running) endGame(); }); }

/* ---------------- bootstrap ---------------- */
playerReset();
updateScore();
draw();
