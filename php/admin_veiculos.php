<?php
header('Content-Type: application/json');

require 'db.php'; // ou db.php, o que você estiver usando

if (!isset($_SESSION['id_usuario']) && !isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Não autenticado']);
    exit;
}

try {
    // ajustado para o que você comentou que tem no banco
    $sql = "
        SELECT
          id_veiculo,
          placa,
          modelo,
          ano,
          km_atual,
          id_centro_custo
        FROM veiculos
        ORDER BY placa ASC
    ";

    $st = $pdo->query($sql);
    $dados = $st->fetchAll(PDO::FETCH_ASSOC);

    $out = [];
    foreach ($dados as $v) {
        // se quiser, pode transformar o id_centro_custo em string:
        // ex: CC 1, CC 2, etc
        $cc = isset($v['id_centro_custo']) && $v['id_centro_custo'] !== null
            ? 'CC ' . $v['id_centro_custo']
            : '';

        $out[] = [
            'id'           => (int)$v['id_veiculo'],
            'placa'        => $v['placa'],
            'modelo'       => $v['modelo'] ?? '',
            'ano'          => $v['ano'] ?? null,
            'centro_custo' => $cc,  // aqui mando já como texto
            'km_atual'     => isset($v['km_atual']) ? (float)$v['km_atual'] : null,
        ];
    }

    echo json_encode($out);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao listar veículos', 'detail' => $e->getMessage()]);
}
