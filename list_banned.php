<?php
header('Content-Type: application/json');
$bannedFile = "banned.txt";
$banned = [];
if(file_exists($bannedFile)){
    $banned = file($bannedFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
}
echo json_encode($banned);
?>
