<?php
header('Content-Type: application/json');
require 'db.php';

if (!isset($_SESSION['id_usuario']) && !isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Não autenticado']);
    exit;
}

try {
    $sql = "
        SELECT
          id_tipo_manutencao,
          nome,
          descricao
        FROM tipos_manutencao
        ORDER BY nome ASC
    ";

    $st = $pdo->query($sql);
    $dados = $st->fetchAll(PDO::FETCH_ASSOC);

    $out = [];
    foreach ($dados as $t) {
        $out[] = [
            'id'        => (int)$t['id_tipo_manutencao'],
            'nome'      => $t['nome'] ?? '',
            'descricao' => $t['descricao'] ?? '',
        ];
    }

    echo json_encode($out);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao listar tipos', 'detail' => $e->getMessage()]);
}
