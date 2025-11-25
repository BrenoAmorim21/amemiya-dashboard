<?php
require 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['id_usuario'])) {
    http_response_code(401);
    echo json_encode(['erro' => 'Não autenticado']);
    exit;
}

$stmt = $pdo->query("
    SELECT 
      v.id_veiculo,
      v.placa,
      v.modelo,
      v.km_atual,
      cc.nome AS centro_custo,
      COALESCE(SUM(nf.valor_total),0) AS gasto_periodo
    FROM veiculos v
    LEFT JOIN centros_custo cc ON cc.id_centro_custo = v.id_centro_custo
    LEFT JOIN notas_fiscais nf ON nf.id_veiculo = v.id_veiculo
    GROUP BY v.id_veiculo, v.placa, v.modelo, v.km_atual, cc.nome
    ORDER BY gasto_periodo DESC
");

$lista = [];
while ($row = $stmt->fetch()) {
    $lista[] = [
        'placa'        => $row['placa'],
        'modelo'       => $row['modelo'],
        'centro_custo' => $row['centro_custo'],
        'km_atual'     => (int)$row['km_atual'],
        'gasto_periodo'=> (float)$row['gasto_periodo']
    ];
}

echo json_encode($lista);
