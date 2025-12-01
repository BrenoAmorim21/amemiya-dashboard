<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/db.php';

try {
    // ajuste os campos para bater com a sua tabela
    $sql = "SELECT
              id_veiculo,
              placa,
              modelo,
              ano,
              km_atual,
              NULL AS centro_custo
            FROM veiculos
            ORDER BY placa";

    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $out = [];
    foreach ($rows as $r) {
        $out[] = [
            'id'           => (int)$r['id_veiculo'],
            'placa'        => $r['placa'],
            'modelo'       => $r['modelo'],
            'ano'          => $r['ano'],
            'km_atual'     => $r['km_atual'],
            'centro_custo' => $r['centro_custo'], // por enquanto sempre null/-
        ];
    }

    echo json_encode($out);
    exit;

} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode([
        'ok'    => false,
        'error' => $e->getMessage()
    ]);
    exit;
}
