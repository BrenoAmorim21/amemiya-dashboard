<?php
require 'db.php';
header('Content-Type: application/json');

try {
    $input = json_decode(file_get_contents('php://input'), true);

    $email = strtolower(trim($input['email'] ?? ''));
    $senha = $input['senha'] ?? '';

    if (!$email || !$senha) {
        http_response_code(400);
        echo json_encode(['erro' => 'Preencha e-mail e senha.']);
        exit;
    }

    $stmt = $pdo->prepare("
        SELECT id_usuario, nome_completo, senha_hash
        FROM usuarios
        WHERE email = :email AND ativo = 1
        LIMIT 1
    ");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($senha, $user['senha_hash'])) {
        http_response_code(401);
        echo json_encode(['erro' => 'Credenciais inválidas.']);
        exit;
    }

    $_SESSION['id_usuario'] = $user['id_usuario'];
    $_SESSION['nome']       = $user['nome_completo'];
    $_SESSION['email']      = $email;

    echo json_encode(['sucesso' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro interno: '.$e->getMessage()]);
}
