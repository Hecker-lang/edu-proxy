<?php
date_default_timezone_set('Europe/Berlin');

if(isset($_POST['username']) && isset($_POST['message'])) {
    $username = htmlspecialchars(trim($_POST['username']));
    
    // Prüfe, ob der Benutzer gesperrt ist
    $bannedFile = "banned.txt";
    if(file_exists($bannedFile)) {
        $banned = file($bannedFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if(in_array($username, $banned)){
            // Gesperrte Benutzer dürfen keine Nachrichten senden.
            exit;
        }
    }
    
    $message = htmlspecialchars(trim($_POST['message']));
    $time = date("H:i:s");
    $entry = "<div class='message'><strong>$username</strong> [$time]: $message";
    
    // Bild-Upload prüfen
    if(isset($_FILES['image']) && $_FILES['image']['error'] == UPLOAD_ERR_OK) {
        $allowedImg = array('jpg', 'jpeg', 'png', 'gif');
        $fileName = basename($_FILES['image']['name']);
        $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        if(in_array($fileExt, $allowedImg)) {
            $uploadDir = "uploads/";
            if(!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            $newFileName = uniqid("img_") . "." . $fileExt;
            $uploadPath = $uploadDir . $newFileName;
            if(move_uploaded_file($_FILES['image']['tmp_name'], $uploadPath)) {
                $entry .= "<br><img src='$uploadPath' style='max-width:300px; margin-top:5px; border:1px solid #ccc;' alt='Bild'>";
            }
        }
    }
    
    // Video-Upload prüfen
    if(isset($_FILES['video']) && $_FILES['video']['error'] == UPLOAD_ERR_OK) {
        $allowedVid = array('mp4', 'webm', 'ogv');
        $videoName = basename($_FILES['video']['name']);
        $videoExt = strtolower(pathinfo($videoName, PATHINFO_EXTENSION));
        if(in_array($videoExt, $allowedVid)) {
            $uploadDir = "uploads/";
            if(!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            $newVideoName = uniqid("vid_") . "." . $videoExt;
            $uploadPath = $uploadDir . $newVideoName;
            if(move_uploaded_file($_FILES['video']['tmp_name'], $uploadPath)) {
                $mimeMap = array(
                    'mp4' => 'video/mp4',
                    'webm' => 'video/webm',
                    'ogv' => 'video/ogg'
                );
                $mime = isset($mimeMap[$videoExt]) ? $mimeMap[$videoExt] : "video/$videoExt";
                $entry .= "<br><video controls style='width:100%; max-width:300px; height:auto; margin-top:5px; border:1px solid #ccc;'>
                             <source src='$uploadPath' type='$mime'>
                             Ihr Browser unterstützt das Video-Tag nicht.
                           </video>";
            }
        }
    }
    
    $entry .= "</div>\n";
    file_put_contents("chat.txt", $entry, FILE_APPEND | LOCK_EX);
}
?>
