const { io } = require('socket.io-client');

async function testTrolling() {
  console.log('--- TEST HACKWARS LAN TROLLING & DEFACE VICTORY ---');

  const p1 = io('http://localhost:3000');
  const p2 = io('http://localhost:3000');

  let p1Ip, p2Ip;

  await new Promise((resolve) => {
    p1.emit('join_game', { username: 'HackerPro', roomCode: 'TROLL' });
    p2.emit('join_game', { username: 'VictimUser', roomCode: 'TROLL' });

    let ready = 0;
    p1.on('match_started', (d) => { p1Ip = d.myIp; if (++ready === 2) resolve(); });
    p2.on('match_started', (d) => { p2Ip = d.myIp; if (++ready === 2) resolve(); });
  });

  // 1. Exploit port 21
  console.log('\n--- HackerPro explota puerto 21 de VictimUser ---');
  await new Promise((resolve) => {
    p1.emit('send_command', { command: `exploit ${p2Ip} 21 VSFTPD_234_ROOT` });
    p1.once('task_complete', (d) => {
      console.log('Exploit resultado:', d.output.trim());
      resolve();
    });
  });

  // 2. Probar envío de popup
  console.log('\n--- HackerPro envía popup a la pantalla de VictimUser ---');
  await new Promise((resolve) => {
    p2.once('victim_popup', (d) => {
      console.log('  [+] VictimUser recibió popup en pantalla!');
      console.log('      Mensaje:', d.message);
      console.log('      De:', d.from);
      resolve();
    });
    p1.emit('send_command', { command: `popup ${p2Ip} ¡CUIDADO! Tu pantalla fue tomada por HackerPro` });
  });

  // 3. Probar freeze
  console.log('\n--- HackerPro congela la consola de VictimUser ---');
  await new Promise((resolve) => {
    p2.once('victim_freeze', (d) => {
      console.log('  [+] VictimUser recibió freeze! Duración:', d.duration, 'ms');
      resolve();
    });
    p1.emit('send_command', { command: `freeze ${p2Ip}` });
  });

  // 4. Probar glitch
  console.log('\n--- HackerPro activa glitch visual en VictimUser ---');
  await new Promise((resolve) => {
    p2.once('victim_glitch', (d) => {
      console.log('  [+] VictimUser recibió glitch visual! Duración:', d.duration, 'ms');
      resolve();
    });
    p1.emit('send_command', { command: `glitch ${p2Ip}` });
  });

  // 5. Probar invert
  console.log('\n--- HackerPro invierte la pantalla de VictimUser ---');
  await new Promise((resolve) => {
    p2.once('victim_invert', (d) => {
      console.log('  [+] VictimUser recibió rotación 180° e inversión de video!');
      resolve();
    });
    p1.emit('send_command', { command: `invert ${p2Ip}` });
  });

  // 6. Probar chaos
  console.log('\n--- HackerPro activa caos de mouse en VictimUser ---');
  await new Promise((resolve) => {
    p2.once('victim_chaos', (d) => {
      console.log('  [+] VictimUser recibió caos de punteros de mouse!');
      resolve();
    });
    p1.emit('send_command', { command: `chaos ${p2Ip}` });
  });

  // 7. Probar say
  console.log('\n--- HackerPro escribe directamente en la terminal de VictimUser ---');
  await new Promise((resolve) => {
    p2.once('victim_message', (d) => {
      console.log('  [+] VictimUser recibió mensaje en su consola:', d.message);
      resolve();
    });
    p1.emit('send_command', { command: `say ${p2Ip} Estoy dentro de tu PC amigo :)` });
  });

  // 8. Connect y Victoria por escribir "GANE" en su consola
  console.log('\n--- HackerPro se conecta por shell remota y escribe "gane" ---');
  await new Promise((resolve) => {
    p1.emit('send_command', { command: `connect ${p2Ip}` });
    p1.once('command_result', () => {
      console.log('Conectado a la shell remota. Ahora enviando comando "gane"...');
      p1.emit('send_command', { command: 'gane' });
    });

    p1.on('game_over', (d) => {
      console.log('  [+] GAME OVER POR DEFACEMENT TOTAL!');
      console.log('      Ganador:', d.winner);
      console.log('      Razón:', d.reason);
      resolve();
    });
  });

  console.log('\n>>> ¡TEST DE TROLLING Y VICTORIA POR GANE COMPLETADO CON ÉXITO! <<<');
  p1.disconnect();
  p2.disconnect();
  process.exit(0);
}

testTrolling().catch(console.error);
