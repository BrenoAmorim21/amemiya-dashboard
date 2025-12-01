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

// POST JSON genérico
async function postJSON(url, data){
  const r = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    credentials: 'include',
    body: JSON.stringify(data)
  });
  if (!r.ok){
    const e = await r.json().catch(() => ({error:'Erro desconhecido'}));
    throw new Error(e.error || 'Erro ao salvar');
  }
  return r.json();
}

// Modais
function openModal(id){
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
}
function closeModal(id){
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
}

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
        maintainAspectRatio: false,
        layout: {
          padding: { bottom: 24 }
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
//   + BOTÕES APROVAR / REPROVAR
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

      // ID da nota vindo do PHP (tanto faz se for id ou id_nota)
      const idNota = l.id ?? l.id_nota;

      // ações: só mostra se estiver pendente
      let acoesHtml = '';
      if (l.status === 'PENDENTE' && idNota) {
        acoesHtml = `
          <button class="btn btn-xs btn-approve" data-id="${idNota}">
            Aprovar
          </button>
          <button class="btn btn-xs btn-reject" data-id="${idNota}">
            Reprovar
          </button>
        `;
      }

      tr.innerHTML = `
        <td>${data}</td>
        <td>${l.veiculo || '-'}</td>
        <td>${l.categoria || '-'}</td>
        <td>${l.fornecedor || '-'}</td>
        <td>${fmtBRL(l.valor)}</td>
        <td>${formatStatus(l.status)}</td>
        <td>${obs}</td>
        <td>${acoesHtml}</td>
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
    if (!r.ok) {
      console.error('Erro HTTP em relatórios', r.status);
      return;
    }

    const dados = await r.json();
    if (!Array.isArray(dados)) {
      console.error('Resposta inesperada em relatórios:', dados);
      return;
    }

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
//   ADMIN – listar VEÍCULOS
//   (mantive só UMA versão)
// ======================
async function carregarAdminVeiculos() {
  const tbody = document.querySelector('#tbl-admin-veic tbody');
  if (!tbody) return;

  try {
    const r = await fetch('php/admin_veiculo_listar.php', { credentials: 'include' });
    if (!r.ok) throw new Error('Falha ao carregar veículos admin');

    const dados = await r.json();
    tbody.innerHTML = '';

    if (!dados.length) {
      tbody.innerHTML = `
        <tr class="empty-row">
          <td colspan="6">Nenhum veículo cadastrado ainda.</td>
        </tr>`;
      return;
    }

    dados.forEach(v => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${v.placa}</td>
        <td>${v.modelo || '-'}</td>
        <td>${v.ano || '-'}</td>
        <td>${v.centro_custo || '-'}</td>
        <td>${(v.km_atual ?? 0).toLocaleString('pt-BR')} km</td>
        <td>
          <button class="btn btn-xs" disabled>Editar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error('Erro ao carregar veículos (admin):', e);
  }
}

// ======================
//   ADMIN – listar FORNECEDORES
// ======================
async function carregarAdminFornecedores() {
  const tbody = document.querySelector('#tbl-admin-forn tbody');
  if (!tbody) return;

  try {
    const r = await fetch('php/admin_fornecedores.php', { credentials: 'include' });
    if (!r.ok) return;
    const dados = await r.json();

    tbody.innerHTML = '';

    if (!dados.length) {
      const tr = document.createElement('tr');
      tr.classList.add('empty-row');
      tr.innerHTML = `<td colspan="5">Nenhum fornecedor cadastrado ainda.</td>`;
      tbody.appendChild(tr);
      return;
    }

    dados.forEach(f => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${f.nome}</td>
        <td>${f.cnpj || '-'}</td>
        <td>${f.tipo || '-'}</td>
        <td>${f.telefone || '-'}</td>
        <td>
          <button class="btn btn-xs" disabled>Editar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error('Erro ao carregar fornecedores (admin)', e);
  }
}

// ======================
//   ADMIN – listar TIPOS DE MANUTENÇÃO
// ======================
async function carregarAdminTipos() {
  const tbody = document.querySelector('#tbl-admin-tipos tbody');
  if (!tbody) return;

  try {
    const r = await fetch('php/admin_tipos_manut.php', { credentials: 'include' });
    if (!r.ok) return;
    const dados = await r.json();

    tbody.innerHTML = '';

    if (!dados.length) {
      const tr = document.createElement('tr');
      tr.classList.add('empty-row');
      tr.innerHTML = `<td colspan="3">Nenhum tipo de manutenção cadastrado ainda.</td>`;
      tbody.appendChild(tr);
      return;
    }

    dados.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.nome}</td>
        <td>${t.descricao || '-'}</td>
        <td>
          <button class="btn btn-xs" disabled>Editar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error('Erro ao carregar tipos (admin)', e);
  }
}

// ======================
//   ADMIN – função wrapper
// ======================
async function carregarAdmin() {
  await Promise.all([
    carregarAdminVeiculos(),
    carregarAdminFornecedores(),
    carregarAdminTipos()
  ]);
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
    if (sec === 'admin')       carregarAdmin();
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

    // === Admin: botões "Novo ..." ===
    const btnNovoVeiculo    = document.getElementById('btnNovoVeiculo');
    const btnNovoFornecedor = document.getElementById('btnNovoFornecedor');
    const btnNovoTipoManut  = document.getElementById('btnNovoTipoManut');

    if (btnNovoVeiculo) {
      btnNovoVeiculo.removeAttribute('disabled');
      btnNovoVeiculo.addEventListener('click', () => openModal('modalVeiculo'));
    }
    if (btnNovoFornecedor) {
      btnNovoFornecedor.removeAttribute('disabled');
      btnNovoFornecedor.addEventListener('click', () => openModal('modalFornecedor'));
    }
    if (btnNovoTipoManut) {
      btnNovoTipoManut.removeAttribute('disabled');
      btnNovoTipoManut.addEventListener('click', () => openModal('modalTipo'));
    }

        // ===== Ações Aprovar / Reprovar na aba Lançamentos =====
    const tblLanc = document.getElementById('tbl-lanc');
    if (tblLanc) {
      tblLanc.addEventListener('click', async (e) => {
        const target = e.target;

        if (!target.classList.contains('btn-approve') &&
            !target.classList.contains('btn-reject')) {
          return;
        }

        const id = target.getAttribute('data-id');
        if (!id) return;

        const novoStatus = target.classList.contains('btn-approve')
          ? 'APROVADA'
          : 'REPROVADA';

        const ok = confirm(`Confirmar marcar essa nota como ${novoStatus}?`);
        if (!ok) return;

        try {
          await postJSON('php/lancamento_atualizar_status.php', {
            id: Number(id),
            status: novoStatus
          });

          // Atualiza lista de lançamentos e KPIs
          await carregarLancamentosFull();
          await carregarDashboard();
        } catch (err) {
          alert('Erro ao atualizar status: ' + err.message);
        }
      });
    }


    // Fechar modais ao clicar em "Cancelar" ou no backdrop
    document.querySelectorAll('[data-close-modal]').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-close-modal');
        closeModal(id);
      });
    });

    // === SUBMIT: novo veículo ===
    const formVeic = document.getElementById('formVeiculo');
    if (formVeic){
      formVeic.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const fd = new FormData(formVeic);
        const payload = {
          placa: (fd.get('placa') || '').trim(),
          modelo: (fd.get('modelo') || '').trim(),
          ano: fd.get('ano') ? Number(fd.get('ano')) : null,
          km_atual: fd.get('km_atual') ? Number(fd.get('km_atual')) : null,
          id_centro_custo: fd.get('id_centro_custo') ? Number(fd.get('id_centro_custo')) : null,
        };
        try{
          await postJSON('php/admin_veiculo_criar.php', payload);
          formVeic.reset();
          closeModal('modalVeiculo');
          carregarAdminVeiculos();
          carregarVeiculos();
        }catch(err){
          alert('Erro ao salvar veículo: ' + err.message);
        }
      });
    }

    // === SUBMIT: novo fornecedor ===
    const formForn = document.getElementById('formFornecedor');
    if (formForn){
      formForn.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const fd = new FormData(formForn);
        const payload = {
          nome: (fd.get('nome') || '').trim(),
          cnpj: (fd.get('cnpj') || '').trim(),
          tipo: (fd.get('tipo') || '').trim(),
          telefone: (fd.get('telefone') || '').trim(),
        };
        try{
          await postJSON('php/admin_fornecedor_criar.php', payload);
          formForn.reset();
          closeModal('modalFornecedor');
          carregarAdminFornecedores();
        }catch(err){
          alert('Erro ao salvar fornecedor: ' + err.message);
        }
      });
    }

    // === SUBMIT: novo tipo de manutenção ===
    const formTipo = document.getElementById('formTipo');
    if (formTipo){
      formTipo.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const fd = new FormData(formTipo);
        const payload = {
          nome: (fd.get('nome') || '').trim(),
          descricao: (fd.get('descricao') || '').trim(),
        };
        try{
          await postJSON('php/admin_tipo_criar.php', payload);
          formTipo.reset();
          closeModal('modalTipo');
          carregarAdminTipos();
        }catch(err){
          alert('Erro ao salvar tipo: ' + err.message);
        }
      });
    }

    // ===== Atualização automática do dashboard a cada 15s =====
    setInterval(() => {
      const dashAtivo = document
        .getElementById('sec-dashboard')
        ?.classList.contains('active');

      if (dashAtivo) {
        carregarDashboard();
        carregarLancamentos();
      }
    }, 15000);
  }
});
