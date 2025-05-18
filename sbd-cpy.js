const adb = require('adbkit');
const { screen } = require('electron');
const client = adb.createClient({ host: '127.0.0.1', port: 5037 });

let tapInterval = null;
let scrollInterval = null;

async function getDeviceId() {
  const devices = await client.listDevices();
  if (!devices.length) throw new Error('No connected devices');
  return devices[0].id;
}

async function sendShellCommand(cmd) {
  const deviceId = await getDeviceId();
  await client.shell(deviceId, cmd);
}

function runTapper({ x, y, delay = 1000 }) {
  if (!x || !y) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    x = width / 2;
    y = height / 2;
  }

  tapInterval = setInterval(() => {
    sendShellCommand(`input tap ${x} ${y}`);
  }, delay);
}

function runScroller({ direction = 'down', delay = 1500 }) {
  const swipe = direction === 'down' ? '500 1500 500 800' : '500 800 500 1500';
  scrollInterval = setInterval(() => {
    sendShellCommand(`input swipe ${swipe}`);
  }, delay);
}

function runLeftScroll({ delay = 2500 }) {
  scrollInterval = setInterval(() => {
    console.log('running left scroll');
    const startX = 1000 + Math.floor(Math.random() * 20); // right side
    const endX = 200 + Math.floor(Math.random() * 20);    // left side
    const y = 1000 + Math.floor(Math.random() * 20);
    const duration = 200 + Math.floor(Math.random() * 100); // 300–400ms
    sendShellCommand(`input swipe ${startX} ${y} ${endX} ${y} ${duration}`);
  }, delay);
}

function runRightScroll({ delay = 2500 }) {
  scrollInterval = setInterval(() => {
    console.log('running right scroll');
    const startX = 200 + Math.floor(Math.random() * 20); // left side
    const endX = 1000 + Math.floor(Math.random() * 20); // right side
    const y = 1000 + Math.floor(Math.random() * 20);
    const duration = 200 + Math.floor(Math.random() * 100); // 300–400ms
    sendShellCommand(`input swipe ${startX} ${y} ${endX} ${y} ${duration}`);
  }, delay);
}

function runTapAndScroll(config) {
  runTapper(config);
  runScroller(config);
}
let tapScrollActive = false;

function runTapAndScroll({ minDelay = 1200, maxDelay = 2500 }) {
  tapScrollActive = true;

  const loop = async () => {
    if (!tapScrollActive) return;

    // Randomly decide tap or scroll
    const action = Math.random();

    if (action < 0.4) {
      // 40% chance - tap
      const x = 500 + Math.floor(Math.random() * 400); // Random X within screen
      const y = 800 + Math.floor(Math.random() * 400); // Random Y
      sendShellCommand(`input tap ${x} ${y}`);
      console.log(`Tapped at ${x}, ${y}`);
    } else if (action < 0.7) {
      // 30% chance - scroll left
      const startX = 1000 + Math.floor(Math.random() * 30);
      const endX = 200 + Math.floor(Math.random() * 30);
      const y = 1000 + Math.floor(Math.random() * 20);
      const duration = 300 + Math.floor(Math.random() * 150);
      sendShellCommand(`input swipe ${startX} ${y} ${endX} ${y} ${duration}`);
      console.log('Scrolled left');
    } else {
      // 30% chance - scroll right
      const startX = 200 + Math.floor(Math.random() * 30);
      const endX = 1000 + Math.floor(Math.random() * 30);
      const y = 1000 + Math.floor(Math.random() * 20);
      const duration = 300 + Math.floor(Math.random() * 150);
      sendShellCommand(`input swipe ${startX} ${y} ${endX} ${y} ${duration}`);
      console.log('Scrolled right');
    }

    // Wait random delay before next action
    const delay = minDelay + Math.floor(Math.random() * (maxDelay - minDelay));
    setTimeout(loop, delay);
  };

  loop();
}

function stopTapAndScroll() {
  tapScrollActive = false;
}

function stopAutomation() {
  console.log('stopping automation');
  clearInterval(tapInterval);
  clearInterval(scrollInterval);
}

module.exports = { runTapper, runScroller, runLeftScroll, runRightScroll, runTapAndScroll, stopAutomation };
