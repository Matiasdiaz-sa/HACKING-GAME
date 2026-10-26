const { io } = require('socket.io-client');

async function testDefense() {
  console.log('--- TEST HACKWARS LAN DEFENSE & KERNEL PANIC ---');

  const p1 = io('http://localhost:3000');
  const p2 = io('http://localhost:3000');

  let p1Ip, p2Ip;

  await new Promise((resolve) => {
    p1.emit('join_game', { username: 'Attacker', roomCode: 'DEFENSE' });
    p2.emit('join_game', { username: 'Defender', roomCode: 'DEFENSE' });

    let ready = 0;
    p1.on('match_started', (d) => { p1Ip = d.myIp; if (++ready === 2) resolve(); });
    p2.on('match_started', (d) => { p2Ip = d.myIp; if (++ready === 2) resolve(); });
  });

  // 1. Probar firewall en P2
  console.log('\n--- Defender cierra puerto 80 con firewall ---');
  await new Promise((resolve) => {
    p2.emit('send_command', { command: 'firewall 80 close' });
    p2.once('command_result', (d) => {
      console.log('Defender firewall result:', d.output.trim());
      resolve();
    });
  });

  // 2. Verificar que puerto 80 está cerrado para Attacker
  console.log('\n--- Attacker intenta probe en puerto 80 cerrado ---');
  await new Promise((resolve) => {
    p1.emit('send_command', { command: `probe ${p2Ip} 80` });
    p1.once('task_complete', (d) => {
      console.log('Attacker probe result:', d.output.trim());
      resolve();
    });
  });

  // 3. Attacker explota puerto 22 (SSH)
  console.log('\n--- Attacker explota puerto 22 ---');
  await new Promise((resolve) => {
    p1.emit('send_command', { command: `exploit ${p2Ip} 22 LIBSSH_AUTH_BYPASS` });
    p1.once('task_complete', (d) => {
      console.log('Attacker exploit 22 result:', d.output.trim());
      resolve();
    });
  });

  // 4. Attacker se conecta y elimina /boot/kernel.sys
  console.log('\n--- Attacker se conecta y borra /boot/kernel.sys ---');
  await new Promise((resolve) => {
    p1.emit('send_command', { command: `connect ${p2Ip}` });
    p1.once('command_result', () => {
      // Ahora borra el kernel
      p1.emit('send_command', { command: 'rm /boot/kernel.sys' });
    });

    p1.on('game_over', (d) => {
      console.log('  [+] GAME OVER POR DESTRUCCIÓN DE KERNEL!');
      console.log('      Ganador:', d.winner);
      console.log('      Razón:', d.reason);
      resolve();
    });
  });

  console.log('\n>>> ¡TEST DE DEFENSA Y KERNEL PANIC COMPLETADO CON ÉXITO! <<<');
  p1.disconnect();
  p2.disconnect();
  process.exit(0);
}

testDefense().catch(console.error);
