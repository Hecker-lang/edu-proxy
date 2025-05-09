<?php
if(file_exists("maintenance.flag")){
  unlink("maintenance.flag");
  echo "Maintenance mode disabled";
} else {
  echo "Maintenance mode not active";
}
?>
