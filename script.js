const expEl = document.getElementById('exp');
const resEl = document.getElementById('res');
const keys = document.querySelectorAll('.key');

let expression = '';
let justEvaluated = false;

function transformExpression(exp) {
  return exp.replace(/×/g,'*').replace(/÷/g,'/').replace(/(\d+)%/g,'($1/100)');
}
function safeEval(exp) {
  return Function('"use strict";return ('+transformExpression(exp)+')')();
}
function render() {
  expEl.textContent = expression;
  try {
    if(expression) resEl.textContent = safeEval(expression);
    else resEl.textContent = '0';
  } catch {
    resEl.textContent = 'Err';
  }
}
function push(val) {
  if(justEvaluated && /[0-9.]/.test(val)){ expression=''; justEvaluated=false; }
  if(val==='.' && /\.\d*$/.test(expression.split(/[\+\-\*\/]/).pop())) return;
  expression += val;
  render();
}
function clearAll(){ expression=''; render(); }
function del(){ expression=expression.slice(0,-1); render(); }
function compute(){
  try{ expression = String(safeEval(expression)); justEvaluated=true; render(); }
  catch{ resEl.textContent='Err'; }
}
function ripple(e,el){
  const r=document.createElement('span');
  r.className='ripple';
  const rect=el.getBoundingClientRect();
  const size=Math.max(rect.width,rect.height)*1.4;
  r.style.width=r.style.height=size+'px';
  r.style.left=(e.clientX-rect.left-size/2)+'px';
  r.style.top=(e.clientY-rect.top-size/2)+'px';
  el.appendChild(r);
  setTimeout(()=>r.remove(),500);
}
keys.forEach(k=>{
  k.addEventListener('click',e=>{
    ripple(e,k);
    const v=k.dataset.value;
    const a=k.dataset.action;
    if(a==='clear') return clearAll();
    if(a==='delete') return del();
    if(a==='equals') return compute();
    if(v) push(v);
  });
});
window.addEventListener('keydown',e=>{
  if(/[0-9+\-*/.%]/.test(e.key)) push(e.key);
  else if(e.key==='Enter') compute();
  else if(e.key==='Backspace') del();
  else if(e.key==='Escape') clearAll();
});
render();