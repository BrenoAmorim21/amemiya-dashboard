<?php
require 'db.php';
header('Content-Type: application/json');

session_unset();
session_destroy();

echo json_encode(['sucesso' => true]);
