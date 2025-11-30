<?php
header('Content-Type: application/json');
require 'db.php';

if (!isset($_SESSION)) {
    session_start();
}

// Por enquanto não filtramos por usuário; usamos todos os veículos cadastrados.
// Se depois quisermos filtrar por organização/usuário, a gente adapta aqui.

$sql = "
    SELECT
      v.id_veiculo,
      v.placa,
      v.modelo,
      COALESCE(MAX(nf.km_veiculo), 0)            AS km_atual,
      COALESCE(SUM(nf.valor_total), 0)           AS gasto_periodo,
      MAX(nf.data_emissao)                       AS ultima_manutencao
    FROM veiculos v
    LEFT JOIN notas_fiscais nf
      ON nf.id_veiculo = v.id_veiculo
    GROUP BY v.id_veiculo, v.placa, v.modelo
    ORDER BY v.placa
";

$stmt = $pdo->prepare($sql);
$stmt->execute();
$dados = $stmt->fetchAll(PDO::FETCH_ASSOC);

$saida = [];
foreach ($dados as $row) {
    $saida[] = [
        'id_veiculo'        => (int)$row['id_veiculo'],
        'placa'             => $row['placa'],
        'modelo'            => $row['modelo'],
        'km_atual'          => (float)$row['km_atual'],
        'gasto_periodo'     => (float)$row['gasto_periodo'],
        'ultima_manutencao' => $row['ultima_manutencao'],
    ];
}

echo json_encode($saida);
