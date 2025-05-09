<?p
header('Content-Type: application/json');
echo json_encode(array("maintenance" => file_exists("maintenance.flag")));
?>
