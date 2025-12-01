<?php
// php/lancamento_atualizar_status.php
require 'db.php'; // aqui é o mesmo arquivo que você já usa pra conectar (PDO)

header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'JSON inválido']);
    exit;
}

$idNota = intval($input['id'] ?? 0);
$status = strtoupper(trim($input['status'] ?? ''));

$permitidos = ['APROVADA', 'PENDENTE', 'REPROVADA', 'RASCUNHO'];

if ($idNota <= 0 || !in_array($status, $permitidos)) {
    http_response_code(422);
    echo json_encode(['error' => 'Parâmetros inválidos']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        UPDATE notas_fiscais
           SET status = ?, atualizado_em = NOW()
         WHERE id_nota = ?
    ");
    $stmt->execute([$status, $idNota]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao atualizar status']);
}
