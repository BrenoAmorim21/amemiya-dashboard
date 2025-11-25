<?php
require 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['id_usuario'])) {
    http_response_code(401);
    echo json_encode(['erro' => 'Não autenticado']);
    exit;
}

/* ===== KPIs ===== */

// Gasto total
$row = $pdo->query("SELECT SUM(valor_total) AS total FROM notas_fiscais")->fetch();
$gasto_total = (float)($row['total'] ?? 0);

// km total (onde tiver km_veiculo) – simplificado
$row = $pdo->query("SELECT SUM(km_veiculo) AS km FROM notas_fiscais WHERE km_veiculo IS NOT NULL")->fetch();
$km_total = (float)($row['km'] ?? 0);
$custo_km = $km_total > 0 ? $gasto_total / $km_total : 0;

// taxa de aprovação
$stats = $pdo->query("
    SELECT 
      SUM(status = 'APROVADA') AS aprovadas,
      COUNT(*) AS total
    FROM notas_fiscais
")->fetch();

$taxa_aprov = ($stats['total'] ?? 0) > 0
  ? ($stats['aprovadas'] / $stats['total']) * 100
  : 0;

// tempo médio de aprovação (em horas) – usando aprovacoes_nota
$row = $pdo->query("
    SELECT AVG(TIMESTAMPDIFF(HOUR, nf.criado_em, an.data_aprovacao)) AS media_horas
    FROM notas_fiscais nf
    JOIN aprovacoes_nota an ON an.id_nota = nf.id_nota
    WHERE an.decisao = 'APROVADA'
")->fetch();
$media_horas = (float)($row['media_horas'] ?? 0);

/* ===== Tendência de gastos por mês (linha) ===== */

$meses = $pdo->query("
    SELECT DATE_FORMAT(data_emissao, '%Y-%m') AS mes,
           SUM(valor_total) AS total
    FROM notas_fiscais
    WHERE data_emissao IS NOT NULL
    GROUP BY mes
    ORDER BY mes
")->fetchAll();

$line_labels = [];
$line_series = [];
foreach ($meses as $m) {
    $line_labels[] = $m['mes'];
    $line_series[] = (float)$m['total'];
}

/* ===== Pizza por categoria (tipo de manutenção) ===== */

$cats = $pdo->query("
    SELECT tm.nome AS categoria, SUM(nf.valor_total) AS total
    FROM notas_fiscais nf
    LEFT JOIN tipos_manutencao tm ON tm.id_tipo_manutencao = nf.id_tipo_manutencao
    GROUP BY tm.nome
    ORDER BY total DESC
")->fetchAll();

$pie_labels = [];
$pie_series = [];
foreach ($cats as $c) {
    $pie_labels[] = $c['categoria'] ?: 'Sem categoria';
    $pie_series[] = (float)$c['total'];
}

echo json_encode([
    'kpis' => [
        'gasto_total'      => $gasto_total,
        'custo_km'         => $custo_km,
        'taxa_aprovacao'   => round($taxa_aprov, 2),
        'tempo_medio_horas'=> round($media_horas, 1)
    ],
    'line' => [
        'labels' => $line_labels,
        'series' => $line_series
    ],
    'pie' => [
        'labels' => $pie_labels,
        'series' => $pie_series
    ]
]);
