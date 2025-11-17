async function post(url,data){
const r = await fetch(url,{ method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body:JSON.stringify(data)});
if(!r.ok){ const e = await r.json().catch(()=>({error:'Erro desconhecido'})); throw new Error(e.error||'Erro'); }
return r.json();
}

// STEP 1 → salva no sessionStorage e vai para a etapa 2
const step1Form = document.getElementById('step1Form');
if(step1Form){
step1Form.addEventListener('submit',(e)=>{
e.preventDefault();
const fd = new FormData(step1Form);
const data = Object.fromEntries(fd.entries());
data.cpf = (data.cpf||'').replace(/\D/g,'');
sessionStorage.setItem('reg_step1', JSON.stringify(data));
location.href = 'register-step2.html';
});
}

// STEP 2 → envia tudo para o backend e já entra logado
const step2Form = document.getElementById('step2Form');
if(step2Form){
step2Form.addEventListener('submit', async (e)=>{
e.preventDefault();
const s1 = JSON.parse(sessionStorage.getItem('reg_step1')||'{}');
if(!s1.name){ document.getElementById('step2Error').textContent='Volte e preencha a etapa 1.'; return; }
const fd = new FormData(step2Form);
const email = fd.get('email');
const password = fd.get('password');
const confirm = fd.get('confirm');
if(password !== confirm){ document.getElementById('step2Error').textContent='As senhas não coincidem.'; return; }
try{
await post('php/register.php', { ...s1, email, password });
location.href = 'dashboard.html';
}catch(err){ document.getElementById('step2Error').textContent = err.message; }
});
}


// LOGIN
const loginForm = document.getElementById('loginForm');
if(loginForm){
loginForm.addEventListener('submit', async (e)=>{
e.preventDefault();
const fd = new FormData(loginForm);
try{
await post('php/login.php',{ email:fd.get('email'), password:fd.get('password') });
location.href = 'dashboard.html';
}catch(err){ document.getElementById('loginError').textContent = err.message; }
});
}