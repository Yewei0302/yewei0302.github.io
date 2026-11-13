class EngineeringUnitReference extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    const byId = (id) => this.querySelector('#units-' + id);

    /* ============================================================
       单位换算核心
       ============================================================ */
    const CONV = {
      length: {
        label:'长度', base:'m',
        units:[['mm',1e-3],['cm',1e-2],['m',1],['km',1e3],['in',0.0254],['ft',0.3048]],
        tip:'图纸标 mm，公式里用 m。'
      },
      area: {
        label:'面积', base:'m²',
        units:[['mm²',1e-6],['cm²',1e-4],['m²',1],['in²',0.00064516],['ft²',0.092903]],
        tip:'直径换算成面积要平方，误差会放大。'
      },
      volume: {
        label:'体积', base:'m³',
        units:[['mL',1e-6],['L',1e-3],['m³',1],['cm³',1e-6],['ft³',0.0283168]],
        tip:'1 m³ = 1000 L；流量单位另见下方。'
      },
      mass: {
        label:'质量', base:'kg',
        units:[['g',1e-3],['kg',1],['t',1e3],['lb',0.45359237],['oz',0.0283495]],
        tip:'重量（N）= 质量（kg）× 9.81。'
      },
      pressure: {
        label:'压力 / 压强', base:'Pa',
        units:[['Pa',1],['kPa',1e3],['MPa',1e6],['bar',1e5],['mH₂O',9806.65],['mmH₂O',9.80665],['kgf/cm²',98066.5],['psi',6894.76],['atm',101325]],
        tip:'1 MPa = 10 bar ≈ 102 m 水柱；bar 与 MPa 差 10 倍。'
      },
      power: {
        label:'功率', base:'W',
        units:[['W',1],['kW',1e3],['MW',1e6],['PS（公制）',735.49875],['hp（英制机械）',745.6999],['kcal/h',1.163],['BTU/h',0.29307107]],
        tip:'公制马力 735.5 W，英制 745.7 W，混用差 1.4%。'
      },
      torque: {
        label:'转矩', base:'N·m',
        units:[['N·m',1],['kgf·m',9.80665],['kgf·cm',0.0980665],['lbf·ft',1.355818],['lbf·in',0.1129848]],
        tip:'N·m 与 J 同单位不同物——力矩要乘弧度才是功。'
      },
      flow: {
        label:'流量', base:'m³/s',
        units:[['m³/s',1],['m³/h',1/3600],['L/s',1e-3],['L/min',1/60000],['GPM(US)',6.30902e-5]],
        tip:'公式用 m³/s，样本给 m³/h，差 3600 倍。'
      },
      energy: {
        label:'能量 / 热量', base:'J',
        units:[['J',1],['kJ',1e3],['MJ',1e6],['kW·h',3.6e6],['kcal',4186.8],['BTU',1055.06]],
        tip:'1 kW·h = 3.6 MJ = 860 kcal。'
      },
      speed: {
        label:'转速', base:'r/min',
        units:[['r/min',1],['rad/s',9.549296586],['r/s',60]],
        tip:'力学公式用 rad/s；1 rad/s ≈ 9.55 r/min。'
      },
      temp: {
        label:'温度', base:'K', affine:true,
        units:[['℃',1],['℉',1],['K',1]],
        tip:'温差可直接换（Δ1℃ = Δ1K = Δ1.8℉），绝对温度不行。'
      }
    };

    const ORDER = ['length','area','volume','mass','pressure','power','torque','flow','energy','speed','temp'];

    function fmt(x){
      if(!isFinite(x)) return '—';
      if(x === 0) return '0';
      const a = Math.abs(x);
      if(a >= 1e7 || a < 1e-4) return x.toExponential(4).replace('e','×10^');
      var s = parseFloat(x.toPrecision(7));
      return s.toLocaleString('zh-CN',{maximumFractionDigits:6});
    }

    /* 温度：仿射变换 */
    function tempToK(v,u){
      if(u === '℃') return v + 273.15;
      if(u === '℉') return (v - 32) * 5/9 + 273.15;
      return v;
    }
    function tempFromK(k,u){
      if(u === '℃') return k - 273.15;
      if(u === '℉') return (k - 273.15) * 9/5 + 32;
      return k;
    }

    function buildConv(key){
      const c = CONV[key];
      const opts = c.units.map(u => `<option value="${u[0]}">${u[0]}</option>`).join('');
      return `<div class="conv" data-cat="${key}">
        <h4>${c.label}<small>基准：${c.base}</small></h4>
        <div class="conv-in">
          <input class="cval" type="number" value="1" step="any" inputmode="decimal" aria-label="${c.label}数值">
          <select class="cunit" aria-label="${c.label}单位">${opts}</select>
        </div>
        <div class="conv-out"></div>
        <div class="tip">${c.tip}</div>
      </div>`;
    }

    function runConv(card){
      const key = card.dataset.cat, c = CONV[key];
      const v = parseFloat(card.querySelector('.cval').value);
      const from = card.querySelector('.cunit').value;
      const out = card.querySelector('.conv-out');
      if(!isFinite(v)){ out.innerHTML = '<div><span class="lab">请输入数值</span></div>'; return; }

      let base;
      if(c.affine){ base = tempToK(v, from); }
      else {
        const f = c.units.find(u => u[0] === from)[1];
        base = v * f;
      }

      out.innerHTML = c.units.map(([name, fac]) => {
        const val = c.affine ? tempFromK(base, name) : base / fac;
        const hi = name === from ? ' hi' : '';
        return `<div><span class="lab">${name}</span><span class="val${hi}">${fmt(val)}</span></div>`;
      }).join('');
    }

    (function initConverters(){
      const grid = byId('convgrid');
      grid.innerHTML = ORDER.map(buildConv).join('');
      grid.querySelectorAll('.conv').forEach(card => {
        card.addEventListener('input', () => runConv(card));
        runConv(card);
      });
    })();

    /* ============================================================
       速查表搜索
       ============================================================ */
    (() => {
      const q = byId('q');
      const rows = Array.from(this.querySelectorAll('#units-gtable tbody tr'));
      const cnt = byId('cnt');
      function update(){
        const s = q.value.trim().toLowerCase();
        let n = 0;
        rows.forEach(r => {
          const hit = !s || r.textContent.toLowerCase().includes(s);
          r.style.display = hit ? '' : 'none';
          if(hit) n++;
        });
        cnt.textContent = n + ' / ' + rows.length + ' 条';
      }
      q.addEventListener('input', update);
      update();
    })();

    /* ============================================================
       计算器 1：转矩 ⇄ 功率 ⇄ 转速
       ============================================================ */
    function calcPTn(which){
      const P = parseFloat(byId('ptnP').value); // kW
      const T = parseFloat(byId('ptnT').value); // N·m
      const n = parseFloat(byId('ptnN').value); // r/min
      const res = byId('ptnRes');
      let msg = '';
      if(which === 'P'){
        if(!isFinite(T) || !isFinite(n) || n <= 0){ msg = '需要转矩和转速都有效，且转速 > 0。'; }
        else { const p = T * n / 9550; byId('ptnP').value = p.toFixed(3); msg = `P = T·n/9550 = <b>${p.toFixed(3)} kW</b>`; }
      } else if(which === 'T'){
        if(!isFinite(P) || !isFinite(n) || n <= 0){ msg = '需要功率和转速都有效，且转速 > 0。'; }
        else { const t = 9550 * P / n; byId('ptnT').value = t.toFixed(2); msg = `T = 9550·P/n = <b>${t.toFixed(2)} N·m</b>`; }
      } else {
        if(!isFinite(P) || !isFinite(T) || T <= 0){ msg = '需要功率和转矩都有效，且转矩 > 0。'; }
        else { const nn = 9550 * P / T; byId('ptnN').value = nn.toFixed(1); msg = `n = 9550·P/T = <b>${nn.toFixed(1)} r/min</b>`; }
      }
      res.innerHTML = msg;
    }

    /* ============================================================
       计算器 2：压力 ⇄ 扬程
       ============================================================ */
    function calcPH(mode){
      const p = parseFloat(byId('phP').value); // MPa
      const H = parseFloat(byId('phH').value); // m
      const rho = parseFloat(byId('phRho').value);
      const g = parseFloat(byId('phG').value);
      const res = byId('phRes');
      if (!(rho > 0 && g > 0) || !Number.isFinite(rho * g)) {
        res.textContent = '密度与重力加速度须为有效正数。';
        return;
      }
      if(mode === 'H'){
        if(!isFinite(p)){ res.innerHTML = '请输入压差。'; return; }
        const h = (p * 1e6) / (rho * g);
        byId('phH').value = h.toFixed(2);
        res.innerHTML = `Hₚ = Δp/(ρg) = (${p} × 10⁶ Pa) ÷ (${rho} × ${g}) = <b>${h.toFixed(2)} m</b>`;
      } else {
        if(!isFinite(H)){ res.innerHTML = '请输入压差水头。'; return; }
        const pm = rho * g * H / 1e6;
        byId('phP').value = pm.toFixed(4);
        res.innerHTML = `Δp = ρgHₚ = ${rho} × ${g} × ${H} ÷ 10⁶ = <b>${pm.toFixed(4)} MPa</b>`;
      }
    }

    /* ============================================================
       计算器 3：三相电流估算
       ============================================================ */
    function calcI(){
      const P = parseFloat(byId('ciP').value); // kW
      const U = parseFloat(byId('ciU').value); // V
      const pf = parseFloat(byId('ciPf').value);
      const ef = parseFloat(byId('ciEf').value);
      const res = byId('ciRes');
      if(!isFinite(P) || !isFinite(U) || !isFinite(pf) || !isFinite(ef) || P < 0 || U <= 0 || pf <= 0 || pf > 1 || ef <= 0 || ef > 1){
        res.innerHTML = '轴功率须非负，线电压须为正，功率因数和效率须大于 0 且不超过 1。'; return;
      }
      const I = (P * 1000) / (Math.sqrt(3) * U * pf * ef);
      const S = (Math.sqrt(3) * U * I) / 1000;
      res.innerHTML = `I = P/(√3·U·η·cosφ) = ${(P*1000).toFixed(0)} ÷ (1.732 × ${U} × ${ef} × ${pf}) = <b>${I.toFixed(1)} A</b><br><span style="color:#617581;font-size:13px">对应视在功率约 ${S.toFixed(2)} kVA</span>`;
    }

    const calculators = { calcPTn, calcPH, calcI };
    for (const button of this.querySelectorAll('[data-calc]')) {
      button.addEventListener('click', () => calculators[button.dataset.calc](button.dataset.value));
    }
  }
}

if (!customElements.get('engineering-unit-reference')) {
  customElements.define('engineering-unit-reference', EngineeringUnitReference);
}
