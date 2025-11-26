<?php
require 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['id_usuario'])) {
    http_response_code(401);
    echo json_encode(['erro' => 'Não autenticado']);
    exit;
}

$sql = "
    SELECT
      v.id_veiculo,
      v.placa,
      v.modelo,
      v.ano,
      v.km_atual,
      cc.nome AS centro_custo,
      COALESCE(SUM(nf.valor_total),0) AS gasto_periodo
    FROM veiculos v
    LEFT JOIN centros_custo cc
      ON cc.id_centro_custo = v.id_centro_custo
    LEFT JOIN notas_fiscais nf
      ON nf.id_veiculo = v.id_veiculo
    GROUP BY
      v.id_veiculo, v.placa, v.modelo, v.ano, v.km_atual, cc.nome
    ORDER BY gasto_periodo DESC
";

$rows = $pdo->query($sql)->fetchAll();

$saida = [];
foreach ($rows as $r) {
    $saida[] = [
        'placa'        => $r['placa'],
        'modelo'       => $r['modelo'],
        'ano'          => $r['ano'],
        'km_atual'     => (int)$r['km_atual'],
        'centro_custo' => $r['centro_custo'],
        'gasto_periodo'=> (float)$r['gasto_periodo'],
    ];
}

echo json_encode($saida);
