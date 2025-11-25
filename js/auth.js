async function postJson(url, data) {
  const r = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify(data)
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(body.erro || 'Erro ao comunicar com o servidor.');
  }
  return body;
}

// ===== ETAPA 1 – dados pessoais =====
const step1Form = document.getElementById('step1Form');
if (step1Form) {
  step1Form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(step1Form);
    const dados = {
      nome_completo: fd.get('nome_completo'),
      empresa: fd.get('empresa'),
      endereco: fd.get('endereco'),
      cpf: (fd.get('cpf') || '').replace(/\D/g, ''),
      data_nascimento: fd.get('data_nascimento')
    };
    sessionStorage.setItem('cadastro_step1', JSON.stringify(dados));
    window.location.href = 'register-step2.html';
  });
}

// ===== ETAPA 2 – credenciais =====
const step2Form = document.getElementById('step2Form');
if (step2Form) {
  step2Form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const base = JSON.parse(sessionStorage.getItem('cadastro_step1') || '{}');
    if (!base.nome_completo) {
      document.getElementById('step2Error').textContent = 'Etapa 1 não preenchida. Volte e preencha seus dados.';
      return;
    }
    const fd = new FormData(step2Form);
    const email = fd.get('email');
    const senha = fd.get('senha');
    const confirma = fd.get('confirmar_senha');

    if (senha !== confirma) {
      document.getElementById('step2Error').textContent = 'As senhas não coincidem.';
      return;
    }

    try {
      await postJson('php/register.php', {
        ...base,
        email,
        senha
      });
      window.location.href = 'dashboard.html';
    } catch (err) {
      document.getElementById('step2Error').textContent = err.message;
    }
  });
}

// ===== LOGIN =====
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(loginForm);
    try {
      await postJson('php/login.php', {
        email: fd.get('email'),
        senha: fd.get('senha')
      });
      window.location.href = 'dashboard.html';
    } catch (err) {
      document.getElementById('loginError').textContent = err.message;
    }
  });
}
