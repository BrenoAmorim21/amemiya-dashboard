<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/db.php';

try {
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('JSON inválido recebido.');
    }

    $placa       = isset($data['placa']) ? trim($data['placa']) : '';
    $modelo      = isset($data['modelo']) ? trim($data['modelo']) : null;
    $ano         = $data['ano'] ?? null;
    $km_atual    = $data['km_atual'] ?? null;

    if ($placa === '') {
        throw new Exception('A placa é obrigatória.');
    }

    // ajuste os nomes das colunas se seu schema for diferente
    $sql = "INSERT INTO veiculos (placa, modelo, ano, km_atual)
            VALUES (:placa, :modelo, :ano, :km_atual)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':placa'    => $placa,
        ':modelo'   => $modelo,
        ':ano'      => $ano,
        ':km_atual' => $km_atual,
    ]);

    echo json_encode([
        'ok'  => true,
        'id'  => $pdo->lastInsertId(),
        'msg' => 'Veículo criado com sucesso.'
    ]);
    exit;

} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode([
        'ok'    => false,
        'error' => $e->getMessage()
    ]);
    exit;
}
