const fmtBRL = n => (n ?? 0).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
let lineChart, pieChart;

// ===== Navegação =====
function initNav() {
  const links = document.querySelectorAll('.nav a[data-section]');
  const sections = document.querySelectorAll('.page-section');

  function showSection(id) {
    sections.forEach(sec => sec.classList.toggle('active', sec.id === `sec-${id}`));
    if (id === 'dashboard') carregarDashboard();
    if (id === 'lancamentos') carregarLancamentos();
    if (id === 'veiculos') carregarVeiculos();
    if (id === 'admin') carregarAdmin();
  }

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      showSection(link.dataset.section);
    });
  });

  showSection('dashboard');
}

// ===== Dashboard =====
async function carregarDashboard() {
  try {
    const r = await fetch('php/metrics.php', {credentials:'include'});
    if (!r.ok) return;
    const d = await r.json();

    // KPIs
    document.getElementById('kpi-total').textContent   = fmtBRL(d.kpis.gasto_total);
    document.getElementById('kpi-cpkm').textContent    = fmtBRL(d.kpis.custo_km) + '/km';
    document.getElementById('kpi-approve').textContent = (d.kpis.taxa_aprovacao ?? 0).toFixed(1) + '%';
    document.getElementById('kpi-avg').textContent     = (d.kpis.tempo_medio_horas ?? 0).toFixed(1) + ' h';

    // gráficos
    renderCharts(d);
  } catch (e) {
    console.error('Erro carregar dashboard', e);
  }
}

function renderCharts(d) {
  if (lineChart) lineChart.destroy();
  if (pieChart) pieChart.destroy();

  const ctx1 = document.getElementById('lineChart');
  if (ctx1) {
    lineChart = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: d.line.labels,
        datasets: [{data: d.line.series, tension:0.35, fill:true}]
      },
      options: {
        plugins: {legend:{display:false}},
        scales: {
          x: {grid:{display:false}},
          y: {grid:{color:'rgba(255,255,255,.06)'}}
        }
      }
    });
  }

  const ctx2 = document.getElementById('pieChart');
  if (ctx2) {
    pieChart = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: d.pie.labels,
        datasets: [{data: d.pie.series, borderWidth:0}]
      },
      options: {
        plugins: {
          legend: {position:'bottom', labels:{color:'#d4d4d8'}}
        }
      }
    });
  }
}

// ===== Lançamentos =====
async function carregarLancamentos() {
  try {
    const r = await fetch('php/lancamentos.php', {credentials:'include'});
    if (!r.ok) return;
    const dados = await r.json();

    const tbody = document.querySelector('#tbl-lanc tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    dados.forEach(l => {
      const tr = document.createElement('tr');
      const data = l.data ? new Date(l.data).toLocaleDateString('pt-BR') : '-';
      tr.innerHTML = `
        <td>${data}</td>
        <td>${l.veiculo || '-'}</td>
        <td>${l.categoria || '-'}</td>
        <td>${l.fornecedor || '-'}</td>
        <td>${fmtBRL(l.valor)}</td>
        <td><span class="status ${l.status.toLowerCase()}">${formatStatus(l.status)}</span></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error('Erro carregar lançamentos', e);
  }
}

function formatStatus(s) {
  switch (s) {
    case 'APROVADA': return 'Aprovada';
    case 'PENDENTE': return 'Pendente';
    case 'REPROVADA': return 'Reprovada';
    case 'RASCUNHO': return 'Rascunho';
    default: return s;
  }
}

// ===== Veículos =====
async function carregarVeiculos() {
  try {
    const r = await fetch('php/veiculos_resumo.php', {credentials:'include'});
    if (!r.ok) return;
    const dados = await r.json();

    const tbody = document.querySelector('#tbl-veic tbody');
    const ul    = document.getElementById('veic-highlights');
    if (!tbody || !ul) return;

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

    ul.innerHTML = '';
    if (dados.length) {
      const maisCaro   = [...dados].sort((a,b)=>b.gasto_periodo-a.gasto_periodo)[0];
      const maisRodado = [...dados].sort((a,b)=> (b.km_atual||0)-(a.km_atual||0))[0];

      ul.innerHTML = `
        <li><strong>Maior gasto:</strong> ${maisCaro.placa} (${fmtBRL(maisCaro.gasto_periodo)})</li>
        <li><strong>Mais rodado:</strong> ${maisRodado.placa} (${(maisRodado.km_atual ?? 0).toLocaleString('pt-BR')} km)</li>
        <li><strong>Veículos em operação:</strong> ${dados.length}</li>
      `;
    }
  } catch (e) {
    console.error('Erro carregar veículos', e);
  }
}

// ===== Admin =====
async function carregarAdmin() {
  try {
    const r = await fetch('php/admin_resumo.php', {credentials:'include'});
    if (!r.ok) return;
    const d = await r.json();

    const tbodyUsers = document.querySelector('#tbl-users tbody');
    const tbodyCC    = document.querySelector('#tbl-cc tbody');
    if (!tbodyUsers || !tbodyCC) return;

    tbodyUsers.innerHTML = '';
    (d.usuarios || []).forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.nome_completo}</td>
        <td>${u.email}</td>
        <td>${u.perfil}</td>
        <td>${u.status}</td>
      `;
      tbodyUsers.appendChild(tr);
    });

    tbodyCC.innerHTML = '';
    (d.centros_custo || []).forEach(cc => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${cc.codigo}</td>
        <td>${cc.nome}</td>
        <td>${cc.qtd_veiculos}</td>
      `;
      tbodyCC.appendChild(tr);
    });
  } catch (e) {
    console.error('Erro carregar admin', e);
  }
}

// ===== Exportar CSV (usa tabela de lançamentos atual) =====
function initExport() {
  const btn = document.getElementById('export');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const rows = [
      ['Data','Veículo','Categoria','Fornecedor','Valor','Status'],
      ...Array.from(document.querySelectorAll('#tbl-lanc tbody tr')).map(tr =>
        Array.from(tr.children).map(td => td.innerText)
      )
    ];
    const csv = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'lancamentos.csv';
    a.click();
    URL.revokeObjectURL(url);
  });
}

// ===== Inicialização global =====
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('sec-dashboard')) {
    initNav();
    initExport();
  }
});
