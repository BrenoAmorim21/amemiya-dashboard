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
      nf.id_nota,
      nf.data_emissao,
      nf.valor_total,
      nf.status,
      nf.km_veiculo,
      v.placa,
      tm.nome AS categoria,
      f.nome  AS fornecedor
    FROM notas_fiscais nf
    LEFT JOIN veiculos v ON v.id_veiculo = nf.id_veiculo
    LEFT JOIN tipos_manutencao tm ON tm.id_tipo_manutencao = nf.id_tipo_manutencao
    LEFT JOIN fornecedores f ON f.id_fornecedor = nf.id_fornecedor
    ORDER BY nf.data_emissao DESC, nf.id_nota DESC
    LIMIT 200
");

$dados = [];
while ($row = $stmt->fetch()) {
    $dados[] = [
        'id'        => (int)$row['id_nota'],
        'data'      => $row['data_emissao'],
        'veiculo'   => $row['placa'],
        'categoria' => $row['categoria'],
        'fornecedor'=> $row['fornecedor'],
        'valor'     => (float)$row['valor_total'],
        'status'    => $row['status']
    ];
}

echo json_encode($dados);
