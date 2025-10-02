const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const COLS = 10, ROWS = 20, SIZE = 24;
canvas.width = COLS * SIZE;
canvas.height = ROWS * SIZE;
ctx.scale(SIZE, SIZE);

const colors = ['#000','#39c5bb','#e83f6f','#ffd166','#06d6a0','#3a86ff','#ff006e','#8338ec'];
const pieces = {
  'T': [[ [0,0,0],[1,1,1],[0,1,0] ]],
  'O': [[ [2,2],[2,2] ]],
  'L': [[ [0,3,0],[0,3,0],[0,3,3] ]],
  'J': [[ [0,4,0],[0,4,0],[4,4,0] ]],
  'S': [[ [0,5,5],[5,5,0],[0,0,0] ]],
  'Z': [[ [6,6,0],[0,6,6],[0,0,0] ]],
  'I': [[ [0,0,0,0],[7,7,7,7],[0,0,0,0],[0,0,0,0] ]],
};

function rotate(m) {
  const N = m.length;
  const res = Array.from({length:N},()=>Array(N).fill(0));
  for (let y=0;y<N;y++) for (let x=0;x<N;x++) res[x][N-1-y]=m[y][x];
  return res;
}

function randomPiece() {
  const keys = Object.keys(pieces);
  const k = keys[(keys.length * Math.random())|0];
  const shape = JSON.parse(JSON.stringify(pieces[k][0]));
  return {matrix:shape, x: (COLS/2|0)- (shape[0].length/2|0), y:0};
}

const arena = Array.from({length:ROWS},()=>Array(COLS).fill(0));
let current = randomPiece();
let dropCounter = 0, dropInterval = 800, lastTime=0;
let score=0, lines=0, level=1;
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');

function collide(arena, p) {
  const m = p.matrix;
  for (let y=0;y<m.length;y++) for (let x=0;x<m[y].length;x++) {
    if (m[y][x]!==0 && (arena[y+p.y] && arena[y+p.y][x+p.x]) !== 0) return true;
    if (m[y][x]!==0 && (!arena[y+p.y] || arena[y+p.y][x+p.x]===undefined)) return true;
  }
  return false;
}

function merge(arena,p) {
  p.matrix.forEach((row,y)=>row.forEach((v,x)=>{ if(v) arena[p.y+y][p.x+x]=v; }));
}

function clearLines() {
  let rowCount=0;
  outer: for (let y=arena.length-1;y>=0;y--) {
    for (let x=0;x<arena[y].length;x++) if (arena[y][x]===0) continue outer;
    const row = arena.splice(y,1)[0].fill(0);
    arena.unshift(row);
    y++;
    rowCount++;
  }
  if (rowCount>0) {
    const points = [0,40,100,300,1200][rowCount] * level;
    score += points;
    lines += rowCount;
    level = 1 + Math.floor(lines/10);
    dropInterval = Math.max(120, 800 - (level-1)*60);
    updateScore();
  }
}

function drawMatrix(m, off) {
  m.forEach((row,y)=>row.forEach((v,x)=>{
    if(!v) return;
    ctx.fillStyle = colors[v];
    ctx.fillRect(x+off.x, y+off.y, 1, 1);
    ctx.fillStyle = 'rgba(0,0,0,.15)';
    ctx.fillRect(x+off.x, y+off.y, 1, 1);
  }));
}

function draw() {
  ctx.fillStyle = '#0b1020';
  ctx.fillRect(0,0,COLS,ROWS);
  // draw arena
  arena.forEach((row,y)=>row.forEach((v,x)=>{
    if(v!==0){
      ctx.fillStyle = colors[v];
      ctx.fillRect(x,y,1,1);
      ctx.fillStyle = 'rgba(0,0,0,.15)';
      ctx.fillRect(x,y,1,1);
    }
  }));
  drawMatrix(current.matrix, {x:current.x, y:current.y});
}

function update(time=0) {
  const dt = time - lastTime; lastTime = time;
  dropCounter += dt;
  if (dropCounter > dropInterval) {
    playerDrop();
  }
  draw();
  requestAnimationFrame(update);
}

function playerDrop() {
  current.y++;
  if (collide(arena,current)) {
    current.y--;
    merge(arena,current);
    resetPiece();
    clearLines();
  }
  dropCounter = 0;
}

function resetPiece() {
  current = randomPiece();
  if (collide(arena,current)) {
    // Game over
    arena.forEach(r=>r.fill(0));
    score = 0; lines = 0; level = 1; dropInterval = 800;
    updateScore();
  }
}

function playerMove(dir) {
  current.x += dir;
  if (collide(arena,current)) current.x -= dir;
}

function playerRotate() {
  const m = rotate(current.matrix);
  const oldX = current.x;
  current.matrix = m;
  // wall kicks simple
  let offsets = [0,-1,1,-2,2];
  for (let i=0;i<offsets.length;i++) {
    current.x = oldX + offsets[i];
    if (!collide(arena,current)) return;
  }
  current.matrix = rotate(rotate(rotate(m)));
  current.x = oldX;
}

function hardDrop() {
  while(!collide(arena,current)) current.y++;
  current.y--;
  merge(arena,current);
  resetPiece();
  clearLines();
  dropCounter = 0;
}

function updateScore(){
  scoreEl.textContent = score;
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

document.addEventListener('keydown', e=>{
  if (e.key==='ArrowLeft') playerMove(-1);
  else if (e.key==='ArrowRight') playerMove(1);
  else if (e.key==='ArrowDown') playerDrop();
  else if (e.key==='ArrowUp') playerRotate();
  else if (e.code==='Space') hardDrop();
});

document.getElementById('left').onclick=()=>playerMove(-1);
document.getElementById('right').onclick=()=>playerMove(1);
document.getElementById('down').onclick=()=>playerDrop();
document.getElementById('rotate').onclick=()=>playerRotate();
document.getElementById('drop').onclick=()=>hardDrop();

updateScore();
update();
