<?php
header("Access-Control-Allow-Origin: *");  // Erlaubt alle Ursprünge

// Überschreibt die Datei "chat.txt" komplett mit einem leeren String.
file_put_contents("chat.txt", "");
echo "Chat geleert";
?>
