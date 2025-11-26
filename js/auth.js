async function postJson(url, data) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });
  let body = {};
  try { body = await r.json(); } catch (_) {}
  if (!r.ok) {
    throw new Error(body.erro || `HTTP ${r.status}`);
  }
  return body;
}

/* ===== LOGIN ===== */
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(loginForm);
    const email = fd.get('email');
    const senha = fd.get('senha');

    try {
      console.log('Enviando login para', 'php/login.php');
      await postJson('php/login.php', { email, senha });
      window.location.href = 'dashboard.html';
    } catch (err) {
      console.error('Erro no login:', err);
      document.getElementById('loginError').textContent = err.message || 'Falha no login.';
    }
  });
}
