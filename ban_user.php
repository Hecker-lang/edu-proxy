<?php
if($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['username'])){
    $username = trim($_POST['username']);
    if(empty($username)){
        echo json_encode(['error' => 'Benutzername erforderlich.']);
        exit;
    }
    $bannedFile = "banned.txt";
    $banned = [];
    if(file_exists($bannedFile)){
        $banned = file($bannedFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    }
    if(in_array($username, $banned)){
        echo json_encode(['message' => 'Benutzer ist bereits gesperrt.']);
        exit;
    }
    file_put_contents($bannedFile, $username . "\n", FILE_APPEND);
    echo json_encode(['message' => "Benutzer $username wurde gesperrt."]);
}
?>
