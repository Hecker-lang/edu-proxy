<?php
if(file_exists("chat.txt")) {
    $messages = file("chat.txt"); // Jede Zeile als Array speichern
    
    if(isset($_GET['lastLine'])) {  
        $lastLine = (int)$_GET['lastLine'];  
        $newMessages = array_slice($messages, $lastLine); // Nur neue Nachrichten holen
        echo implode("", $newMessages);
    } else {
        echo implode("", $messages);
    }
}
?>
