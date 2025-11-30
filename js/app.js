console.log('app.js carregado');

// ======================
//   HELPERS
// ======================
const fmtBRL = n =>
  (n ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

let lineChart, pieChart;

// ======================
//   DASHBOARD / MÉTRICAS
// ======================
async function carregarDashboard() {
  try {
    const r = await fetch('php/metrics.php', { credentials: 'include' });
    if (r.status === 401) {
      window.location.href = 'index.html';
      return;
    }
    const d = await r.json();

    // KPIs
    document.getElementById('kpi-total').textContent =
      fmtBRL(d.kpis.gasto_total);

    document.getElementById('kpi-cpkm').textContent =
      fmtBRL(d.kpis.custo_km) + '/km';

    document.getElementById('kpi-approve').textContent =
      (d.kpis.taxa_aprovacao ?? 0).toFixed(1) + '%';

    const avg = d.kpis.tempo_medio_horas ?? null;
    document.getElementById('kpi-avg').textContent =
      avg !== null ? avg.toFixed(1) + ' h' : '—';

    renderCharts(d);
  } catch (e) {
    console.error('Erro ao carregar métricas', e);
  }
}

// ======================
//   GRÁFICOS (linha + pizza)
// ======================
function renderCharts(d) {
  const ctxLine = document.getElementById('lineChart');
  const ctxPie  = document.getElementById('pieChart');

  if (lineChart) lineChart.destroy();
  if (pieChart)  pieChart.destroy();

  // Linha: tendência de gastos
  if (ctxLine && d.line) {
    lineChart = new Chart(ctxLine, {
      type: 'line',
      data: {
        labels: d.line.labels,
        datasets: [{
          data: d.line.series,
          tension: 0.35,
          fill: true
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(255,255,255,.06)' } }
        }
      }
    });
  }

  // Pizza: gastos por categoria
  if (ctxPie && d.pie) {
    pieChart = new Chart(ctxPie, {
      type: 'doughnut',
      data: {
        labels: d.pie.labels,
        datasets: [{
          data: d.pie.series,
          borderWidth: 0
        }]
      },
      options: {
        maintainAspectRatio: false, // deixa o canvas ocupar o painel
        layout: {
          padding: {
            bottom: 24 // reserva espaço pra legenda
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#d4d4d8',
              boxWidth: 18,
              boxHeight: 8,
              padding: 10
            }
          }
        }
      }
    });
  }
}

// ======================
//   LANÇAMENTOS (dashboard - últimos)
// ======================
async function carregarLancamentos() {
  try {
    const r = await fetch('php/lancamentos.php', { credentials: 'include' });
    if (!r.ok) return;
    const dados = await r.json();

    const tbody = document.querySelector('#tbl tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    dados.forEach(l => {
      const tr = document.createElement('tr');
      const data = l.data
        ? new Date(l.data).toLocaleDateString('pt-BR')
        : '-';
      tr.innerHTML = `
        <td>${data}</td>
        <td>${l.veiculo || '-'}</td>
        <td>${l.categoria || '-'}</td>
        <td>${l.fornecedor || '-'}</td>
        <td>${fmtBRL(l.valor)}</td>
        <td>${formatStatus(l.status)}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error('Erro ao carregar lançamentos', e);
  }
}

// ======================
//   LANÇAMENTOS (aba Lançamentos - completa)
// ======================
async function carregarLancamentosFull() {
  const tbody = document.querySelector('#tbl-lanc tbody');
  if (!tbody) return;

  try {
    const params = new URLSearchParams();
    const q      = document.getElementById('f-q')?.value.trim();
    const from   = document.getElementById('f-from')?.value;
    const to     = document.getElementById('f-to')?.value;
    const status = document.getElementById('f-status')?.value;

    if (q)      params.append('q', q);
    if (from)   params.append('from', from);
    if (to)     params.append('to', to);
    if (status) params.append('status', status);

    const url = 'php/lancamentos.php?all=1&' + params.toString();

    const r = await fetch(url, { credentials: 'include' });
    if (!r.ok) return;

    const dados = await r.json();
    tbody.innerHTML = '';

    dados.forEach(l => {
      const tr = document.createElement('tr');
      const data = l.data
        ? new Date(l.data).toLocaleDateString('pt-BR')
        : '-';

      const obs = (l.obs || '').length > 60
        ? l.obs.substring(0, 57) + '...'
        : (l.obs || '-');

      tr.innerHTML = `
        <td>${data}</td>
        <td>${l.veiculo || '-'}</td>
        <td>${l.categoria || '-'}</td>
        <td>${l.fornecedor || '-'}</td>
        <td>${fmtBRL(l.valor)}</td>
        <td>${formatStatus(l.status)}</td>
        <td>${obs}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error('Erro ao carregar lançamentos (aba completa)', e);
  }
}

// ======================
//   STATUS helper
// ======================
function formatStatus(s) {
  switch (s) {
    case 'APROVADA':  return 'Aprovada';
    case 'PENDENTE':  return 'Pendente';
    case 'REPROVADA': return 'Reprovada';
    case 'RASCUNHO':  return 'Rascunho';
    default:          return s || '-';
  }
}

// ======================
//   VEÍCULOS (aba Veículos)
// ======================
async function carregarVeiculos() {
  const tbody = document.querySelector('#tbl-veic tbody');
  if (!tbody) return;

  try {
    const r = await fetch('php/veiculos_resumo.php', { credentials: 'include' });
    if (!r.ok) return;
    const dados = await r.json();

    tbody.innerHTML = '';
    dados.forEach(v => {
      const tr = document.createElement('tr');

      const ultima = v.ultima_manutencao
        ? new Date(v.ultima_manutencao).toLocaleDateString('pt-BR')
        : '-';

      tr.innerHTML = `
        <td>${v.placa}</td>
        <td>${v.modelo || '-'}</td>
        <td>${(v.km_atual ?? 0).toLocaleString('pt-BR')} km</td>
        <td>${fmtBRL(v.gasto_periodo)}</td>
        <td>${ultima}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error('Erro ao carregar veículos', e);
  }
}

// ======================
//   RELATÓRIOS (categoria + veículo)
//   -> usa php/lancamentos.php?all=1 (mesmo endpoint antigo)
// ======================
async function carregarRelatorios() {
  const tbodyCat  = document.querySelector('#tbl-rel-cat tbody');
  const tbodyVeic = document.querySelector('#tbl-rel-veic tbody');
  if (!tbodyCat || !tbodyVeic) return;

  try {
    const params = new URLSearchParams();
    const from   = document.getElementById('r-from')?.value;
    const to     = document.getElementById('r-to')?.value;
    const status = document.getElementById('r-status')?.value;

    if (from)   params.append('from', from);
    if (to)     params.append('to', to);
    if (status) params.append('status', status);

    const url = 'php/lancamentos.php?all=1&' + params.toString();

    const r = await fetch(url, { credentials: 'include' });
    if (!r.ok) return;

    const dados = await r.json();

    // ---- agrega por categoria ----
    const porCategoria = {};
    dados.forEach(l => {
      const cat = l.categoria || 'Sem categoria';
      if (!porCategoria[cat]) {
        porCategoria[cat] = { qtd: 0, total: 0 };
      }
      porCategoria[cat].qtd   += 1;
      porCategoria[cat].total += Number(l.valor) || 0;
    });

    // ---- agrega por veículo ----
    const porVeiculo = {};
    dados.forEach(l => {
      const veic = l.veiculo || '—';
      if (!porVeiculo[veic]) {
        porVeiculo[veic] = { qtd: 0, total: 0 };
      }
      porVeiculo[veic].qtd   += 1;
      porVeiculo[veic].total += Number(l.valor) || 0;
    });

    // ---- render categoria ----
    tbodyCat.innerHTML = '';
    Object.entries(porCategoria).forEach(([cat, info]) => {
      const media = info.qtd > 0 ? info.total / info.qtd : 0;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${cat}</td>
        <td>${info.qtd}</td>
        <td>${fmtBRL(info.total)}</td>
        <td>${fmtBRL(media)}</td>
      `;
      tbodyCat.appendChild(tr);
    });

    // ---- render veículo ----
    tbodyVeic.innerHTML = '';
    Object.entries(porVeiculo).forEach(([veic, info]) => {
      const media = info.qtd > 0 ? info.total / info.qtd : 0;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${veic}</td>
        <td>${info.qtd}</td>
        <td>${fmtBRL(info.total)}</td>
        <td>${fmtBRL(media)}</td>
      `;
      tbodyVeic.appendChild(tr);
    });

  } catch (e) {
    console.error('Erro ao carregar relatórios', e);
  }
}

// ======================
//   EXPORTAR CSV (Dashboard)
// ======================
function initExportCSV() {
  const btn = document.getElementById('export');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const rows = [
      ['Data', 'Veículo', 'Categoria', 'Fornecedor', 'Valor', 'Status'],
      ...Array.from(document.querySelectorAll('#tbl tbody tr')).map(tr =>
        Array.from(tr.children).map(td => td.innerText)
      )
    ];
    const csv  = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'lancamentos.csv';
    a.click();
    URL.revokeObjectURL(url);
  });
}

// ======================
//   NAVEGAÇÃO ENTRE ABAS
// ======================
function initNav() {
  const links    = document.querySelectorAll('.nav a[data-section]');
  const sections = document.querySelectorAll('.page-section');

  if (!links.length || !sections.length) return;

  function showSection(sec) {
    sections.forEach(s =>
      s.classList.toggle('active', s.id === 'sec-' + sec)
    );

    if (sec === 'dashboard') {
      carregarDashboard();
      carregarLancamentos();
    }
    if (sec === 'lancamentos') carregarLancamentosFull();
    if (sec === 'veiculos')    carregarVeiculos();
    if (sec === 'relatorios')  carregarRelatorios();
    // 'admin' por enquanto só mostra o layout estático
  }

  links.forEach(link => {
    const sec = link.dataset.section;
    if (!sec) return;
    link.addEventListener('click', e => {
      e.preventDefault();
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      showSection(sec);
    });
  });

  // Logo clicável: volta pro dashboard
  const brand = document.getElementById('brandHome');
  if (brand) {
    brand.addEventListener('click', e => {
      e.preventDefault();
      links.forEach(l => l.classList.remove('active'));
      const dashLink = document.querySelector('.nav a[data-section="dashboard"]');
      if (dashLink) dashLink.classList.add('active');
      showSection('dashboard');
    });
  }

  // Página inicial = dashboard
  showSection('dashboard');
}

// ======================
//   INICIALIZAÇÃO
// ======================
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('kpi-total')) {
    console.log('Dashboard inicializando...');

    initExportCSV();
    initNav();

    const btnFiltrosLanc = document.getElementById('f-apply-lanc');
    if (btnFiltrosLanc) {
      btnFiltrosLanc.addEventListener('click', () => {
        carregarLancamentosFull();
      });
    }

    const btnFiltrosRel = document.getElementById('f-apply-rel');
    if (btnFiltrosRel) {
      btnFiltrosRel.addEventListener('click', () => {
        carregarRelatorios();
      });
    }
  }
});
