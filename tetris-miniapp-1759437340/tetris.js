// TetriTiny — tetris.js (fast & touch-fix)

const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');

const COLS = 12, ROWS = 20, SCALE = 20;
canvas.width  = COLS * SCALE;
canvas.height = ROWS * SCALE;
ctx.scale(SCALE, SCALE);

const colors = [null,'#FF0D72','#0DC2FF','#0DFF72','#F538FF','#FF8E0D','#FFE138','#3877FF'];

const arena  = createMatrix(COLS, ROWS);
const player = { pos:{x:0,y:0}, matrix:null };

let running   = false;
let gameOver  = false;
let dropInterval = 450;      // hızlı başlangıç
let dropCounter  = 0;
let lastTime     = 0;

let score = 0, lines = 0, level = 1;
let piecesSinceLevel = 0;

const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');

/* utils */
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
  const m=p.matrix,o=p.pos;
  for(let y=0;y<m.length;y++) for(let x=0;x<m[y].length;x++)
    if(m[y][x]!==0 && ((arena[y+o.y] && arena[y+o.y][x+o.x])!==0)) return true;
  return false;
}
function merge(arena,p){ p.matrix.forEach((row,y)=>row.forEach((v,x)=>{ if(v) arena[y+p.pos.y][x+p.pos.x]=v; })); }
function rotate(mat,dir){
  for(let y=0;y<mat.length;y++) for(let x=0;x<y;x++) [mat[x][y],mat[y][x]]=[mat[y][x],mat[x][y]];
  if(dir>0) mat.forEach(r=>r.reverse()); else mat.reverse();
}

/* draw */
function drawMatrix(matrix, off){ matrix.forEach((row,y)=>row.forEach((v,x)=>{ if(!v) return; ctx.fillStyle=colors[v]; ctx.fillRect(x+off.x,y+off.y,1,1);})); }
function drawOverlay(text){
  ctx.save();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle='rgba(5,10,20,.75)'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#e6fbff'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font='bold 36px system-ui,sans-serif'; ctx.fillText(text, canvas.width/2, canvas.height/2-8);
  ctx.font='600 16px system-ui,sans-serif'; ctx.fillStyle='#9cc6ff';
  ctx.fillText('Press Start to play again', canvas.width/2, canvas.height/2+24);
  ctx.restore();
}
function draw(){
  ctx.fillStyle='#0b1020'; ctx.fillRect(0,0,COLS,ROWS);
  drawMatrix(arena,{x:0,y:0}); drawMatrix(player.matrix, player.pos);
  if (gameOver) drawOverlay('GAME OVER');
}
function update(t=0){
  if(!running){ draw(); return; }
  const dt=t-lastTime; lastTime=t; dropCounter+=dt;
  if(dropCounter>dropInterval) playerDrop();
  draw(); requestAnimationFrame(update);
}
function updateScore(){ if(scoreEl) scoreEl.textContent=score; if(linesEl) linesEl.textContent=lines; if(levelEl) levelEl.textContent=level; }

/* rules */
function arenaSweep(){
  let cleared=0;
  outer: for(let y=arena.length-1;y>=0;y--){
    for(let x=0;x<arena[y].length;x++){ if(arena[y][x]===0) continue outer; }
    const row=arena.splice(y,1)[0].fill(0); arena.unshift(row); y++; cleared++;
  }
  if(cleared>0){
    const pts=[0,40,100,300,1200][cleared]*Math.max(1,level);
    score+=pts; lines+=cleared; updateScore();
    try{ window.__miniapp?.addXP?.(cleared*10); }catch(_){}
  }
}
function onPieceLocked(){
  piecesSinceLevel++;
  if(piecesSinceLevel>=8){
    piecesSinceLevel=0; level+=1;
    dropInterval=Math.max(70, dropInterval-60); // minimum 70ms
    updateScore();
  }
}

/* actions */
function playerReset(){
  const types='TJLOSZI';
  player.matrix=createPiece(types[types.length*Math.random()|0]);
  player.pos.y=0; player.pos.x=(arena[0].length/2|0)-(player.matrix[0].length/2|0);
  if(collide(arena,player)){ endGame(); }
}
function playerDrop(){
  player.pos.y++;
  if(collide(arena,player)){
    player.pos.y--; merge(arena,player); arenaSweep(); onPieceLocked(); playerReset();
  }
  dropCounter=0;
}
function hardDrop(){
  while(!collide(arena,player)) player.pos.y++; player.pos.y--;
  merge(arena,player); arenaSweep(); onPieceLocked(); playerReset(); dropCounter=0;
}
function playerMove(d){ player.pos.x+=d; if(collide(arena,player)) player.pos.x-=d; }
function playerRotate(d){
  const pos=player.pos.x; rotate(player.matrix,d); let off=1;
  while(collide(arena,player)){ player.pos.x+=off; off=-(off+(off>0?1:-1)); if(off>player.matrix[0].length){ rotate(player.matrix,-d); player.pos.x=pos; return; } }
}

/* end */
function endGame(){
  running=false; gameOver=true;
  try{ window.__miniapp?.onGameOver?.(); }catch(_){}
  arena.forEach(r=>r.fill(0));
  score=0; lines=0; level=1; dropInterval=450; piecesSinceLevel=0;
  updateScore(); draw();
}

/* input */
document.addEventListener('keydown', e=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  if(!running) return;
  if(e.code==='ArrowLeft') playerMove(-1);
  else if(e.code==='ArrowRight') playerMove(1);
  else if(e.code==='ArrowDown') playerDrop();
  else if(e.code==='ArrowUp') playerRotate(1);
  else if(e.code==='Space') hardDrop();
});

/* start/finish */
function _startGame(){
  if(running) return;
  running=true; gameOver=false; lastTime=0;
  playerReset(); updateScore(); requestAnimationFrame(update);
}
window.tetrisStart=_startGame; window.startGame=_startGame; window.__tetris={ start:_startGame };

const startBtn=document.getElementById('startButton');
const finishBtn=document.getElementById('finishButton');
startBtn && startBtn.addEventListener('click', _startGame);
finishBtn && finishBtn.addEventListener('click', ()=>{ if(running) endGame(); });

/* boot */
playerReset(); updateScore(); draw();
