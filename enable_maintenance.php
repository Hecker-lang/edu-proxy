<?php
// Erstelle die Datei "maintenance.flag", um den Wartungsmodus zu aktivieren
file_put_contents("maintenance.flag", "Wartungsmodus aktiv");
echo "Maintenance mode enabled";
?>
