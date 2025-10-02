// TetriTiny — Start kontrollü, ArrowUp rotate, Space hard drop,
// satır kırınca XP, HER 20 TAŞTA level + hız artışı

// ----- Canvas / ölçüler -----
const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const COLS = 12, ROWS = 20, SCALE = 20;
canvas.width = COLS * SCALE;
canvas.height = ROWS * SCALE;
ctx.scale(SCALE, SCALE);

// ----- Renkler -----
const colors = [
  null,
  '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF',
  '#FF8E0D', '#FFE138', '#3877FF'
];

// ----- Arena & oyuncu -----
const arena = createMatrix(COLS, ROWS);
const player = { pos: { x:0, y:0 }, matrix: null };

// ----- Oyun durumu -----
let running = false;
let dropInterval = 1000;     // ms (hız)
let dropCounter  = 0;
let lastTime     = 0;

let score = 0, lines = 0, level = 1;
let piecesSinceLevel = 0;    // <<< her yerleşen taş sayacı

const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');

// ========== Yardımcılar ==========
function createMatrix(w,h){ const m=[]; while(h--) m.push(new Array(w).fill(0)); return m; }

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
  const m=p.matrix, o=p.pos;
  for(let y=0;y<m.length;y++){
    for(let x=0;x<m[y].length;x++){
      if(m[y][x]!==0 &&
        ((arena[y+o.y] && arena[y+o.y][x+o.x])!==0)) return true;
    }
  }
  return false;
}

function merge(arena, p){
  p.matrix.forEach((row,y)=>row.forEach((v,x)=>{ if(v) arena[y+p.pos.y][x+p.pos.x]=v; }));
}

function rotate(mat, dir){
  // transpose
  for(let y=0;y<mat.length;y++){
    for(let x=0;x<y;x++){
      [mat[x][y], mat[y][x]] = [mat[y][x], mat[x][y]];
    }
  }
  // reverse rows or whole
  if(dir>0) mat.forEach(r=>r.reverse()); else mat.reverse();
}

function drawMatrix(matrix, offset){
  matrix.forEach((row,y)=>row.forEach((v,x)=>{
    if(!v) return;
    ctx.fillStyle = colors[v];
    ctx.fillRect(x+offset.x, y+offset.y, 1, 1);
  }));
}

function draw(){
  ctx.fillStyle='#0b1020';
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

// ========== Oyun mekaniği ==========
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

    // XP: satır başına 10
    if(window.__miniapp && typeof window.__miniapp.addXP==='function'){
      window.__miniapp.addXP(cleared*10);
    }
  }
}

// Bir taş yerleştiğinde (merge sonrası) çağrılır
function onPieceLocked(){
  piecesSinceLevel++;
  if (piecesSinceLevel >= 20) {
    piecesSinceLevel = 0;
    level += 1;
    // Hızı biraz artır: her level +80ms daha hızlı (alt sınır 120ms)
    dropInterval = Math.max(120, dropInterval - 80);
    updateScore();
  }
}

function playerReset(){
  const types = 'TJLOSZI';
  player.matrix = createPiece(types[types.length*Math.random()|0]);
  player.pos.y = 0;
  player.pos.x = (arena[0].length/2|0) - (player.matrix[0].length/2|0);
  if(collide(arena, player)){
    // Game over → temizle
    arena.forEach(r=>r.fill(0));
    score=0; lines=0; level=1; dropInterval=1000; piecesSinceLevel=0;
    updateScore();
  }
}

function playerDrop(){
  player.pos.y++;
  if(collide(arena,player)){
    player.pos.y--;
    merge(arena,player);
    arenaSweep();
    onPieceLocked();     // <<< 1 taş yerleşti
    playerReset();
  }
  dropCounter = 0;
}

function hardDrop(){
  while(!collide(arena, player)) player.pos.y++;
  player.pos.y--; // bir adım geri
  merge(arena, player);
  arenaSweep();
  onPieceLocked();       // <<< 1 taş yerleşti
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

// ========== Kontroller ==========
document.addEventListener('keydown', e=>{
  // bu tuşlar sayfayı kaydırmasın
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
  if(!running) return; // Start’a basmadan kontrol alma

  if(e.code==='ArrowLeft') playerMove(-1);
  else if(e.code==='ArrowRight') playerMove(1);
  else if(e.code==='ArrowDown') playerDrop();
  else if(e.code==='ArrowUp') playerRotate(1);
  else if(e.code==='Space') hardDrop();
});

// Start butonu oyun döngüsünü başlatır
const startBtn = document.getElementById('startButton');
if(startBtn){
  startBtn.addEventListener('click', ()=>{
    if(!running){
      running = true;
      lastTime = 0;
      playerReset();
      updateScore();
      requestAnimationFrame(update);
    }
  });
}

// İlk çizim (başlangıçta bekleme ekranı)
playerReset();
updateScore();
draw();
