const { screen, app } = require('electron');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const { sendShellCommand, takeScreenshot } = require('./adb');
const os = require('os');
const homeDir = os.homedir();

const appPath = app.isPackaged
  ? path.join(process.resourcesPath, 'app.asar.unpacked')
  : path.join(__dirname, '..');

const assetsPath = app.isPackaged
  ? path.join(process.resourcesPath, 'app.asar.unpacked', 'assets')
  : path.join(__dirname, '..', 'assets');

let tapInterval;
let scrollInterval;

function runTapper({ x, y, delay = 3000 }) {
  stopAutomation();

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  x = x ?? Math.floor(width / 2) + Math.floor(Math.random() * 200 - 100);
  y = y ?? Math.floor(height / 2) + Math.floor(Math.random() * 200 - 100);

  // console.log(`🖱️ Tapping at (${x}, ${y}) every ${delay}ms`);

  tapInterval = setInterval(() => {
    sendShellCommand(`input tap ${x} ${y}`);
  }, delay);
}

function runScroller({ direction = 'down', delay = 1500 }) {
  stopAutomation();
  
  const swipe = direction === 'down' ? '500 1500 500 800' : '500 800 500 1500';
  scrollInterval = setInterval(() => {
    sendShellCommand(`input swipe ${swipe}`);
  }, delay);
}

function runLeftScroll({ delay = 4000 }) {
  stopAutomation();
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  scrollInterval = setInterval(() => {
    const swipeWidth = 400;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);

    const startX = centerX + Math.floor(swipeWidth / 2) + Math.floor(Math.random() * 20 - 10);
    const endX = centerX - Math.floor(swipeWidth / 2) + Math.floor(Math.random() * 20 - 10);
    const y = centerY + Math.floor(Math.random() * 20);

    const duration = 100 + Math.floor(Math.random() * 100);
    console.log(`Swipe from (${startX}, ${y}) to (${endX}, ${y}) duration=${duration}`);
    sendShellCommand(`input swipe ${startX} ${y} ${endX} ${y} ${duration}`);
  }, delay);
}

function runRightScroll({ delay = 4000 }) {
  stopAutomation();

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  scrollInterval = setInterval(() => {
    const swipeWidth = 400;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);

    const startX = centerX - Math.floor(swipeWidth / 2) + Math.floor(Math.random() * 20 - 10);
    const endX = centerX + Math.floor(swipeWidth / 2) + Math.floor(Math.random() * 20 - 10);
    const y = centerY + Math.floor(Math.random() * 20);

    const duration = 100 + Math.floor(Math.random() * 100);
    console.log(`Swipe from (${startX}, ${y}) to (${endX}, ${y}) duration=${duration}`);
    sendShellCommand(`input swipe ${startX} ${y} ${endX} ${y} ${duration}`);
  }, delay);
}

let tapScrollActive = false;

function runTapAndScroll({ minDelay = 3500, maxDelay = 4000 }) {
  stopAutomation();

  tapScrollActive = true;

  const loop = async () => {
    if (!tapScrollActive) return;

    // Randomly decide tap or scroll
    const action = Math.random();

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    if (action < 0.4) {
      // 40% chance - tap
      const x = width / 2 + Math.floor(Math.random() * 400);
      const y = (height + 100) / 2 + Math.floor(Math.random() * 400);
      sendShellCommand(`input tap ${x} ${y}`);
      // console.log(`Tapped at ${x}, ${y}`);
    } else if (action < 0.7) {
      // 30% chance - scroll left
      const swipeWidth = 400;
      const centerX = Math.floor(width / 2);
      const centerY = Math.floor(height / 2);
  
      const startX = centerX - Math.floor(swipeWidth / 2) + Math.floor(Math.random() * 20 - 10);
      const endX = centerX + Math.floor(swipeWidth / 2) + Math.floor(Math.random() * 20 - 10);
      const y = centerY + Math.floor(Math.random() * 20);
  
      const duration = 100 + Math.floor(Math.random() * 100);
      console.log(`Swipe from (${startX}, ${y}) to (${endX}, ${y}) duration=${duration}`);
      sendShellCommand(`input swipe ${startX} ${y} ${endX} ${y} ${duration}`);
      // console.log('Scrolled left');
    } else {
      // 30% chance - scroll right
      const swipeWidth = 400;
      const centerX = Math.floor(width / 2);
      const centerY = Math.floor(height / 2);

      const startX = centerX + Math.floor(swipeWidth / 2) + Math.floor(Math.random() * 20 - 10);
      const endX = centerX - Math.floor(swipeWidth / 2) + Math.floor(Math.random() * 20 - 10);
      const y = centerY + Math.floor(Math.random() * 20);

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
  let screenshotPath;

  try {
    screenshotPath = await takeScreenshot();

    if (!screenshotPath) {
      return false;
    };

    const pythonPath = path.join(homeDir, 'Downloads', 'Snappy', 'snappy-venv', 'bin', 'python');
    const scriptPath = path.join(appPath, 'scripts', 'detect_ad.py');
    
    return new Promise((resolve, reject) => {
      execFile(pythonPath, [scriptPath, screenshotPath, assetsPath], (error, stdout, stderr) => {
        try {
          fs.unlinkSync(screenshotPath);
        } catch (unlinkErr) {
          console.warn(`⚠️ Failed to delete screenshot: ${unlinkErr.message}`);
        }

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

    if (screenshotPath) {
      try {
        fs.unlinkSync(screenshotPath);
      } catch (e) {
        console.warn(`⚠️ Failed to delete screenshot in error block: ${e.message}`);
      }
    }
    
    return false;
  }
}

module.exports = { runTapper, runScroller, runLeftScroll, runRightScroll, runTapAndScroll, stopAutomation, checkAd };
