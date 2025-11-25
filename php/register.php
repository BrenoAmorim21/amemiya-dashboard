<?php
require 'db.php';
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$nome          = trim($input['nome_completo'] ?? '');
$empresa       = trim($input['empresa'] ?? '');
$endereco      = trim($input['endereco'] ?? '');
$cpf           = preg_replace('/\D/', '', $input['cpf'] ?? '');
$data_nasc     = $input['data_nascimento'] ?? null;
$email         = strtolower(trim($input['email'] ?? ''));
$senha         = $input['senha'] ?? '';

if (!$nome || !$email || !$senha) {
    http_response_code(400);
    echo json_encode(['erro' => 'Nome, e-mail e senha são obrigatórios.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['erro' => 'E-mail inválido.']);
    exit;
}

if (strlen($senha) < 6) {
    http_response_code(400);
    echo json_encode(['erro' => 'Senha deve ter pelo menos 6 caracteres.']);
    exit;
}

$stmt = $pdo->prepare("SELECT id_usuario FROM usuarios WHERE email = :email");
$stmt->execute(['email' => $email]);

if ($stmt->fetch()) {
    http_response_code(400);
    echo json_encode(['erro' => 'E-mail já cadastrado.']);
    exit;
}

$hash = password_hash($senha, PASSWORD_DEFAULT);

$stmt = $pdo->prepare("
    INSERT INTO usuarios
    (nome_completo, email, senha_hash, cpf, empresa, endereco, data_nascimento, perfil, ativo)
    VALUES
    (:nome, :email, :hash, :cpf, :empresa, :endereco, :data_nasc, 'GESTOR', 1)
");

$stmt->execute([
    'nome'      => $nome,
    'email'     => $email,
    'hash'      => $hash,
    'cpf'       => $cpf ?: null,
    'empresa'   => $empresa ?: null,
    'endereco'  => $endereco ?: null,
    'data_nasc' => $data_nasc ?: null
]);

$_SESSION['id_usuario'] = $pdo->lastInsertId();
$_SESSION['nome']       = $nome;
$_SESSION['email']      = $email;

echo json_encode(['sucesso' => true]);
