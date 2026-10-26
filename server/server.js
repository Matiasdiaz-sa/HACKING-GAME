const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const GameRoom = require('./gameRoom');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Servir archivos estáticos del cliente
app.use(express.static(path.join(__dirname, '..', 'public')));

// Obtener IP LAN local para facilitar la conexión multijugador
function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const LAN_IP = getLanIp();

// Endpoint de información para el lobby (detecta automáticamente si corre en la Nube o en red LAN)
app.get('/api/info', (req, res) => {
  const hostHeader = req.get('host');
  const isHttps = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https';
  const protocol = isHttps ? 'https' : 'http';
  
  const isCloud = !!(
    process.env.RENDER || 
    process.env.RENDER_EXTERNAL_URL || 
    process.env.RAILWAY_STATIC_URL || 
    process.env.NODE_ENV === 'production' || 
    (hostHeader && !hostHeader.includes('localhost') && !hostHeader.includes('127.0.0.1') && !hostHeader.includes(LAN_IP))
  );

  const connectUrl = isCloud && hostHeader ? `${protocol}://${hostHeader}` : `http://${LAN_IP}:${PORT}`;

  res.json({
    lanIp: LAN_IP,
    port: PORT,
    connectUrl,
    isCloud,
    version: '1.0.0'
  });
});

// Almacenamiento en memoria de salas
const rooms = new Map(); // roomId -> GameRoom
const socketToRoom = new Map(); // socketId -> roomId

// Generar código de sala amigable
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on('connection', (socket) => {
  console.log(`[+] Conexión de cliente: ${socket.id} (IP remota: ${socket.handshake.address})`);

  // Unirse o crear una sala
  socket.on('join_game', ({ username, roomCode }) => {
    const cleanUser = (username || `Agente_${socket.id.slice(0, 4)}`).trim().slice(0, 15);
    let targetRoomCode = (roomCode || '').trim().toUpperCase();

    let room = null;

    if (targetRoomCode) {
      room = rooms.get(targetRoomCode);
      if (room && room.players.size >= 2) {
        socket.emit('lobby_error', { message: `La sala [${targetRoomCode}] ya está llena (máx 2 jugadores).` });
        return;
      }
      if (!room) {
        // Crear sala con ese código
        room = new GameRoom(targetRoomCode, { socket, username: cleanUser });
        rooms.set(targetRoomCode, room);
      } else {
        // Unirse a sala existente
        room.addPlayer(socket, cleanUser);
      }
    } else {
      // Buscar una sala en espera automática o crear una nueva
      for (const [code, r] of rooms.entries()) {
        if (r.status === 'WAITING' && r.players.size < 2) {
          room = r;
          targetRoomCode = code;
          break;
        }
      }

      if (room) {
        room.addPlayer(socket, cleanUser);
      } else {
        targetRoomCode = generateRoomCode();
        room = new GameRoom(targetRoomCode, { socket, username: cleanUser });
        rooms.set(targetRoomCode, room);
      }
    }

    socketToRoom.set(socket.id, targetRoomCode);

    socket.emit('lobby_joined', {
      roomId: targetRoomCode,
      username: cleanUser,
      isHost: room.players.size === 1,
      playersCount: room.players.size,
      lanUrl: `http://${LAN_IP}:${PORT}`
    });

    console.log(`[SALA] ${cleanUser} (${socket.id}) en sala ${targetRoomCode}. Total jugadores: ${room.players.size}`);
  });

  // Modo Práctica / Simulador contra Bot IA con Dificultades
  socket.on('start_bot_game', ({ username, difficulty = 'medium' }) => {
    const cleanUser = (username || `Agente_${socket.id.slice(0, 4)}`).trim().slice(0, 15);
    const botRoomCode = 'BOT_' + generateRoomCode();

    const room = new GameRoom(botRoomCode, { socket, username: cleanUser });
    rooms.set(botRoomCode, room);

    // Mock socket para el Bot virtual
    const botSocket = {
      id: 'bot_' + Math.random().toString(36).substring(2, 7),
      join: () => {},
      emit: () => {}
    };

    const diffLabels = {
      easy: 'CyberBot [FÁCIL]',
      medium: 'CyberBot [NORMAL]',
      hard: 'CyberBot [DIFÍCIL]',
      nightmare: 'CyberBot [PESADILLA]'
    };
    const botName = diffLabels[difficulty] || 'CyberBot_AI';
    socketToRoom.set(socket.id, botRoomCode);
    room.addPlayer(botSocket, botName);

    // Iniciar el motor de IA con la dificultad elegida
    room.initBotAI(botSocket.id, difficulty);

    console.log(`[SIMULADOR] Partida iniciada: ${cleanUser} vs ${botName} en sala ${botRoomCode}`);
  });

  // Ejecución de comando en terminal
  socket.on('send_command', ({ command }) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) {
      socket.emit('command_result', { output: 'No estás asignado a ninguna sala activa.' });
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('command_result', { output: 'Sala no encontrada o cerrada.' });
      return;
    }

    const res = room.handleCommand(socket.id, command);
    if (res && res.output !== null) {
      socket.emit('command_result', {
        output: res.output,
        newPath: res.newPath,
        remoteConnected: res.remoteConnected,
        targetIp: res.targetIp
      });
    }
  });

  // Solicitar revancha / reinicio de partida
  socket.on('request_rematch', () => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const oldRoom = rooms.get(roomId);
    if (!oldRoom) return;

    // Reiniciar la sala para los dos jugadores
    const playersList = Array.from(oldRoom.players.values());
    if (playersList.length === 2) {
      const p1 = playersList[0];
      const p2 = playersList[1];
      
      const newRoom = new GameRoom(roomId, { socket: p1.socket, username: p1.username });
      newRoom.addPlayer(p2.socket, p2.username);
      rooms.set(roomId, newRoom);

      console.log(`[REVANCHA] Sala ${roomId} reiniciada para ${p1.username} vs ${p2.username}`);
    }
  });

  // Salir de la sala / Cancelar emparejamiento o abandonar partida
  socket.on('leave_game', () => {
    const roomId = socketToRoom.get(socket.id);
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        room.removePlayer(socket.id);
        if (room.players.size === 0) {
          rooms.delete(roomId);
          console.log(`[SALA] Sala ${roomId} eliminada tras salida voluntaria de ${socket.id}`);
        }
      }
      socketToRoom.delete(socket.id);
      socket.leave(roomId);
    }
    socket.emit('game_left');
  });

  // Desconexión
  socket.on('disconnect', () => {
    const roomId = socketToRoom.get(socket.id);
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        room.removePlayer(socket.id);
        if (room.players.size === 0) {
          rooms.delete(roomId);
          console.log(`[SALA] Sala ${roomId} vacía. Eliminada.`);
        }
      }
      socketToRoom.delete(socket.id);
    }
    console.log(`[-] Desconexión de cliente: ${socket.id}`);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                      HACKWARS - SERVIDOR AUTORITATIVO                     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  [+] Servidor escuchando en:                                              ║
║      • Local:   http://localhost:${PORT}                                     ║
║      • Red LAN: http://${LAN_IP}:${PORT}                                  ║
║                                                                           ║
║  [+] Para jugar 1v1 en tu red local:                                      ║
║      1. Jugador 1 abre http://localhost:${PORT} o la IP LAN en su navegador   ║
║      2. Jugador 2 abre http://${LAN_IP}:${PORT} desde su propia PC/Laptop ║
║      3. Compartan el código de sala o hagan click en "Búsqueda Rápida"    ║
║                                                                           ║
║  [+] Seguridad: 100% virtualizado en memoria. Zero llamadas al host OS.   ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);
});
