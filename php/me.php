<?php
require 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['id_usuario'])) {
    http_response_code(401);
    echo json_encode(['erro' => 'Não autenticado']);
    exit;
}

echo json_encode([
    'id'    => $_SESSION['id_usuario'],
    'name'  => $_SESSION['nome'] ?? '',
    'email' => $_SESSION['email'] ?? ''
]);
