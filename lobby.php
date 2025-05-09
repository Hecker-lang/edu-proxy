<?php
header('Content-Type: application/json');

// Datei für Lobby-Daten
$lobbyFile = 'lobbies.json';

// Hilfsfunktionen
function readLobbies($file) {
    if (!file_exists($file)) return [];
    $json = file_get_contents($file);
    return json_decode($json, true) ?: [];
}
function writeLobbies($file, $lobbies) {
    file_put_contents($file, json_encode($lobbies));
}
function generateCode($length = 6) {
    return strtoupper(substr(md5(uniqid(rand(), true)), 0, $length));
}
function generateToken($length = 8) {
    return substr(md5(uniqid(rand(), true)), 0, $length);
}

$winningConditions = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
];

$lobbies = readLobbies($lobbyFile);
$response = ['success' => false];
$action = isset($_POST['action']) ? $_POST['action'] : '';

if ($action === 'create') {
    // Neue Lobby erstellen, inkl. Chat-Feld
    $lobbyCode = generateCode();
    $playerToken = generateToken();
    $lobbies[$lobbyCode] = [
        'players' => [ 'player1' => $playerToken ],
        'game' => [
            'boardState' => array_fill(0, 9, null),
            'currentPlayer' => "X",
            'gameActive' => true,
            'message' => "Spieler X ist am Zug",
            'chat' => []  // Chatverlauf initial leer
        ],
        'created' => time()
    ];
    writeLobbies($lobbyFile, $lobbies);
    $response = [
        'success' => true,
        'lobbyCode' => $lobbyCode,
        'playerToken' => $playerToken,
        'message' => "Lobby erstellt. Warte auf zweiten Spieler."
    ];
} elseif ($action === 'join') {
    $lobbyCode = strtoupper(trim($_POST['lobbyCode'] ?? ""));
    if (empty($lobbyCode) || !isset($lobbies[$lobbyCode])) {
        $response['message'] = "Lobby nicht gefunden.";
    } else {
        if (count($lobbies[$lobbyCode]['players']) >= 2) {
            $response['message'] = "Lobby ist bereits voll.";
        } else {
            $playerToken = generateToken();
            $lobbies[$lobbyCode]['players']['player2'] = $playerToken;
            $lobbies[$lobbyCode]['game']['message'] = "Spiel gestartet: Spieler " . $lobbies[$lobbyCode]['game']['currentPlayer'] . " ist am Zug.";
            writeLobbies($lobbyFile, $lobbies);
            $response = [
                'success' => true,
                'lobbyCode' => $lobbyCode,
                'playerToken' => $playerToken,
                'lobbyFull' => true,
                'message' => "Lobby voll – Spiel startet!"
            ];
        }
    }
} elseif ($action === 'update') {
    $lobbyCode = strtoupper(trim($_POST['lobbyCode'] ?? ""));
    if (empty($lobbyCode) || !isset($lobbies[$lobbyCode])) {
        $response['message'] = "Lobby nicht gefunden.";
    } else {
        $lobbyFull = (count($lobbies[$lobbyCode]['players']) == 2);
        $response = [
            'success' => true,
            'lobbyFull' => $lobbyFull,
            'game' => $lobbies[$lobbyCode]['game']
        ];
    }
} elseif ($action === 'move') {
    $lobbyCode = strtoupper(trim($_POST['lobbyCode'] ?? ""));
    $playerToken = $_POST['playerToken'] ?? "";
    $cellIndex = intval($_POST['cellIndex'] ?? -1);
    if (empty($lobbyCode) || !isset($lobbies[$lobbyCode])) {
        $response['message'] = "Lobby nicht gefunden.";
    } elseif ($cellIndex < 0 || $cellIndex > 8) {
        $response['message'] = "Ungültiger Zug.";
    } else {
        $playerRole = "";
        if (isset($lobbies[$lobbyCode]['players']['player1']) && $lobbies[$lobbyCode]['players']['player1'] === $playerToken) {
            $playerRole = "X";
        } elseif (isset($lobbies[$lobbyCode]['players']['player2']) && $lobbies[$lobbyCode]['players']['player2'] === $playerToken) {
            $playerRole = "O";
        } else {
            $response['message'] = "Spieler nicht zugeordnet.";
        }
        if ($playerRole && $lobbies[$lobbyCode]['game']['gameActive']) {
            if ($lobbies[$lobbyCode]['game']['currentPlayer'] !== $playerRole) {
                $response['message'] = "Nicht dein Zug.";
            } elseif ($lobbies[$lobbyCode]['game']['boardState'][$cellIndex] !== null) {
                $response['message'] = "Feld bereits belegt.";
            } else {
                $lobbies[$lobbyCode]['game']['boardState'][$cellIndex] = $playerRole;
                $winner = false;
                foreach ($winningConditions as $combo) {
                    if ($lobbies[$lobbyCode]['game']['boardState'][$combo[0]] &&
                        $lobbies[$lobbyCode]['game']['boardState'][$combo[0]] === $lobbies[$lobbyCode]['game']['boardState'][$combo[1]] &&
                        $lobbies[$lobbyCode]['game']['boardState'][$combo[0]] === $lobbies[$lobbyCode]['game']['boardState'][$combo[2]]) {
                        $winner = $lobbies[$lobbyCode]['game']['boardState'][$combo[0]];
                        break;
                    }
                }
                if ($winner) {
                    $lobbies[$lobbyCode]['game']['gameActive'] = false;
                    $lobbies[$lobbyCode]['game']['message'] = "Spieler " . $winner . " gewinnt!";
                } else if (!in_array(null, $lobbies[$lobbyCode]['game']['boardState'], true)) {
                    $lobbies[$lobbyCode]['game']['gameActive'] = false;
                    $lobbies[$lobbyCode]['game']['message'] = "Unentschieden!";
                } else {
                    $lobbies[$lobbyCode]['game']['currentPlayer'] = ($playerRole === "X") ? "O" : "X";
                    $lobbies[$lobbyCode]['game']['message'] = "Spieler " . $lobbies[$lobbyCode]['game']['currentPlayer'] . " ist am Zug.";
                }
                writeLobbies($lobbyFile, $lobbies);
                $response = ['success' => true, 'message' => $lobbies[$lobbyCode]['game']['message']];
            }
        }
    }
} elseif ($action === 'reset') {
    $lobbyCode = strtoupper(trim($_POST['lobbyCode'] ?? ""));
    if (empty($lobbyCode) || !isset($lobbies[$lobbyCode])) {
        $response['message'] = "Lobby nicht gefunden.";
    } else {
        $lobbies[$lobbyCode]['game']['boardState'] = array_fill(0, 9, null);
        $lobbies[$lobbyCode]['game']['currentPlayer'] = "X";
        $lobbies[$lobbyCode]['game']['gameActive'] = true;
        $lobbies[$lobbyCode]['game']['message'] = "Spiel zurückgesetzt. Spieler X ist am Zug.";
        writeLobbies($lobbyFile, $lobbies);
        $response = ['success' => true, 'message' => $lobbies[$lobbyCode]['game']['message']];
    }
} elseif ($action === 'chatSend') {
    // Chatnachricht hinzufügen
    $lobbyCode = strtoupper(trim($_POST['lobbyCode'] ?? ""));
    $playerToken = $_POST['playerToken'] ?? "";
    $chatMessage = trim($_POST['message'] ?? "");
    if (empty($lobbyCode) || !isset($lobbies[$lobbyCode])) {
        $response['message'] = "Lobby nicht gefunden.";
    } elseif ($chatMessage === "") {
        $response['message'] = "Leere Nachricht.";
    } else {
        $sender = "Unbekannt";
        if (isset($lobbies[$lobbyCode]['players']['player1']) && $lobbies[$lobbyCode]['players']['player1'] === $playerToken) {
            $sender = "Spieler X";
        } elseif (isset($lobbies[$lobbyCode]['players']['player2']) && $lobbies[$lobbyCode]['players']['player2'] === $playerToken) {
            $sender = "Spieler O";
        }
        $entry = [
            'sender' => $sender,
            'message' => $chatMessage,
            'time' => time()
        ];
        $lobbies[$lobbyCode]['game']['chat'][] = $entry;
        writeLobbies($lobbyFile, $lobbies);
        $response = ['success' => true];
    }
} elseif ($action === 'chatUpdate') {
    // Chatnachrichten zurückgeben
    $lobbyCode = strtoupper(trim($_POST['lobbyCode'] ?? ""));
    if (empty($lobbyCode) || !isset($lobbies[$lobbyCode])) {
        $response['message'] = "Lobby nicht gefunden.";
    } else {
        $response = ['success' => true, 'chat' => $lobbies[$lobbyCode]['game']['chat']];
    }
} else {
    $response['message'] = "Ungültige Aktion.";
}
echo json_encode($response);
exit;
?>
