const { screen } = require('electron');
const { execFile } = require('child_process');
const path = require('path');
const { sendShellCommand, takeScreenshot } = require('./adb');

let tapInterval;
let scrollInterval;

function runTapper({ x, y, delay = 4000 }) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  x = x ?? width / 2 + Math.floor(Math.random() * 400);
  y = y ?? (height + 100) / 2 + Math.floor(Math.random() * 400);

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

function runLeftScroll({ delay = 4000 }) {
  scrollInterval = setInterval(() => {
    const startX = 1000 + Math.floor(Math.random() * 20); // right side
    const endX = 200 + Math.floor(Math.random() * 20);    // left side
    const y = 1000 + Math.floor(Math.random() * 20);
    const duration = 100 + Math.floor(Math.random() * 100);
    sendShellCommand(`input swipe ${startX} ${y} ${endX} ${y} ${duration}`);
  }, delay);
}

function runRightScroll({ delay = 4000 }) {
  scrollInterval = setInterval(() => {
    const startX = 200 + Math.floor(Math.random() * 20); // left side
    const endX = 1000 + Math.floor(Math.random() * 20); // right side
    const y = 1000 + Math.floor(Math.random() * 20);
    const duration = 100 + Math.floor(Math.random() * 100);
    sendShellCommand(`input swipe ${startX} ${y} ${endX} ${y} ${duration}`);
  }, delay);
}

let tapScrollActive = false;

function runTapAndScroll({ minDelay = 2500, maxDelay = 4000 }) {
  tapScrollActive = true;

  const loop = async () => {
    if (!tapScrollActive) return;

    // Randomly decide tap or scroll
    const action = Math.random();

    if (action < 0.4) {
      // 40% chance - tap
      const { width, height } = screen.getPrimaryDisplay().workAreaSize;
      const x = width / 2 + Math.floor(Math.random() * 400);
      const y = (height + 100) / 2 + Math.floor(Math.random() * 400);
      sendShellCommand(`input tap ${x} ${y}`);
      // console.log(`Tapped at ${x}, ${y}`);
    } else if (action < 0.7) {
      // 30% chance - scroll left
      const startX = 1000 + Math.floor(Math.random() * 20);
      const endX = 200 + Math.floor(Math.random() * 20);
      const y = 1000 + Math.floor(Math.random() * 20);
      const duration = 100 + Math.floor(Math.random() * 100);
      sendShellCommand(`input swipe ${startX} ${y} ${endX} ${y} ${duration}`);
      // console.log('Scrolled left');
    } else {
      // 30% chance - scroll right
      const startX = 200 + Math.floor(Math.random() * 20);
      const endX = 1000 + Math.floor(Math.random() * 20);
      const y = 1000 + Math.floor(Math.random() * 20);
      const duration = 100 + Math.floor(Math.random() * 100);
      sendShellCommand(`input swipe ${startX} ${y} ${endX} ${y} ${duration}`);
      // console.log('Scrolled right');  
    }

    // Wait random delay before next action
    const delay = minDelay + Math.floor(Math.random() * (maxDelay - minDelay));
    setTimeout(loop, delay);
  };

  if (tapScrollActive) {
    loop();
  }
}

function stopAutomation() {
  tapScrollActive = false;
  clearInterval(tapInterval);
  clearInterval(scrollInterval);
}

async function checkAd() {
  try {
    const screenshotPath = await takeScreenshot();

    if (!screenshotPath) {
      return false;
    };

    const pythonPath = path.join(__dirname, '..', 'snappy-venv', 'bin', 'python');
    const scriptPath = path.join(__dirname, '..', 'scripts', 'detect_ad.py');
    
    return new Promise((resolve, reject) => {
      execFile(pythonPath, [scriptPath, screenshotPath], (error, stdout, stderr) => {
        if (error) {
          console.error('Python script error:', stderr || error.message);
          return resolve(false);
        }

        // console.log('📄 Python output:', stdout);

        if (stdout.includes("Detected as Ad")) {
          resolve(true);
        } else if (stdout.includes("No Ad Detected")) {
          resolve(false);
        } else {
          reject('Unexpected output from Python');
        }
      });
    });
  } catch (err) {
    console.error('Error on checkAd:', err);
    return false;
  }
}

module.exports = { runTapper, runScroller, runLeftScroll, runRightScroll, runTapAndScroll, stopAutomation, checkAd };
