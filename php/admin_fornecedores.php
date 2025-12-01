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
          id_fornecedor,
          nome,
          cnpj,
          tipo,
          telefone
        FROM fornecedores
        ORDER BY nome ASC
    ";

    $st = $pdo->query($sql);
    $dados = $st->fetchAll(PDO::FETCH_ASSOC);

    $out = [];
    foreach ($dados as $f) {
        $out[] = [
            'id'       => (int)$f['id_fornecedor'],
            'nome'     => $f['nome'] ?? '',
            'cnpj'     => $f['cnpj'] ?? '',
            'tipo'     => $f['tipo'] ?? '',
            'telefone' => $f['telefone'] ?? '',
        ];
    }

    echo json_encode($out);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao listar fornecedores', 'detail' => $e->getMessage()]);
}
