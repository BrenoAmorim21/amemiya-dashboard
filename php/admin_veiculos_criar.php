<?php
header('Content-Type: application/json');
require 'db.php';

if (!isset($_SESSION['id_usuario']) && !isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Não autenticado']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$placa = strtoupper(trim($input['placa'] ?? ''));
$modelo = trim($input['modelo'] ?? '');
$ano = $input['ano'] ?? null;
$km_atual = $input['km_atual'] ?? null;
$id_cc = $input['id_centro_custo'] ?? null;

if ($placa === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Placa é obrigatória']);
    exit;
}

try {
    $sql = "
        INSERT INTO veiculos (placa, modelo, ano, km_atual, id_centro_custo)
        VALUES (:placa, :modelo, :ano, :km_atual, :id_cc)
    ";
    $st = $pdo->prepare($sql);
    $st->execute([
        ':placa'   => $placa,
        ':modelo'  => $modelo !== '' ? $modelo : null,
        ':ano'     => $ano !== null && $ano !== '' ? (int)$ano : null,
        ':km_atual'=> $km_atual !== null && $km_atual !== '' ? (float)$km_atual : null,
        ':id_cc'   => $id_cc !== null && $id_cc !== '' ? (int)$id_cc : null,
    ]);

    echo json_encode(['ok' => true, 'id' => $pdo->lastInsertId()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao salvar veículo', 'detail' => $e->getMessage()]);
}
