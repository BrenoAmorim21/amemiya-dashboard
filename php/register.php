<?php
header('Content-Type: application/json');
require 'db.php';
$in = json_decode(file_get_contents('php://input'), true);
$name = trim($in['name'] ?? '');
$company = trim($in['company'] ?? '');
$address = trim($in['address'] ?? '');
$cpf = preg_replace('/\D/','', $in['cpf'] ?? '');
$birthdate = $in['birthdate'] ?? null;
$email = strtolower(trim($in['email'] ?? ''));
$pass = $in['password'] ?? '';


if(!$name||!$company||!$address||!$cpf||!$birthdate||!$email||!$pass){ http_response_code(400); echo json_encode(['error'=>'Campos obrigatórios ausentes']); exit; }
if(!filter_var($email, FILTER_VALIDATE_EMAIL)){ http_response_code(400); echo json_encode(['error'=>'E-mail inválido']); exit; }
if(strlen($pass) < 6){ http_response_code(400); echo json_encode(['error'=>'Senha muito curta']); exit; }


$st=$pdo->prepare('SELECT id FROM users WHERE email=:e'); $st->execute(['e'=>$email]); if($st->fetch()){ http_response_code(400); echo json_encode(['error'=>'E-mail já cadastrado']); exit; }


$hash = password_hash($pass, PASSWORD_DEFAULT);
$pdo->prepare('INSERT INTO users(name,email,password_hash,org_id,role,status,company,address,cpf,birthdate,created_at) VALUES(:n,:e,:h,1,\'OrgAdmin\',\'active\',:c,:a,:cpf,:b,NOW())')
->execute(['n'=>$name,'e'=>$email,'h'=>$hash,'c'=>$company,'a'=>$address,'cpf'=>$cpf,'b'=>$birthdate]);
$_SESSION['uid'] = $pdo->lastInsertId(); $_SESSION['email']=$email; $_SESSION['name']=$name;
echo json_encode(['ok'=>true]);