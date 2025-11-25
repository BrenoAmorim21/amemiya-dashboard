<?php
require 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['id_usuario'])) {
    http_response_code(401);
    echo json_encode(['erro' => 'Não autenticado']);
    exit;
}

$usuarios = $pdo->query("
    SELECT nome_completo, email, perfil, 
           CASE WHEN ativo = 1 THEN 'Ativo' ELSE 'Inativo' END AS status
    FROM usuarios
    ORDER BY nome_completo
")->fetchAll();

$centros = $pdo->query("
    SELECT 
      cc.codigo,
      cc.nome,
      COUNT(v.id_veiculo) AS qtd_veiculos
    FROM centros_custo cc
    LEFT JOIN veiculos v ON v.id_centro_custo = cc.id_centro_custo
    GROUP BY cc.id_centro_custo, cc.codigo, cc.nome
    ORDER BY cc.codigo
")->fetchAll();

echo json_encode([
    'usuarios'      => $usuarios,
    'centros_custo' => $centros
]);
