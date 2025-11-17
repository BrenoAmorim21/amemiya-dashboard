function renderKpis(k){
document.getElementById('kpi-total').textContent = fmtBRL(k.total);
document.getElementById('kpi-approve').textContent = k.approve+"%";
document.getElementById('kpi-cpkm').textContent = fmtBRL(k.cpkm)+"/km";
document.getElementById('kpi-avg').textContent = k.avgHours+" h";
}


function renderTable(rows){
const tbody = document.querySelector('#tbl tbody');
tbody.innerHTML='';
rows.forEach(r=>{
const tr=document.createElement('tr');
tr.innerHTML = `<td>${new Date(r.date).toLocaleDateString('pt-BR')}</td><td>${r.vehicle}</td><td>${r.cat}</td><td>${r.supplier}</td><td>${fmtBRL(r.value)}</td><td><span class="status ${r.status}">${r.status}</span></td>`;
tbody.appendChild(tr);
});
}


async function load(){
// Trocar por: const d = await fetch('php/metrics.php',{credentials:'include'}).then(r=>r.json());
const d = { kpis:{ total:128543.76, approve:86, cpkm:1.94, avgHours:26 }, line:{ labels:['Mai','Jun','Jul','Ago','Set','Out'], series:[12000,15800,21000,18000,24500,34900] }, pie:{ labels:['Combustível','Óleo','Pneus','Peças','Serviços'], series:[42,18,14,9,17] }, rows:[ {date:'2025-10-01', vehicle:'ABC-1A23', cat:'Combustível', supplier:'Posto Orion', value:312.90, status:'approved'} ] };
renderKpis(d.kpis); renderCharts(d); renderTable(d.rows);
}


document.getElementById('apply')?.addEventListener('click', load);
document.getElementById('export')?.addEventListener('click', ()=>{
const rows = [['Data','Veículo','Categoria','Fornecedor','Valor','Status'], ...document.querySelectorAll('#tbl tbody tr')].map((tr,i)=>{
if(i===0) return tr; return [...tr.children].map(td=>td.innerText);
});
const csv = rows.map(r=>Array.isArray(r)?r.join(';'):r).join('\n');
const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='lancamentos.csv'; a.click(); URL.revokeObjectURL(url);
});


if(document.getElementById('lineChart')) load();