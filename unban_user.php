<?php
if($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['username'])){
    $username = trim($_POST['username']);
    if(empty($username)){
        echo json_encode(['error' => 'Benutzername erforderlich.']);
        exit;
    }
    $bannedFile = "banned.txt";
    if(!file_exists($bannedFile)){
        echo json_encode(['message' => 'Keine Benutzer gesperrt.']);
        exit;
    }
    $lines = file($bannedFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $lines = array_filter($lines, function($line) use ($username){
        return $line !== $username;
    });
    file_put_contents($bannedFile, implode("\n", $lines) . "\n");
    echo json_encode(['message' => "Benutzer $username wurde entsperrt."]);
}
?>
