<?php
require 'db.php'; // sua conexão PDO

header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'JSON inválido']);
    exit;
}

$placa      = trim($input['placa']      ?? '');
$categoria  = trim($input['categoria']  ?? '');
$fornecedor = trim($input['fornecedor'] ?? '');
$valor      = floatval($input['valor']  ?? 0);
$status     = $input['status'] ?? 'PENDENTE';
$data       = $input['data']   ?? date('Y-m-d');

if ($placa === '' || $categoria === '' || $valor <= 0) {
    http_response_code(422);
    echo json_encode(['error' => 'Campos obrigatórios ausentes']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO lancamentos (data, placa, categoria, fornecedor, valor, status)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$data, $placa, $categoria, $fornecedor, $valor, $status]);

    echo json_encode([
        'success' => true,
        'id'      => $pdo->lastInsertId()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao inserir: '.$e->getMessage()]);
}
