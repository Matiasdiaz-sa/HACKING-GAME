# HackWars // Cyber Combat Simulator & EdTech Platform 🕹️💻

> **Simulador táctico multijugador de combate cibernético en terminal web interactiva.**  
> Entorno **100% virtualizado en memoria**, seguro, ligero y diseñado tanto para el entretenimiento competitivo como para la enseñanza lúdica de ciberseguridad, redes y administración de sistemas Linux.

---

## ⚡ Índice
1. [Visión General y Propuesta de Valor](#-visión-general-y-propuesta-de-valor)
2. [Arquitectura Técnica](#-arquitectura-técnica)
3. [¿Por qué NO Netlify? Opciones de Hosting Gratuito en la Nube](#-dónde-hostear-gratis-por-qué-no-netlify)
4. [Guía Maestra: Paso a Paso para Desplegar la Aplicación Online (Render.com)](#-guía-maestra-paso-a-paso-para-desplegar-la-aplicación-online-rendercom)
5. [Guía de Ejecución Local (LAN)](#-ejecución-local-y-juego-en-red-lan)
6. [Manual Completo de Comandos](#-manual-completo-de-comandos)
7. [Cercanía con la Realidad (Fidelidad Técnica)](#-cercanía-con-la-realidad-y-fundamentos-técnicos)
8. [Sistema de Gamificación Adictiva: Bytecoins, Black Market & Leaderboard](#-sistema-de-gamificación-adictiva-bytecoins-black-market--leaderboard)
9. [Modelo de Negocio y Oportunidades de Monetización](#-modelo-de-negocio-y-oportunidades-de-monetización)
10. [Estrategia de Marketing & Crecimiento Viral](#-estrategia-de-marketing--crecimiento-viral)
11. [Automatización del Marketing (Marketing Automation & AI Bots)](#-automatización-del-marketing-marketing-automation--ai-bots)
12. [Roadmap de Expansión](#-roadmap-de-expansión)

---

## 👁️ Visión General y Propuesta de Valor

HackWars nace de una oportunidad única en la intersección entre el **gaming casual** y la **educación en ciberseguridad (EdTech)**:

* **Las plataformas actuales (TryHackMe, HackTheBox):** Son excelentes pero complejas, lentas de iniciar, requieren configurar VPNs y no ofrecen combate PvP en tiempo real con partidas rápidas.
* **Los juegos offline (Hacknet, Uplink):** Son para un solo jugador y requieren descargas en Steam de varios gigabytes.
* **HackWars:** Es accesible desde **cualquier navegador web sin instalar nada**, inicia en 3 segundos, utiliza comandos reales de Linux y redes, y añade una capa de **adrenalina y trolling psicológico** (invertir la pantalla del rival, congelar su consola, inyectar alarmas sonoras) mientras se compite en una subred virtualizada.

---

## 🛠️ Arquitectura Técnica

* **Backend:** Node.js + Express + Socket.IO.
* **Frontend:** HTML5 semántico, CSS3 modular puro (acelerado por GPU, tema CRT retro-futurista) y Vanilla JavaScript.
* **Audio:** Síntesis sonora procedimental con la Web Audio API (cero descarga de archivos MP3, latencia ultra baja).
* **Virtualización Segura en Memoria:**
  * Cada jugador recibe un objeto `VirtualMachine` aislado en RAM.
  * Subred virtual privada (`10.13.37.0/24`) con soporte para múltiples nodos simultáneos.
  * **Cero llamadas al sistema operativo anfitrión:** No se ejecutan comandos en el servidor host, lo que garantiza seguridad absoluta contra inyecciones reales de comandos.

---

## 🌐 ¿Dónde Hostear Gratis? ¿Por qué NO Netlify?

> [!WARNING]  
> **¿Por qué Netlify no funciona para este proyecto?**  
> Netlify está diseñado exclusivamente para **sitios web estáticos** (HTML/CSS/JS del cliente) o **funciones Serverless** que se apagan tras pocos segundos.  
> HackWars requiere un servidor Node.js corriendo continuamente con **conexiones WebSocket bidireccionales y persistentes (Socket.IO)** para coordinar las terminales y mantener el estado de las máquinas virtuales en memoria.

### Plataformas Gratuitas Ideales para HackWars:

| Plataforma | Soporte WebSockets | Plan Gratuito | Configuración |
| :--- | :--- | :--- | :--- |
| **Render.com** (Recomendado) | ✅ Excelente | ✅ Sí (Web Service gratuito) | Conectar repositorio de GitHub y presiona Deploy. |
| **Railway.app** | ✅ Excelente | ✅ Crédito inicial gratis | Despliegue automático de Node.js. |
| **Fly.io** | ✅ Excelente | ✅ Tier gratuito generoso | Muy baja latencia global. |
| **Glitch.com** | ✅ Bueno | ✅ Sí | Permite editar código en vivo en el navegador. |

---

## 🚀 Guía Maestra: Paso a Paso para Desplegar la Aplicación Online (Render.com)

Sigue estos pasos en tu computadora para pasar de ejecutar el juego en local a tenerlo **online 24/7 en internet, con enlace HTTPS seguro y gratuito**:

### Paso 1: Subir el Proyecto a GitHub
1. Abre tu terminal o PowerShell en la carpeta del proyecto (`c:\Users\...\Juego hacking`).
2. Verifica que el archivo `.gitignore` esté presente (evita subir la carpeta pesada `node_modules/`).
3. Inicializa el repositorio y haz tu primer commit:
   ```bash
   git init
   git add .
   git commit -m "feat: HackWars LAN & Online v1.0"
   git branch -M main
   ```
4. Entra a tu cuenta en [GitHub.com](https://github.com), crea un nuevo repositorio llamado `hackwars` (público o privado).
5. Vincula el repositorio remoto y sube tu código:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/hackwars.git
   git push -u origin main
   ```

### Paso 2: Crear el Web Service en Render.com (100% Gratis)
1. Entra en **[Render.com](https://render.com)** y regístrate gratis (recomendado: inicia sesión con tu cuenta de GitHub).
2. En el panel principal, haz clic en el botón azul superior **"New +"** y selecciona **"Web Service"**.
3. Selecciona la opción **"Build and deploy from a Git repository"** y haz clic en **Next**.
4. Busca tu repositorio `hackwars` en la lista y presiona **"Connect"**.

### Paso 3: Configurar el Servicio de Node.js
Rellena el formulario con los siguientes valores exactos:
* **Name:** `hackwars` (determina tu URL gratuita: `hackwars.onrender.com`).
* **Region:** La más cercana a tu país (ej. `Frankfurt` para Europa o `Ohio / Oregon` para América).
* **Branch:** `main`.
* **Runtime:** `Node`.
* **Build Command:** `npm install`
* **Start Command:** `node server/server.js`
* **Instance Type:** Selecciona **"Free"** ($0 / mes).

### Paso 4: Desplegar y Obtener la URL Pública
1. Haz clic abajo en el botón **"Create Web Service"**.
2. Render comenzará a instalar las dependencias y mostrará la consola de compilación en vivo.
3. En aproximadamente 1 o 2 minutos verás el mensaje:
   ```
   ==> Your service is live 🎉
   ```
4. En la parte superior izquierda del panel verás tu enlace público con candado SSL verde:
   ```
   https://hackwars.onrender.com
   ```

### Paso 5: Probar y Compartir
* Abre esa URL desde tu celular y desde tu PC al mismo tiempo.
* Verás que la caja de red del lobby detecta automáticamente que estás en la nube y genera el enlace público `https://hackwars.onrender.com` listo para copiar y desafiar a cualquier persona en el mundo sin importar qué red use.

> 💡 **Actualizaciones automáticas (CI/CD):** Cada vez que hagas un cambio en tu código en casa y ejecutes `git push origin main`, Render detectará el cambio y actualizará el juego online automáticamente en menos de 60 segundos.

---

## 🕹️ Ejecución Local y Juego en Red LAN

### 1. Iniciar el Servidor Local
```bash
npm install
npm start
```
*(O directamente `node server/server.js`)*

El servidor se vinculará a `0.0.0.0:3000` y mostrará:
* **Acceso Local:** `http://localhost:3000`
* **Acceso en Red LAN:** `http://<TU_IP_LOCAL>:3000` (Ejemplo: `http://172.17.3.124:3000`)

### 2. Duelo en Red LAN (Mismo Wi-Fi / Router)
1. **Jugador 1:** Abre `http://localhost:3000` en su navegador y copia el enlace LAN provisto en el lobby.
2. **Jugador 2:** Abre ese mismo enlace desde su computadora o laptop conectada a la misma red.
3. Comparten el código de 4 caracteres o hacen clic en **"EMPAREJAMIENTO RÁPIDO"** para conectarse al instante.

---

## 📜 Manual Completo de Comandos

### 🗡️ 1. Reconocimiento & Ofensiva
| Comando | Parámetros | Descripción | Duración / Costo |
| :--- | :--- | :--- | :--- |
| `help` / `ayuda` | - | Muestra el manual de comandos interactivo. | Inmediato |
| `ifconfig` / `ip` | - | Muestra tu IP Virtual (`eth0`), hostname y estado de puertos locales. | Inmediato |
| `netdiscover` | - | Escanea la subred virtual `10.13.37.0/24` para hallar al rival. | 3 segundos |
| `nmap` | `<target_ip>` | Escaneo SYN Stealth de puertos abiertos del objetivo. | 4 segundos |
| `probe` | `<target_ip> <puerto>` | Inspecciona versión, vulnerabilidad y obtiene el payload requerido. | 3 segundos |
| `exploit` | `<ip> <puerto> <payload>` | Inyecta exploit y compromete el servicio remoto. | 8s (40% CPU) |
| `connect` | `<target_ip>` | Inicia sesión de shell remota interactiva como `root`. | Inmediato |
| `submit` | `<flag_hash>` | Entrega la bandera capturada del enemigo para ganar la partida. | Inmediato |

### 🎭 2. Troyanos & Trolling Psicológico (Requiere puerto comprometido o Shell remota)
| Comando | Alias | Descripción | Efecto en la Víctima |
| :--- | :--- | :--- | :--- |
| `popup <mensaje>` | `alert` | Proyecta un cartel de intrusión rojo con calavera. | Ventana emergente y alarma sonora |
| `freeze` | - | Congela la terminal del rival con candado por 4s. | Teclado bloqueado (no puede tipear) |
| `glitch` | - | Sacude y distorsiona el monitor del rival. | Interferencia CRT y distorsión de video |
| `invert` | `flip` | Gira e invierte la pantalla del rival 180° por 5s. | Monitor de cabeza y colores negativos |
| `chaos` | `mousechaos` | Desata un enjambre de 8 punteros fantasma. | Cursores falsos que interfieren con su mouse |
| `say <mensaje>` | `msg` | Escribe un mensaje intruso directamente en su consola. | Texto en rosa neón en su terminal |

### 🛡️ 3. Defensa, Procesos & Contramedidas
| Comando | Parámetros | Descripción | Impacto |
| :--- | :--- | :--- | :--- |
| `ps` | - | Lista procesos activos, uso de CPU y **ataques entrantes con su PID**. | Inmediato |
| `kill` | `<pid>` | Termina un proceso. **¡Matar un exploit entrante neutraliza el ataque rival!** | Libera CPU |
| `firewall` | `<puerto> <open\|close>` | Cierra o abre un puerto virtual (+25% CPU overhead, máx 2). **Cerrar el puerto expulsa de inmediato a un atacante conectado.** | Corta conexiones |
| `patch` | `<puerto>` | Repara un puerto comprometido y genera una nueva versión endurecida. | 6s (30% CPU) |
| `clearlogs` | - | Borra el registro `/var/log/syslog` local para reiniciar alertas o despistar. | Inmediato |

### 📂 4. Exploración de Archivos (Local y Remota)
| Comando | Descripción |
| :--- | :--- |
| `ls [ruta]` | Lista archivos y carpetas del directorio actual o especificado. |
| `cd <ruta>` | Cambia el directorio de trabajo (ej: `cd /home/admin`, `cd ..`, `cd ~`). |
| `cat <archivo>` | Imprime el contenido de un archivo (ej: `cat /home/admin/flag.txt`, `cat /var/log/syslog`). |
| `rm <archivo>` | Elimina un archivo del filesystem. |
| `exit` | Cierra la sesión remota y vuelve a tu nodo local de forma segura. |

### 🏆 5. Condiciones Oficiales de Victoria
1. **Captura de la Bandera (CTF):** Conectarse por shell remota, leer `/home/admin/flag.txt`, copiar el hash secreto (`FLAG-XXXXXXXXXXXXXXXX`), salir con `exit` y ejecutar `submit <hash>` en tu terminal local.
2. **Destrucción del Núcleo (Kernel Panic):** Conectarse por shell remota y ejecutar `rm /boot/kernel.sys`. El sistema operativo rival colapsa de forma fatal e irreversible.
3. **Defacement Oculto (Easter Egg):** Conectarse por shell remota y escribir `gane` (o `win`, `pwn`, `deface`) para tomar el control total y ganar por sorpresa.

### 🧪 6. Simulador de Efectos (Local para pruebas)
* `test`: Muestra el menú de simulación de efectos.
* `test freeze`: Simula el candado y congelamiento en pantalla propia.
* `test popup <msg>`: Prueba la ventana emergente roja de intrusión.
* `test glitch`: Prueba la sacudida y distorsión CRT en monitor.
* `test invert`: Prueba la rotación de pantalla 180°.
* `test chaos`: Prueba la invasión de punteros de mouse falsos.

### ⌨️ 7. Terminal y Atajos
* `clear` / `cls`: Limpia la pantalla de la terminal (o atajo <kbd>Ctrl + L</kbd>).
* <kbd>Tab</kbd>: Autocompleta comandos y rutas comunes de archivos.
* <kbd>↑</kbd> / <kbd>↓</kbd>: Navegación por historial de comandos ejecutados.

---

## 🎯 Cercanía con la Realidad y Fundamentos Técnicos

HackWars traslada conceptos auténticos de ciberseguridad a una dinámica ágil de videojuego (~80% de fidelidad conceptual):

1. **Ciclo de Intrusión Real:** Enseña la metodología de un ataque informático verídico:  
   **Reconocimiento (`netdiscover`) ➔ Escaneo (`nmap`) ➔ Enumeración/Banner Grabbing (`probe`) ➔ Explotación (`exploit`) ➔ Shell Interactiva (`connect`) ➔ Post-Explotación / Exfiltración (`cat flag.txt`)**.
2. **Vulnerabilidades Históricas (CVEs Auténticos):**
   * Puerto 21 (FTP): Basado en el **CVE-2011-2523** (puerta trasera real en vsftpd-2.3.4).
   * Puerto 80 (HTTP): Basado en el **CVE-2021-41773** (Apache CGI Path Traversal).
   * Puerto 22 (SSH): Basado en el **CVE-2018-10933** (Bypass de autenticación libssh).
3. **Estructura FHS de Linux:** Árbol de archivos real con `/boot`, `/etc/passwd`, `/var/log/syslog` y `/home/admin`.
4. **Defensa Activa (Blue Teaming):** Análisis de logs en `/var/log/syslog`, mitigación de incidentes con terminación de procesos (`kill PID`) y segmentación perimetral (`firewall`).

---

## 🎮 Sistema de Gamificación Adictiva: Bytecoins, Black Market & Leaderboard

Para convertir HackWars en un juego altamente adictivo y de alta retención diaria, el ecosistema cuenta con un sistema de recompensas, economía virtual y personalización cosmética (*"flexing"*):

### 1. Economía Virtual: `Bytecoins (฿)`
La moneda interna del juego que se gana exclusivamente jugando y compitiendo:
* **Victoria en Partida PvP:** `+100 ฿`
* **First Blood (Primer exploit exitoso):** `+30 ฿`
* **Destrucción de Kernel (`rm /boot/kernel.sys`):** `+75 ฿`
* **Captura de Bandera (CTF Submit):** `+50 ฿`
* **Defensa Exitosa (Matar exploit entrante con `kill PID`):** `+25 ฿`
* **Racha de Inicio de Sesión Diaria (Daily Streak):**
  * Día 1: `+20 ฿`
  * Día 3: `+60 ฿`
  * Día 7: `+200 ฿` + Caja de Botín Criptográfica con cosmético sorpresa.
* **Misiones y Contratos Diarios (Daily Bounties):**
  * *"Gana 2 partidas sin que te comprometan el puerto 22"* (`+150 ฿`).
  * *"Inyecta un troyano 'invert' o 'freeze' a 3 oponentes distintos"* (`+120 ฿`).
  * *"Destruye un kernel enemigo en menos de 90 segundos"* (`+250 ฿`).

---

### 2. La Tienda Negra Clandestina (*The Black Market*)
Los jugadores gastan sus Bytecoins para personalizar cada aspecto visual y sonoro de su terminal:

#### 🎨 Temas de Terminal y Shaders CRT
| Tema | Estilo Visual | Precio |
| :--- | :--- | :--- |
| **Matrix Phosphor** | Verde fósforo clásico de terminal monocromática (Por defecto). | **Gratis** |
| **Cyberpunk Night City** | Rosa neón brillante, azul cyan eléctrico y sombras moradas. | `500 ฿` |
| **Amber Retro 1982** | Ámbar cálido vintage tipo terminal VT100 de mainframe. | `350 ฿` |
| **Dracula Carbon** | Paleta moderna gris carbón con acentos violeta y turquesa. | `600 ฿` |
| **Blood Syndicate** | Rojo sangre hacker clandestino con brillo agresivo intermitente. | `850 ฿` |
| **Ghost Protocol** | Monocromático blanco puro minimalista con alto contraste. | `1,000 ฿` |

#### 🔊 Soundpacks de Teclados Mecánicos (Audio de Tecleo)
Cada pulsación de tecla reproduce el timbre acústico seleccionado:
* **Cherry MX Blue Clicky:** Clicks mecánicos audibles y ultra satisfactorios (`400 ฿`).
* **IBM Model M 1984:** Resortes mecánicos pesados y nostálgicos de los 80s (`500 ฿`).
* **Sci-Fi Beeper Terminal:** Tonos electrónicos sutiles de película de ciencia ficción (`450 ฿`).
* **Máquina de Escribir Antigua:** Martillazos metálicos con timbre de campana al presionar Enter (`650 ฿`).

#### 🏷️ Títulos de Hacker Dinámicos para el Prompt
El título se muestra en la terminal antes del nombre de usuario:
* `[Script Kiddie]` root@node:~# *(Nivel 1)*
* `[Packet Sniffer]` root@node:~# *(Nivel 5)*
* `[Cyber Mercenary]` root@node:~# *(Nivel 10)*
* `[Zero-Day God]` root@node:~# *(Nivel 25)*
* `[Kernel Slayer]` root@node:~# *(100 Kernels destruidos)*
* `[Ghost in the Shell]` root@node:~# *(Top 10 del Leaderboard)*

#### 💀 Animaciones de Victoria y Deface Personalizado (Kill-Cams)
Cuando derrotas a un oponente, su pantalla reproduce tu mensaje y animación exclusiva:
* **Lluvia de Código Matrix:** Tu alias cae en caracteres verdes ocupando todo su monitor.
* **Calavera Dorada 3D:** Una calavera rotatoria con alarma sonora personalizada.
* **Firma de Defacement:** Mensaje personalizado: *"Pwned by [TuAlias] // ZeroDay Syndicate"*.

---

### 3. Sistema de Rangos ELO & Leaderboards Globales

Un sistema competitivo estructurado por divisiones de almacenamiento de datos:
1. **Byte 0:** 0 a 999 ELO *(Principiantes)*
2. **Kilobyte:** 1,000 a 1,999 ELO
3. **Megabyte:** 2,000 a 3,499 ELO
4. **Gigabyte:** 3,500 a 4,999 ELO
5. **Terabyte:** 5,000 a 6,999 ELO
6. **Exabyte 1337:** Top 100 de los mejores hackers a nivel mundial.

#### Tablas de Clasificación (Leaderboards):
* **🏆 Ranking Semanal:** Se reinicia todos los domingos a medianoche; los 3 mejores reciben trofeos de perfil y una bolsa de `2,500 ฿`.
* **👑 Salón de la Fama (Hall of Fame):** Récord histórico de victorias acumuladas.
* **⚡ Speedrun CTF Leaderboard:** Récord oficial de la victoria más rápida registrada en el servidor (ej. récord: *26.4 segundos*).

---

## 💰 Modelo de Negocio y Oportunidades de Monetización

El nicho de la educación en ciberseguridad (EdTech) y simulación de ciberataques es uno de los de mayor crecimiento global:

### 1. B2B: Colegios, Universidades y Bootcamps (Mayor Rentabilidad)
* **Problema que resuelve:** Las instituciones necesitan enseñar redes y Linux de forma práctica, pero no pueden permitir que los alumnos rompan las computadoras del laboratorio ni tienen permisos de administrador para instalar herramientas reales.
* **Solución:** HackWars corre 100% en el navegador, no requiere instalación ni privilegios de administrador.
* **Modelo:** Licencia anual por institución o por aula ($200 a $800 USD/año) que incluye:
  * Panel del docente para crear salas privadas de examen.
  * Reportes automáticos con notas, tiempos de respuesta y banderas capturadas.

### 2. B2C: Modelo Freemium (TryHackMe Style)
* **Gratis:** Partidas multijugador públicas (1v1 y Free-For-All) para viralización en redes sociales.
* **Suscripción Premium ($5 a $10 USD/mes):**
  * Acceso al **Modo Academia** con cursos guiados paso a paso.
  * Retos y desafíos semanales exclusivos.
  * Certificado digital de finalización descargable para LinkedIn.

### 3. Competencias y Torneos (Gaming / E-Sports)
* Torneos virtuales organizados los fines de semana con entrada de bajo costo ($2 - $5 USD) o con patrocinio de empresas de hosting, academias o VPNs.

---

## 📢 Estrategia de Marketing & Crecimiento Viral

El marketing de HackWars aprovecha que el "hacking ético en terminal" y las "bromas/trolling" son temáticas con **altísimo potencial de viralidad orgánica ($0 de inversión publicitaria)**:

### 1. Formatos de Video Corto (TikTok, Reels, Shorts)
Clips de 15 a 30 segundos grabados en vertical (9:16) con estética synthwave:
* **El gancho "Hackeo en vivo":** Dos laptops contiguas. El atacante tipea `invert` o `freeze`; la laptop del amigo se rota 180° con candado rojo mientras se graba su reacción espontánea.
  * *Hook verbal:* *"Le di vuelta la pantalla a mi compañero con esta página web secreta..."*
* **El gancho "Páginas que parecen ilegales":** *"3 páginas web que deberías conocer si estudias informática o quieres aprender ciberseguridad sin ir a la cárcel."*
* **El gancho "Duelo CTF 1v1":** Pantalla dividida con cronómetro: *"Quién hackea a quién primero en 60 segundos"*.

### 2. Bucle Viral Integrado (Product-Led Growth - PLG)
El producto está diseñado para auto-propagarse sin intervención:
* **Invitación obligatoria para jugar:** No se puede jugar un duelo 1v1 solo; cada usuario nuevo debe compartir el enlace con al menos 1 amigo para iniciar la partida ($K-factor > 1$).
* **Enlace de reto directo:** URL con parámetro de sala pre-cargado (`https://hackwars.online/?join=AX79`) que abre la terminal en 1 clic.
* **Botón de reto por WhatsApp / Discord:** Mensaje pre-escrito en un clic: *"Te desafío a un duelo de ciberseguridad en vivo: [enlace]"*.
* **Tarjeta de Victoria descargable (Bragging Rights):** Imagen estilo credencial de agente secreto generada al ganar para compartir en Stories/X: *"Acabo de eliminar a @rival en 45s en HackWars"*.

### 3. Comunidades Técnicas y Foros
* **Reddit:** Publicar en `r/SideProject`, `r/webdev`, `r/cybersecurity`, `r/linux`, `r/devsarg`, `r/programacion`.
  * *Tono genuino:* *"Creé un simulador de combate de hacking 1v1 en terminal web en memoria para aprender redes y Linux jugando. Feedback bienvenido."*
* **Hacker News (Show HN):** Título directo: `Show HN: HackWars – A real-time terminal PvP cyber combat simulator in memory`.
* **Discords de Programación:** Canales `#showcase` de comunidades de creadores (Midudev, Fazt, MoureDev, etc.).

### 4. Prospección B2B Educativa (LinkedIn Outreach)
Contacto directo con profesores y directores de carreras de IT/Sistemas:
> *"Hola [Nombre], vi que coordinas la cátedra de Redes en [Universidad]. Desarrollé una herramienta web interactiva para que los alumnos practiquen comandos de Linux y auditoría de puertos en tiempo real de forma segura y gamificada, sin instalar nada ni arriesgar los equipos. Te comparto una demo gratuita para que la pruebes con tu clase si te parece útil."*

---

## 🤖 Automatización del Marketing (Marketing Automation & AI Bots)

Casi la totalidad del embudo de marketing puede automatizarse mediante herramientas y scripts desarrollados en el propio proyecto:

### 1. La "Fábrica Automática de Videos" (Node.js + Puppeteer)
Un script propio que genera contenido audiovisual 24/7 sin intervención humana:
1. **Simulación Headless:** Puppeteer levanta dos instancias virtuales de navegador en resolución vertical (1080x1920).
2. **Partida pre-programada:** Los bots ejecutan comandos dinámicos (`netdiscover`, `nmap`, `exploit`, `invert`, `popup`).
3. **Grabación de pantalla automática:** Captura el video en formato `.mp4` justo en los momentos clímax (cuando la pantalla se distorsiona con el glitch o se gira 180°).
4. **Superposición de texto con IA:** Añade automáticamente ganchos virales generados (*"Duelo #84: ¿Podrá defenderse del exploit?"*) y música de fondo.
5. **Resultado:** Generación de **10 a 20 videos listos al día** para alimentar las redes automáticamente.

### 2. Auto-Publicación Multicanal
* **Metricool / Buffer (Planes gratuitos):** Conexión con TikTok, Instagram Reels, YouTube Shorts, X y LinkedIn. Subes los videos generados en lote y la herramienta los programa en los horarios pico de mayor audiencia.
* **n8n / Make.com:** Webhook que conecta el servidor del juego con Discord y Twitter/X. Cada vez que termina una partida destacada, publica automáticamente:  
  *`"🔥 ¡Duelo finalizado! ZeroCool derrotó a Cipher en 52 segundos en HackWars. ¿Alguien se anima a retarlo? [link]"`*.

### 3. Prospección Automática B2B
* **Apollo.io:** Búsqueda filtrada de correos de docentes de informática y directores académicos.
* **Resend / Nodemailer:** Secuencia de correo electrónico personalizada que despacha 10 correos diarios invitándolos a probar la demo gratuita para su aula.

---

## 🗺️ Roadmap de Expansión

- [x] Motor de simulación en memoria y virtualización de puertos/procesos.
- [x] Terminal interactiva con emulación CRT, sonido Web Audio y foco inteligente.
- [x] Duelos 1v1 en red LAN con código de sala y emparejamiento rápido.
- [x] Suite de exploits psicológicos y trolling en vivo (`freeze`, `glitch`, `invert`, `popup`, `chaos`, `say`).
- [x] **Modo Academia Guiado (Fase 2):** 5 módulos progresivos con Cyber-Mentor interactivo en vivo, HUD de objetivos y recompensas en Bytecoins.
- [ ] **Modo Free-For-All (FFA):** Subred caótica de 4 a 12 jugadores simultáneos con radar de nodos.
- [ ] **Modo "King of the Hill":** Servidor central vulnerable (`10.13.37.254`) que otorga puntos por segundo retenido.
- [ ] **Sistema de Cuentas y Leaderboard Global:** Perfiles de hacker, rangos (*Script Kiddie* hasta *Elite 1337*) y cosméticos de terminal.
