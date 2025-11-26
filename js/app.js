console.log('app.js carregado');

// ===== Helpers =====
const fmtBRL = n =>
  (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

let lineChart, pieChart;

// ===== Carregar métricas do dashboard =====
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

    // ainda não calculamos tempo médio, então deixamos como —
    const avg = d.kpis.tempo_medio_horas ?? null;
    document.getElementById('kpi-avg').textContent =
      avg !== null ? avg.toFixed(1) + ' h' : '—';

    renderCharts(d);
  } catch (e) {
    console.error('Erro ao carregar métricas', e);
  }
}

// ===== Gráficos (linha + pizza) =====
function renderCharts(d) {
  const ctxLine = document.getElementById('lineChart');
  const ctxPie  = document.getElementById('pieChart');

  if (lineChart) lineChart.destroy();
  if (pieChart)  pieChart.destroy();

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
        plugins: {
          legend: { position: 'bottom', labels: { color: '#d4d4d8' } }
        }
      }
    });
  }
}

// ===== Lançamentos (tabela) =====
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

function formatStatus(s) {
  switch (s) {
    case 'APROVADA':  return 'Aprovada';
    case 'PENDENTE':  return 'Pendente';
    case 'REPROVADA': return 'Reprovada';
    case 'RASCUNHO':  return 'Rascunho';
    default:          return s || '-';
  }
}

// ===== Veículos (se tiver a tabela de veículos) =====
async function carregarVeiculos() {
  const tbody = document.querySelector('#tbl-veic tbody');
  if (!tbody) return; // se não tiver tabela ainda, só sai

  try {
    const r = await fetch('php/veiculos_resumo.php', { credentials: 'include' });
    if (!r.ok) return;
    const dados = await r.json();

    tbody.innerHTML = '';
    dados.forEach(v => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${v.placa}</td>
        <td>${v.modelo}</td>
        <td>${v.centro_custo || '-'}</td>
        <td>${(v.km_atual ?? 0).toLocaleString('pt-BR')} km</td>
        <td>${fmtBRL(v.gasto_periodo)}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error('Erro ao carregar veículos', e);
  }
}

// ===== Exportar CSV da tabela de lançamentos =====
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
    const csv = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'lancamentos.csv';
    a.click();
    URL.revokeObjectURL(url);
  });
}

// ===== Inicialização automática =====
document.addEventListener('DOMContentLoaded', () => {
  // só roda isso se estivermos no dashboard (existe o kpi-total)
  if (document.getElementById('kpi-total')) {
    console.log('Dashboard inicializando...');
    carregarDashboard();
    carregarLancamentos();
    carregarVeiculos();
    initExportCSV();

    const applyBtn = document.getElementById('apply');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        // por enquanto só recarrega tudo; depois podemos aplicar filtros de data/busca
        carregarDashboard();
        carregarLancamentos();
      });
    }
  }
});
