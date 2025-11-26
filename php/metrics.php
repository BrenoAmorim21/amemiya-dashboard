<?php
require 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['id_usuario'])) {
    http_response_code(401);
    echo json_encode(['erro' => 'Não autenticado']);
    exit;
}

/* ===== KPI: Gasto total ===== */
$stmt = $pdo->query("
    SELECT COALESCE(SUM(valor_total), 0) AS total
    FROM notas_fiscais
");
$row = $stmt->fetch(PDO::FETCH_ASSOC);
$gastoTotal = (float)$row['total'];

/* ===== KPI: Custo por km ===== */
$stmt = $pdo->query("
    SELECT 
        COALESCE(SUM(valor_total), 0) AS total_gasto,
        COALESCE(SUM(km_veiculo), 0) AS km_total
    FROM notas_fiscais
");
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if ((float)$row['km_total'] > 0) {
    $custoKm = (float)$row['total_gasto'] / (float)$row['km_total'];
} else {
    $custoKm = 0.0;
}

/* ===== KPI: Taxa de aprovação ===== */
$stmt = $pdo->query("
    SELECT 
        SUM(status = 'APROVADA') AS aprovadas,
        COUNT(*) AS total
    FROM notas_fiscais
");
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if ((int)$row['total'] > 0) {
    $taxaAprov = ((int)$row['aprovadas'] / (int)$row['total']) * 100.0;
} else {
    $taxaAprov = 0.0;
}

/* ===== Tendência mensal (gráfico de linha) ===== */
$stmt = $pdo->query("
    SELECT 
        DATE_FORMAT(data_emissao, '%Y-%m') AS mes,
        SUM(valor_total) AS total
    FROM notas_fiscais
    WHERE data_emissao IS NOT NULL
    GROUP BY mes
    ORDER BY mes
");

$lineLabels = [];
$lineSeries = [];
foreach ($stmt as $r) {
    $lineLabels[] = $r['mes'];
    $lineSeries[] = (float)$r['total'];
}

/* ===== Gastos por categoria (pizza) ===== */
$stmt = $pdo->query("
    SELECT 
        tm.nome AS categoria,
        COALESCE(SUM(nf.valor_total), 0) AS total
    FROM tipos_manutencao tm
    LEFT JOIN notas_fiscais nf
        ON nf.id_tipo_manutencao = tm.id_tipo_manutencao
    GROUP BY tm.id_tipo_manutencao, tm.nome
    ORDER BY total DESC
");

$pieLabels = [];
$pieSeries = [];
foreach ($stmt as $r) {
    $pieLabels[] = $r['categoria'] ? $r['categoria'] : 'Sem categoria';
    $pieSeries[] = (float)$r['total'];
}

/* ===== Resposta final ===== */
echo json_encode([
    'kpis' => [
        'gasto_total'    => $gastoTotal,
        'custo_km'       => round($custoKm, 4),
        'taxa_aprovacao' => round($taxaAprov, 2),
        // tempo médio p/ aprovar deixamos pra calcular depois
    ],
    'line' => [
        'labels' => $lineLabels,
        'series' => $lineSeries,
    ],
    'pie' => [
        'labels' => $pieLabels,
        'series' => $pieSeries,
    ],
]);
