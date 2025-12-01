<?php
header('Content-Type: application/json');
require 'db.php';

if (!isset($_SESSION['id_usuario']) && !isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Não autenticado']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$nome = trim($input['nome'] ?? '');
$cnpj = trim($input['cnpj'] ?? '');
$tipo = trim($input['tipo'] ?? '');
$telefone = trim($input['telefone'] ?? '');

if ($nome === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Nome é obrigatório']);
    exit;
}

try {
    $sql = "
        INSERT INTO fornecedores (nome, cnpj, tipo, telefone)
        VALUES (:nome, :cnpj, :tipo, :telefone)
    ";
    $st = $pdo->prepare($sql);
    $st->execute([
        ':nome'     => $nome,
        ':cnpj'     => $cnpj !== '' ? $cnpj : null,
        ':tipo'     => $tipo !== '' ? $tipo : null,
        ':telefone' => $telefone !== '' ? $telefone : null,
    ]);

    echo json_encode(['ok' => true, 'id' => $pdo->lastInsertId()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao salvar fornecedor', 'detail' => $e->getMessage()]);
}
