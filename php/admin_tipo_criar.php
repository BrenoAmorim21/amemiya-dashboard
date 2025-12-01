<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

// usa o seu arquivo correto:
require __DIR__ . '/db.php'; 

try {
    // Lê o JSON recebido
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('JSON inválido recebido.');
    }

    $nome      = isset($data['nome']) ? trim($data['nome']) : '';
    $descricao = isset($data['descricao']) ? trim($data['descricao']) : '';

    if ($nome === '') {
        throw new Exception('O nome do tipo é obrigatório.');
    }

    // confirma que SEU BANCO tem essas colunas
    $sql = "INSERT INTO tipos_manutencao (nome, descricao)
            VALUES (:nome, :descricao)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':nome'      => $nome,
        ':descricao' => $descricao
    ]);

    echo json_encode([
        'ok'  => true,
        'id'  => $pdo->lastInsertId(),
        'msg' => 'Tipo de manutenção criado com sucesso.'
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
