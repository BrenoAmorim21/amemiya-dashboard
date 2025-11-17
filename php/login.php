<?php
header('Content-Type: application/json');
require 'db.php';
$input = json_decode(file_get_contents('php://input'), true);
$email = strtolower(trim($input['email'] ?? ''));
$pass = $input['password'] ?? '';
$st = $pdo->prepare('SELECT id,name,password_hash FROM users WHERE email=:e AND status=\'active\' LIMIT 1');
$st->execute(['e'=>$email]);
$user = $st->fetch(PDO::FETCH_ASSOC);
if(!$user || !password_verify($pass, $user['password_hash'])){ http_response_code(401); echo json_encode(['error'=>'Credenciais inválidas']); exit; }
$_SESSION['uid'] = $user['id']; $_SESSION['email']=$email; $_SESSION['name']=$user['name'];
echo json_encode(['ok'=>true]);