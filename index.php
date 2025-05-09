<?php
// index.php

// --- Config ---
define('APP_VERSION', '0.0.2');
define('MAINTENANCE_ACTIVE', true);
define('MAINTENANCE_MESSAGE', 'Wartungsarbeiten: Wir fügen spannende neue Features hinzu!');

// --- JSON‑Endpoints ---
$uri = $_SERVER['REQUEST_URI'];

// 1) Version
if (strpos($uri, 'version.json') !== false) {
    header('Content-Type: application/json');
    echo json_encode(['version' => APP_VERSION]);
    exit;
}

// 2) Maintenance‑Status
if (strpos($uri, 'maintenance.json') !== false) {
    header('Content-Type: application/json');
    echo json_encode([
        'active'  => MAINTENANCE_ACTIVE,
        'message' => MAINTENANCE_MESSAGE
    ]);
    exit;
}

// 3) Live Active Users (unique IPs in last 5min)
if (strpos($uri, 'users.json') !== false) {
    $file = __DIR__ . '/users.log';
    $ip   = $_SERVER['REMOTE_ADDR'];
    $now  = time();
    // load existing or init
    $data = [];
    if (file_exists($file)) {
        $data = json_decode(file_get_contents($file), true) ?: [];
    }
    // prune entries older than 5min
    foreach ($data as $k => $t) {
        if ($t < $now - 300) {
            unset($data[$k]);
        }
    }
    // update current IP
    $data[$ip] = $now;
    file_put_contents($file, json_encode($data));
    header('Content-Type: application/json');
    echo json_encode(['count' => count($data)]);
    exit;
}

