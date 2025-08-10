/* NiceCalc Pro - polished JS
   Features:
   - click + keyboard input
   - ripple effects
   - long-press delete
   - safe-ish evaluation with percent handling
   - smart operator/dot handling
   - responsive friendly
*/

(() => {
  const expEl = document.getElementById('exp');
  const resEl = document.getElementById('res');
  const keys = Array.from(document.querySelectorAll('.key'));
  const DEL_BTN = document.querySelector('.key-del');
  const EQUAL_BTN = document.querySelector('.key-equal');

  let expression = '';
  let justEvaluated = false; // if true, next number input resets expression
  let delInterval = null;

  const MAX_LENGTH = 60;

  // helpers
  const isOperator = ch => ['+', '-', '*', '/'].includes(ch);
  const lastChar = () => expression.slice(-1) || '';
  const lastToken = () => {
    const m = expression.match(/([^\+\-\*\/]+)$/);
    return m ? m[0] : '';
  };

  // sanitize and transform expression to JS-eval friendly string
  function transformExpressionForEval(exp) {
    // replace visual operators if any
    exp = exp.replace(/×/g, '*').replace(/÷/g, '/');
    // Replace occurrences like 50% -> (50/100)
    exp = exp.replace(/(\d+(\.\d+)?)%/g, '($1/100)');
    // strip any invalid characters left
    exp = exp.replace(/[^0-9+\-*/().]/g, '');
    return exp;
  }

  function safeEval(exp) {
    const t = transformExpressionForEval(exp);
    if (!t) return 0;
    // small guard: avoid extremely long expressions
    if (t.length > 200) throw new Error('Expression too long');
    // evaluate
    return Function('"use strict";return (' + t + ')')();
  }

  function renderPreview() {
    // show expression and a live preview result
    expEl.textContent = expression || '';
    try {
      const safe = transformExpressionForEval(expression);
      if (safe && /[0-9]/.test(safe)) {
        const v = safeEval(expression);
        resEl.textContent = (v !== undefined && v !== null && !isNaN(v)) ? String(v) : '0';
      } else {
        resEl.textContent = '0';
      }
    } catch (e) {
      resEl.textContent = 'Err';
    }
  }

  function pushValue(val) {
    // if just evaluated and next input is digit or '.', start fresh
    if (justEvaluated && /^[0-9.]$/.test(val)) {
      expression = '';
      justEvaluated = false;
    }

    if (expression.length >= MAX_LENGTH) return;

    // dot handling: prevent multiple dots in same number
    if (val === '.') {
      const token = lastToken() || '';
      if (token.includes('.')) return;
      if (token === '') {
        // if starting a decimal number, prepend 0
        expression += '0.';
        renderPreview();
        return;
      }
    }

    // operator handling
    if (isOperator(val)) {
      if (expression === '' && val === '-') {
        // allow negative numbers at start
        expression = '-';
        renderPreview();
        return;
      }
      const last = lastChar();
      if (isOperator(last)) {
        // allow patterns like 5 * -3 -> if new operator is '-' append; else replace last operator(s)
        if (val === '-' && last !== '-') {
          expression += '-';
        } else {
          // replace trailing operator(s) with new operator (handles multiple typed operators)
          expression = expression.replace(/[\+\-\*\/]+$/, val);
        }
      } else {
        expression += val;
      }
      justEvaluated = false;
      renderPreview();
      return;
    }

    // normal numbers or 00
    expression += val;
    justEvaluated = false;
    renderPreview();
  }

  function clearAll() {
    expression = '';
    justEvaluated = false;
    resEl.style.transform = 'scale(1)';
    renderPreview();
  }

  function deleteOne() {
    expression = expression.slice(0, -1);
    renderPreview();
  }

  function computeResult() {
    if (!expression) return;
    try {
      const result = safeEval(expression);
      if (typeof result === 'number' && !isNaN(result)) {
        // nice animation
        resEl.style.transition = 'transform .12s cubic-bezier(.2,.9,.2,1), color .12s';
        resEl.style.transform = 'scale(1.06)';
        EQUAL_BTN.classList.add('pulse');
        setTimeout(() => {
          resEl.style.transform = 'scale(1)';
          EQUAL_BTN.classList.remove('pulse');
        }, 180);

        // format result: trim trailing .0
        let str = String(result);
        if (str.length > 18) {
          // avoid huge number text; use toPrecision
          str = Number(result).toPrecision(12).replace(/(?:\.0+|(\.\d+?)0+)$/,'$1');
        } else {
          str = str.replace(/(?:\.0+|(\.\d+?)0+)$/,'$1');
        }

        expression = String(str);
        justEvaluated = true;
        renderPreview();
      } else {
        resEl.textContent = 'Err';
      }
    } catch (err) {
      resEl.textContent = 'Err';
    }
  }

  // ripple effect on buttons
  function createRipple(e, btn) {
    const r = document.createElement('span');
    r.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.2;
    r.style.width = r.style.height = size + 'px';
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    btn.appendChild(r);
    setTimeout(() => r.remove(), 650);
  }

  // attach click listeners
  keys.forEach(k => {
    const val = k.dataset.value;
    const action = k.dataset.action;

    // ripple + action
    k.addEventListener('pointerdown', (ev) => {
      // pointerdown so it works for mouse + touch
      createRipple(ev, k);
      k.classList.add('active-press');
    });

    k.addEventListener('pointerup', () => {
      k.classList.remove('active-press');
    });

    k.addEventListener('click', (ev) => {
      // small click animation
      k.animate([{ transform: 'scale(.98)'}, { transform: 'scale(1)'}], { duration: 120 });

      if (action) {
        if (action === 'clear') clearAll();
        else if (action === 'delete') deleteOne();
        else if (action === 'equals') computeResult();
        return;
      }
      if (val) pushValue(val);
    });
  });

  // long-press delete behavior
  if (DEL_BTN) {
    DEL_BTN.addEventListener('pointerdown', () => {
      // single delete immediate
      deleteOne();
      // after small delay, start interval
      delInterval = setTimeout(() => {
        delInterval = setInterval(() => deleteOne(), 90);
      }, 500);
    });
    const clearDelInterval = () => {
      if (delInterval) { clearTimeout(delInterval); clearInterval(delInterval); delInterval = null; }
    };
    DEL_BTN.addEventListener('pointerup', clearDelInterval);
    DEL_BTN.addEventListener('pointerleave', clearDelInterval);
    DEL_BTN.addEventListener('pointercancel', clearDelInterval);
  }

  // keyboard support
  window.addEventListener('keydown', (ev) => {
    const key = ev.key;
    // ignore when focus is on input-like elements (none in this UI, but just in case)
    const active = document.activeElement && ['INPUT','TEXTAREA'].includes(document.activeElement.tagName);
    if (active) return;

    if ((/^[0-9]$/).test(key)) { pushValue(key); ev.preventDefault(); return; }
    if (key === '0') { pushValue('0'); ev.preventDefault(); return; } // redundant but explicit
    if (key === '.') { pushValue('.'); ev.preventDefault(); return; }
    if (key === 'Enter' || key === '=') { ev.preventDefault(); computeResult(); return; }
    if (key === 'Backspace') { ev.preventDefault(); deleteOne(); return; }
    if (key === 'Escape') { ev.preventDefault(); clearAll(); return; }
    if (key === '+' || key === '-' || key === '*' || key === '/') { pushValue(key); ev.preventDefault(); return; }
    if (key === '%') { pushValue('%'); ev.preventDefault(); return; }
    // allow parentheses via keyboard
    if (key === '(' || key === ')') { pushValue(key); ev.preventDefault(); return; }
  });

  // initialize
  renderPreview();

  // small safety: prevent text selection while dragging on touch
  document.addEventListener('touchmove', (e) => { if (e.target.closest('.keys')) e.preventDefault(); }, { passive: false });
})();
