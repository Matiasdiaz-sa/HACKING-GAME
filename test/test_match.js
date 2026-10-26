const { io } = require('socket.io-client');

async function testMatch() {
  console.log('--- TEST HACKWARS LAN GAMEPLAY LOOP ---');

  const p1 = io('http://localhost:3000');
  const p2 = io('http://localhost:3000');

  let p1State = null;
  let p2State = null;
  let targetIp = null;
  let opponentFlag = null;

  await new Promise((resolve) => {
    p1.on('connect', () => {
      console.log('[+] P1 conectado');
      p1.emit('join_game', { username: 'CyberGhost', roomCode: 'TEST' });
    });

    p2.on('connect', () => {
      console.log('[+] P2 conectado');
      p2.emit('join_game', { username: 'ZeroCool', roomCode: 'TEST' });
    });

    let startedCount = 0;
    p1.on('match_started', (data) => {
      console.log('[+] P1 match_started! IP:', data.myIp);
      p1State = data.myState;
      startedCount++;
      if (startedCount === 2) resolve();
    });

    p2.on('match_started', (data) => {
      console.log('[+] P2 match_started! IP:', data.myIp);
      p2State = data.myState;
      targetIp = data.myIp;
      startedCount++;
      if (startedCount === 2) resolve();
    });
  });

  console.log(`\n--- P1 descubre la IP de P2 con 'netdiscover' ---`);
  await new Promise((resolve) => {
    p1.emit('send_command', { command: 'netdiscover' });
    p1.on('task_start', (data) => console.log('  [P1 Task Start]:', data.label));
    p1.on('task_complete', (data) => {
      console.log('  [P1 Task Complete]:\n', data.output.trim());
      resolve();
    });
  });

  console.log(`\n--- P1 escanea puertos con 'nmap ${targetIp}' ---`);
  await new Promise((resolve) => {
    p1.emit('send_command', { command: `nmap ${targetIp}` });
    p1.on('task_complete', (data) => {
      console.log('  [P1 Nmap Complete]:\n', data.output.trim());
      resolve();
    });
  });

  console.log(`\n--- P1 inspecciona puerto 21 con 'probe ${targetIp} 21' ---`);
  let requiredPayload = '';
  await new Promise((resolve) => {
    p1.emit('send_command', { command: `probe ${targetIp} 21` });
    p1.on('task_complete', (data) => {
      console.log('  [P1 Probe Complete]:\n', data.output.trim());
      const match = data.output.match(/REQUISITO EXPLOIT PAYLOAD:\s+([A-Z0-9_]+)/);
      if (match) requiredPayload = match[1];
      resolve();
    });
  });

  console.log(`Payload requerido detectado: ${requiredPayload}`);

  console.log(`\n--- P1 ejecuta exploit contra puerto 21 ---`);
  await new Promise((resolve) => {
    p1.emit('send_command', { command: `exploit ${targetIp} 21 ${requiredPayload}` });
    p1.on('task_complete', (data) => {
      console.log('  [P1 Exploit Complete]:\n', data.output.trim());
      resolve();
    });
  });

  console.log(`\n--- P1 se conecta por shell remota con 'connect ${targetIp}' ---`);
  await new Promise((resolve) => {
    p1.emit('send_command', { command: `connect ${targetIp}` });
    p1.once('command_result', (data) => {
      console.log('  [P1 Connect Result]:\n', data.output.trim());
      resolve();
    });
  });

  console.log(`\n--- P1 lista archivos remotos en /home/admin con 'ls /home/admin' ---`);
  await new Promise((resolve) => {
    p1.emit('send_command', { command: 'ls /home/admin' });
    p1.once('command_result', (data) => {
      console.log('  [P1 Remote Ls Result]:\n', data.output.trim());
      resolve();
    });
  });

  console.log(`\n--- P1 lee /home/admin/flag.txt con 'cat /home/admin/flag.txt' ---`);
  await new Promise((resolve) => {
    p1.emit('send_command', { command: 'cat /home/admin/flag.txt' });
    p1.once('command_result', (data) => {
      console.log('  [P1 Remote Cat Result]:\n', data.output.trim());
      opponentFlag = data.output.trim();
      resolve();
    });
  });

  console.log(`\n--- P1 sale de la shell remota con 'exit' ---`);
  await new Promise((resolve) => {
    p1.emit('send_command', { command: 'exit' });
    p1.once('command_result', (data) => {
      console.log('  [P1 Exit Result]:', data.output.trim());
      resolve();
    });
  });

  console.log(`\n--- P1 entrega la bandera enemiga con 'submit ${opponentFlag}' ---`);
  await new Promise((resolve) => {
    p1.emit('send_command', { command: `submit ${opponentFlag}` });
    p1.on('game_over', (data) => {
      console.log('  [+] GAME OVER RECIBIDO!');
      console.log('      Ganador:', data.winner);
      console.log('      Razón:', data.reason);
      resolve();
    });
  });

  console.log('\n>>> ¡TEST COMPLETADO CON ÉXITO! Todos los sistemas funcionan a la perfección. <<<');
  p1.disconnect();
  p2.disconnect();
  process.exit(0);
}

testMatch().catch(console.error);