// --- PHP Error Reporting (dev) ---
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// --- Proxy Logic ---
if (isset($_GET['url'])) {
    $url = trim($_GET['url']);
    if (!preg_match('#^https?://#i', $url)) {
        $url = 'https://' . $url;
    }
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        http_response_code(400);
        exit('Ungültige URL.');
    }
    if (!function_exists('getallheaders')) {
        function getallheaders() {
            $hdr = [];
            foreach ($_SERVER as $k => $v) {
                if (0 === strpos($k, 'HTTP_')) {
                    $hdr[str_replace(' ', '-',
                        ucwords(strtolower(str_replace('_',' ', substr($k,5))))
                    )] = $v;
                }
            }
            return $hdr;
        }
    }
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_USERAGENT      => $_SERVER['HTTP_USER_AGENT'] ?? 'Mozilla/5.0',
        CURLOPT_SSLVERSION     => CURL_SSLVERSION_TLSv1_2,
    ]);
    $ref = parse_url($url, PHP_URL_SCHEME) . '://' . parse_url($url, PHP_URL_HOST) . '/';
    $req = [];
    foreach (getallheaders() as $n => $v) {
        if (!in_array(strtolower($n), ['host','connection','content-length'], true)) {
            $req[] = "$n: $v";
        }
    }
    $req[] = "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
    $req[] = "Accept-Language: de-DE,de;q=0.9,en-US;q=0.8";
    $req[] = "Referer: $ref";
    curl_setopt($ch, CURLOPT_HTTPHEADER, $req);

    $resp = curl_exec($ch);
    if ($resp === false && curl_errno($ch) === CURLE_SSL_CONNECT_ERROR) {
        curl_setopt($ch, CURLOPT_URL, preg_replace('#^https?://#', 'http://', $url));
        $resp = curl_exec($ch);
    }
    if ($resp === false) {
        http_response_code(502);
        exit('Proxy-Fehler: ' . curl_error($ch));
    }
    http_response_code(curl_getinfo($ch, CURLINFO_HTTP_CODE));
    if ($type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE)) {
        header("Content-Type: $type");
    }
    echo $resp;
    curl_close($ch);
    exit;
}
?>
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Hecker Games – Offizielle Website</title>
  <link rel="icon" href="IMG_0027.jpeg">
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500&family=Roboto:wght@400;500&display=swap" rel="stylesheet">
  <style>
    /* Global */
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Roboto',sans-serif;
      background:linear-gradient(-45deg,#0a0213,#2c003e,#1e3a8a,#3b006f);
      background-size:400% 400%;animation:bgGradient 25s ease infinite;
      color:#fff;overflow-x:hidden}
    @keyframes bgGradient{0%{background-position:0 50%}50%{background-position:100% 50%}100%{background-position:0 50%}}
    a{color:inherit;text-decoration:none}

    /* Nav & Users */
    nav{display:flex;align-items:center;padding:18px 24px;
      background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);
      position:sticky;top:0;z-index:1000;animation:fadeInDown .8s}
    @keyframes fadeInDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
    .nav-links{display:flex;gap:28px}
    .nav-links a{font-weight:500;position:relative;
      transition:.3s;animation:linkPulse 4s ease-in-out infinite}
    @keyframes linkPulse{0%{opacity:.75}50%{opacity:1}100%{opacity:.75}}
    .nav-links a::after{content:'';position:absolute;bottom:-6px;left:0;
      width:0;height:3px;background:#a855f7;transition:width .4s}
    .nav-links a:hover::after{width:100%}
    .nav-links a:hover{transform:scale(1.1);color:#a855f7}

    .ai-button{margin-left:auto;background:#000;color:#a855f7;
      border:2px solid #a855f7;padding:10px 22px;border-radius:6px;
      cursor:pointer;box-shadow:0 0 12px #a855f7;transition:.3s;
      animation:botGlow 2s infinite alternate}
    @keyframes botGlow{from{box-shadow:0 0 5px #a855f7}to{box-shadow:0 0 30px #a855f7}}
    .ai-button:hover{transform:translateY(-3px)}

    #userCount{margin-left:20px;font-size:.9em;font-weight:500;color:#1e88e5;
      animation:userPulse 2s ease-in-out infinite}
    @keyframes userPulse{0%{opacity:.7}50%{opacity:1}100%{opacity:.7}}

    /* Header */
    header{text-align:center;padding:100px 20px;animation:fadeInDown 1s;position:relative;overflow:hidden}
    header::before{content:"";position:absolute;top:-60%;left:-60%;
      width:220%;height:220%;background:radial-gradient(circle,rgba(255,255,255,0.05),transparent 70%);
      animation:spinBg 60s linear infinite;opacity:.05}
    @keyframes spinBg{to{transform:rotate(360deg)}}
    header img{height:110px;animation:logoBounce 4s infinite}
    @keyframes logoBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
    header h1{font-family:'Orbitron',sans-serif;font-size:4em;margin-top:20px;
      background:linear-gradient(90deg,#a855f7,#1565c0,#a855f7);
      background-clip:text;-webkit-background-clip:text;color:transparent;
      animation:gradientText 8s ease infinite}
    @keyframes gradientText{0%{background-position:0%}50%{background-position:100%}100%{background-position:0%}}

    /* Games */
    .game-container{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));
      gap:45px;padding:70px 30px}
    .game-card{background:rgba(255,255,255,0.07);border:2px solid rgba(255,255,255,0.2);
      border-radius:20px;padding:35px;box-shadow:0 0 25px rgba(0,0,0,0.6);
      opacity:0;transform:translateY(50px) rotateX(15deg);perspective:900px;
      animation:cardFade 1s forwards;transition:transform .6s,box-shadow .6s;
      animation-delay:calc(0.2s * var(--i))}
    @keyframes cardFade{to{opacity:1;transform:translateY(0) rotateX(0)}}
    .game-card:hover{transform:scale(1.12) rotateX(4deg) rotateY(4deg);
      box-shadow:0 0 55px rgba(30,136,229,1)}
    .game-card img{width:100%;border-radius:14px;transition:.8s}
    .game-card img:hover{transform:scale(1.2) rotate(8deg)}
    .game-card h2{margin:22px 0 10px;font-size:2em;animation:textFade 1s both}
    .game-card p{font-size:1.1em;line-height:1.7;animation:textFade 1.2s both}
    @keyframes textFade{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

    .play-button{margin-top:14px;padding:18px 36px;font-size:1.2em;
      background:#1e88e5;border-radius:10px;display:inline-block;
      position:relative;overflow:hidden;transition:.4s;animation:buttonPulse 5s infinite;
      text-decoration:none}
    @keyframes buttonPulse{0%{transform:scale(1)}50%{transform:scale(1.12)}100%{transform:scale(1)}}
    .play-button::before{content:'';position:absolute;top:0;left:-180%;width:100%;height:100%;
      background:rgba(255,255,255,0.35);transform:skewX(-35deg);transition:.8s}
    .play-button:hover::before{left:280%}
    .play-button:hover{background:#1565c0}

    /* Proxy Input */
    #customProxy{max-width:550px;margin:60px auto;text-align:center;animation:fadeInUp 1s both}
    #customProxy h2{font-family:'Orbitron',sans-serif;color:#a855f7;font-size:2em;margin-bottom:25px;animation:textFade 1s both}
    #customProxy input{width:100%;padding:18px;font-size:1em;border-radius:10px;
      border:2px solid rgba(255,255,255,0.3);margin-bottom:18px;animation:inputGlow 4s ease infinite}
    @keyframes inputGlow{0%{box-shadow:0 0 8px rgba(168,85,247,0.4)}50%{box-shadow:0 0 28px rgba(168,85,247,0.7)}100%{box-shadow:0 0 8px rgba(168,85,247,0.4)}}
    #customProxy button{padding:18px;width:100%;font-size:1.15em;border:none;border-radius:10px;background:#a855f7;transition:.4s}
    #customProxy button:hover{background:#8b3dc6;transform:translateY(-4px) scale(1.03)}

    /* About */
    #about{padding:80px 20px;text-align:center;background:rgba(0,0,0,0.45);animation:fadeInUp 1s both}
    #about h2{font-family:'Orbitron',sans-serif;font-size:3.2em;margin-bottom:30px;
      background:linear-gradient(90deg,#a855f7,#1565c0,#a855f7);background-clip:text;
      -webkit-background-clip:text;color:transparent;animation:gradientText 8s ease infinite}
    #about p{max-width:880px;margin:0 auto;line-height:1.9;font-size:1.2em;animation:textFade 1.2s both}

    /* Loading Overlay */
    #loadingOverlay{position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.95);display:flex;align-items:center;
      justify-content:center;visibility:hidden;opacity:0;
      transition:opacity .3s ease,visibility .3s;z-index:2000}
    #loadingOverlay.active{visibility:visible;opacity:1}
    .loader-content{text-align:center;color:#fff}
    .spinner{animation:rotate 1s linear infinite;width:80px;height:80px;margin:0 auto 20px}
    .spinner .path{stroke:#a855f7;stroke-linecap:round;animation:dash 1.5s ease-in-out infinite}
    @keyframes rotate{100%{transform:rotate(360deg)}}@keyframes dash{0%{stroke-dasharray:1,150;stroke-dashoffset:0}50%{stroke-dasharray:90,150;stroke-dashoffset:-35}100%{stroke-dasharray:90,150;stroke-dashoffset:-124}}
    .loader-content h3{margin-bottom:20px;font-size:1.4em;font-family:'Orbitron',sans-serif}
    .progress-bar{width:300px;height:10px;background:rgba(255,255,255,0.2);border-radius:5px;overflow:hidden;margin:0 auto}
    .progress-fill{width:0%;height:100%;background:#1e88e5;transition:width .8s ease-out}

    /* Maintenance Overlay */
    #maintenanceOverlay{position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.98);display:flex;align-items:center;justify-content:center;
      visibility:hidden;opacity:0;transition:opacity .3s ease,visibility .3s;z-index:2001}
    #maintenanceOverlay.active{visibility:visible;opacity:1}
    #maintenanceOverlay .update-screen{text-align:center;color:#fff;max-width:380px}
    #maintenanceOverlay .update-screen h2{font-family:'Orbitron',sans-serif;font-size:2em;color:#a855f7;margin-bottom:10px}

    /* Update Overlay */
    #updateOverlay{position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.98);display:flex;align-items:center;justify-content:center;
      visibility:hidden;opacity:0;transition:opacity .3s ease,visibility .3s;z-index:2002}
    #updateOverlay.active{visibility:visible;opacity:1}

    /* Update Log Overlay */
    #updateLogOverlay{position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;
      visibility:hidden;opacity:0;transition:opacity .3s ease,visibility .3s;z-index:2003}
    #updateLogOverlay.active{visibility:visible;opacity:1}
    .update-log-content{background:rgba(0,0,0,0.8);padding:30px;border-radius:10px;
      max-width:400px;color:#fff;text-align:left}
    .update-log-content h2{font-family:'Orbitron',sans-serif;color:#a855f7;margin-bottom:15px}
    .update-log-content ul{padding-left:20px}
    .update-log-content li{margin-bottom:8px}
    .update-log-content button{margin-top:20px;padding:10px 20px;
      background:#a855f7;border:none;border-radius:6px;cursor:pointer}

    /* Footer & Controls */
    footer{display:flex;justify-content:center;align-items:center;gap:15px;
      text-align:center;padding:26px 10px;background:rgba(0,0,0,0.55);animation:footerPop .8s both}
    @keyframes footerPop{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
    #showUpdateLog{background:#000;color:#a855f7;border:2px solid #a855f7;
      padding:8px 16px;border-radius:6px;cursor:pointer}
    #showUpdateLog:hover{background:#a855f7;color:#000}
    #backToTop{position:fixed;bottom:60px;right:45px;background:#1e88e5;color:#fff;
      border:none;padding:18px 22px;border-radius:50%;cursor:pointer;
      box-shadow:0 0 16px rgba(30,136,229,0.8);transition:.2s;display:none;
      animation:backPulse 2s ease infinite;font-size:1.2em}
    @keyframes backPulse{0%{transform:scale(1)}50%{transform:scale(1.1)}100%{transform:scale(1)}}
    #backToTop:hover{transform:translateY(-4px) scale(1.1)}
  </style>
</head>
<body>

  <!-- Navigation -->
  <nav>
    <div class="nav-links">
      <a href="#home">Home</a>
      <a href="#games">Games</a>
      <a href="#about">Über uns</a>
      <a href="#kontakt">Kontakt</a>
    </div>
    <button id="aiButton" class="ai-button">Hecker-BOT</button>
    <div id="userCount">… Nutzer online</div>
  </nav>

  <!-- Header -->
  <header id="home">
    <img src="IMG_0027.jpeg" alt="Hecker Games Logo">
    <h1>Hecker Games</h1>
  </header>

  <!-- Games Section -->
  <section class="game-container" id="games">
    <?php
      $games = [
        ['img'=>'IMG_0024.jpeg','title'=>'Shooter Game','desc'=>'Packende Action & Taktik','url'=>'?url=hecker.kesug.com'],
        ['img'=>'IMG_0026.jpeg','title'=>'Tower Defense','desc'=>'Strategisches Turm-Gameplay','url'=>'?url=towerdefenso.ct.ws'],
        ['img'=>'IMG_0029.jpeg','title'=>'Cyberpunk Racer','desc'=>'Futuristische Drift-Rennen','url'=>'?url=racegame.infy.uk'],
        ['img'=>'IMG_0028.jpeg','title'=>'Simon the Snake','desc'=>'Charmantes Schlangen-Abenteuer','url'=>'?url=simonthesnake.kesug.com'],
        ['img'=>'IMG_0030.jpeg','title'=>'Tic Tac Toe','desc'=>'Online & Lokal spielbar','url'=>'?url=tictactoe34.ct.ws'],
        ['img'=>'IMG_0049.jpeg','title'=>'Klassen Chat 8.3','desc'=>'Nur mit Code beitreten','url'=>'?url=klassenchat8.ct.ws'],
        ['img'=>'IMG_0123.jpeg','title'=>'Raise a Floppa','desc'=>'Karakal-Aufziehen-Simulator','url'=>'?url=raiseafloppa.rf.gd'],
        ['img'=>'IMG_0005.jpeg','title'=>'Hecker Roulette','desc'=>'Russisch-Roulette-Shotgun','url'=>'?url=http://heckerroulette.rf.gd'],
      ];
      $i = 1;
      foreach ($games as $g) {
        echo "<div class='game-card' style='--i:$i;'>
                <img src='{$g['img']}' alt='{$g['title']}'>
                <h2>{$g['title']}</h2>
                <p>{$g['desc']}</p>
                <a href='{$g['url']}' class='play-button'>{$g['title']}</a>
              </div>";
        $i++;
      }
    ?>
  </section>

  <!-- Proxy Unblocker Input -->
  <div id="customProxy">
    <h2>Proxy Unblocker</h2>
    <input type="url" id="customUrl" placeholder="example.com eingeben">
    <button id="openCustom">Öffnen</button>
  </div>

  <!-- About Section -->
  <section id="about">
    <h2>Über uns</h2>
    <p>Hecker Games ist ein Entwicklerstudio für kreative Browser-Games.Wir bestehen aus einem Entwickler und einer wo Spiel Ideen gibt und mit Hilfe von Chat GPT Spiele machen.</p>
  </section>

  <!-- Overlays -->
  <div id="loadingOverlay">
    <div class="loader-content">
      <svg class="spinner" viewBox="0 0 50 50"><circle class="path" cx="25" cy="25" r="20" stroke-width="5"/></svg>
      <h3 id="loaderTitle">Bitte warten…</h3>
      <div class="progress-bar"><div class="progress-fill"></div></div>
    </div>
  </div>

  <div id="maintenanceOverlay">
    <div class="update-screen">
      <h2>Wartungsarbeiten</h2>
      <p id="maintenanceMsg"></p>
    </div>
  </div>

  <div id="updateOverlay">
    <div class="update-screen">
      <h2>Neue Version verfügbar!</h2>
      <p>Wir aktualisieren jetzt auf Version <span id="newVersion"></span>…</p>
    </div>
  </div>

  <div id="updateLogOverlay">
    <div class="update-log-content">
      <h2>Changelog</h2>
      <ul>
        <li>Version 0.0.2: Verbesserte Lade-Animation, Update- und Wartungs-Screens, Live‑User‑Count</li>
        <li>Version 0.0.1: Proxy‑Fallback, Animationen, Update‑Erkennung</li>
      </ul>
      <button id="closeUpdateLog">Schließen</button>
    </div>
  </div>

  <!-- Footer -->
  <footer id="kontakt">
    <button id="showUpdateLog">Update Log</button>
    <p>&copy; 2025 Hecker Games. Alle Rechte vorbehalten.</p>
  </footer>

  <!-- Back-to-Top -->
  <button id="backToTop" onclick="scrollToTop()">↑</button>

  <!-- Chatling Bot -->
  <script>window.chtlConfig={chatbotId:"7445533126"};</script>
  <script async data-id="7445533126" src="https://chatling.ai/js/embed.js"></script>

  <script>
    const CURRENT_VERSION = '<?php echo APP_VERSION;?>';
    const overlay        = document.getElementById('loadingOverlay');
    const updateOverlay  = document.getElementById('updateOverlay');
    const maintenanceOv  = document.getElementById('maintenanceOverlay');
    const updateLogOv    = document.getElementById('updateLogOverlay');
    const newVerSpan     = document.getElementById('newVersion');
    const loaderTitle    = document.getElementById('loaderTitle');
    const progressFill   = document.querySelector('.progress-fill');
    const userCountEl    = document.getElementById('userCount');
    const maintenanceMsg = document.getElementById('maintenanceMsg');

    async function fetchJSON(path){
      try {
        const res = await fetch(path + '?cb=' + Date.now());
        if (!res.ok) throw new Error();
        return await res.json();
      } catch {
        return null;
      }
    }

    async function checkVersion(){
      const data = await fetchJSON('version.json');
      if (data && data.version !== CURRENT_VERSION){
        newVerSpan.textContent = data.version;
        updateOverlay.classList.add('active');
        setTimeout(()=> location.reload(true), 5000);
      }
    }

    async function checkMaintenance(){
      const m = await fetchJSON('maintenance.json');
      if (m && m.active){
        maintenanceMsg.textContent = m.message;
        maintenanceOv.classList.add('active');
      } else {
        maintenanceOv.classList.remove('active');
      }
    }

    async function updateUserCount(){
      const u = await fetchJSON('users.json');
      if (u && u.count != null){
        userCountEl.textContent = 'Alle Nutzer: ' + u.count;
      }
    }

    function proxyNav(h, title){
      if (!h || h.endsWith('#')) return;
      loaderTitle.textContent = title
        ? 'Lade "'+ title +'"…'
        : 'Bitte warten…';
      progressFill.style.width = '0%';
      overlay.classList.add('active');
      setTimeout(()=> progressFill.style.width = '60%', 100);
      setTimeout(()=> progressFill.style.width = '90%', 400);
      setTimeout(()=>{
        progressFill.style.width = '100%';
        setTimeout(()=> location.href = h, 200);
      }, 800);
    }

    window.addEventListener('load', ()=>{
      overlay.classList.remove('active');
      checkVersion();
      checkMaintenance();
      updateUserCount();
      setInterval(checkVersion,      30*1000);
      setInterval(checkMaintenance,  30*1000);
      setInterval(updateUserCount,   30*1000);
    });

    document.querySelectorAll('.play-button').forEach(btn=>{
      btn.addEventListener('click', e=>{
        e.preventDefault();
        proxyNav(btn.href, btn.textContent);
      });
    });
    document.getElementById('aiButton').addEventListener('click', ()=>{
      proxyNav('?url=ki-bot.kesug.com/?i=1', 'Hecker‑BOT');
    });
    document.getElementById('openCustom').addEventListener('click', ()=>{
      const u = document.getElementById('customUrl').value.trim();
      proxyNav('?url=' + encodeURIComponent(u), 'Proxy‑URL');
    });

    // Update Log
    document.getElementById('showUpdateLog').onclick = ()=> updateLogOv.classList.add('active');
    document.getElementById('closeUpdateLog').onclick = ()=> updateLogOv.classList.remove('active');

    // Scroll-Reveal
    const reveals = document.querySelectorAll('.game-card, header, #customProxy, #about, footer');
    function onScroll(){
      reveals.forEach(el=>{
        if (el.getBoundingClientRect().top < window.innerHeight - 80)
          el.classList.add('active');
      });
    }
    window.addEventListener('scroll', onScroll);

    // Back-to-Top
    const btnTop = document.getElementById('backToTop');
    window.addEventListener('scroll', ()=> btnTop.style.display = window.scrollY > 400 ? 'block' : 'none');
    function scrollToTop(){ window.scrollTo({top:0,behavior:'smooth'}); }
  </script>
</body>
</html>
