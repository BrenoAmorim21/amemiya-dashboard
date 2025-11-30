<?php
header('Content-Type: application/json');
require 'db.php';

if (!isset($_SESSION)) {
    session_start();
}

// se quiser no futuro filtrar por usuário logado, a gente vê certinho aqui
// por enquanto, NÃO vamos filtrar por usuário pra não quebrar nada

// ---- filtros vindos da URL (GET) ----
$q      = $_GET['q']      ?? '';
$from   = $_GET['from']   ?? '';
$to     = $_GET['to']     ?? '';
$status = $_GET['status'] ?? '';
$all    = isset($_GET['all']);   // se true, não limita a poucos registros

// ---- SQL base: o SEU SELECT original ----
$sql = "
    SELECT
      nf.id_nota,
      nf.data_emissao,
      nf.valor_total,
      nf.status,
      nf.km_veiculo,
      nf.observacoes,
      v.placa,
      tm.nome AS tipo_manutencao,
      f.nome  AS fornecedor
    FROM notas_fiscais nf
    LEFT JOIN veiculos v
      ON v.id_veiculo = nf.id_veiculo
    LEFT JOIN tipos_manutencao tm
      ON tm.id_tipo_manutencao = nf.id_tipo_manutencao
    LEFT JOIN fornecedores f
      ON f.id_fornecedor = nf.id_fornecedor
";

// vamos montar o WHERE dinamicamente
$where = [];
$params = [];

// filtro por status (APROVADA / PENDENTE / REPROVADA)
if ($status !== '') {
    $where[] = "nf.status = :status";
    $params['status'] = $status;
}

// filtro por data inicial
if ($from !== '') {
    $where[] = "nf.data_emissao >= :from";
    $params['from'] = $from;
}

// filtro por data final
if ($to !== '') {
    $where[] = "nf.data_emissao <= :to";
    $params['to'] = $to;
}

if ($q !== '') {
    $where[] = "(v.placa LIKE :q1 OR tm.nome LIKE :q2 OR f.nome LIKE :q3)";
    $like = '%' . $q . '%';
    $params['q1'] = $like;
    $params['q2'] = $like;
    $params['q3'] = $like;
}

// se tiver pelo menos uma condição, adiciona WHERE
if (!empty($where)) {
    $sql .= " WHERE " . implode(' AND ', $where);
}

// ordenação
$sql .= " ORDER BY nf.data_emissao DESC, nf.id_nota DESC";

// limite para não explodir
if ($all) {
    // usado na aba de Lançamentos (tabela completa)
    $sql .= " LIMIT 300";
} else {
    // usado no dashboard (Lançamentos Recentes)
    $sql .= " LIMIT 10";
}

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$dados = $stmt->fetchAll(PDO::FETCH_ASSOC);

// mesma saída que você já tinha
$saida = [];
foreach ($dados as $row) {
    $saida[] = [
        'id'         => (int)$row['id_nota'],
        'data'       => $row['data_emissao'],
        'veiculo'    => $row['placa'],
        'categoria'  => $row['tipo_manutencao'],
        'fornecedor' => $row['fornecedor'],
        'valor'      => (float)$row['valor_total'],
        'status'     => $row['status'],
        'obs'        => $row['observacoes'],
    ];
}

echo json_encode($saida);
