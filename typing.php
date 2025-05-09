<?php
$typingFile = "typing.json";
$timeout = 2;  // 10 Sekunden Inaktivität

if(!file_exists($typingFile)) {
    file_put_contents($typingFile, json_encode([]));
}

$data = json_decode(file_get_contents($typingFile), true);

// Update Typing-Status
if($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update') {
    $user = htmlspecialchars(trim($_POST['user']));
    $data[$user] = time();
    file_put_contents($typingFile, json_encode($data));
    exit;
}

// Admin-Funktion: Reset des Typing-Status
if($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'reset') {
    $data = array();
    file_put_contents($typingFile, json_encode($data));
    exit;
}

if(isset($_GET['action']) && $_GET['action'] === 'get') {
    $currentTime = time();
    $typingUsers = [];
    foreach($data as $user => $timestamp) {
        if(($currentTime - $timestamp) <= $timeout) {
            $typingUsers[] = $user;
        } else {
            unset($data[$user]);
        }
    }
    file_put_contents($typingFile, json_encode($data));
    header('Content-Type: application/json');
    echo json_encode($typingUsers);
}
?>
