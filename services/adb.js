const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const adb = require('adbkit');
const { delay } = require('../utils/helper');

const client = adb.createClient({ host: '127.0.0.1', port: 5037 });

const localDir = path.join(app.getPath('userData'), 'snapshots');

if (!fs.existsSync(localDir)) {
  fs.mkdirSync(localDir, { recursive: true });
}

async function getDeviceId() {
  const devices = await client.listDevices();

  if (!devices.length) return null;

  return devices[0].id;
}

async function checkDeviceConnected() {
  try {
    const devices = await client.listDevices();
    return devices.length > 0;
  } catch (err) {
    console.error('error on checkDeviceConnected: ', err);
    return false;
  }
}

async function getCurrentApp() {
  try {
    const deviceId = await getDeviceId();

    if (!deviceId) return null;

     // Try the newer method first: dumpsys window displays
     let outputDisplays = await client.shell(deviceId, 'dumpsys window displays');
     let resultDisplays = await adb.util.readAll(outputDisplays);
     let textDisplays = resultDisplays.toString();
     let matchDisplays = textDisplays.match(/mCurrentFocus=Window{.+? (.+?)\/.*?}/);
     if (!matchDisplays) {
       matchDisplays = textDisplays.match(/mFocusedApp=AppWindowToken{.+? (.+?) /);
     }
     if (matchDisplays && matchDisplays[1]) {
       return matchDisplays[1].trim();
     }
 
     // Fallback to the older method: dumpsys window windows
     const outputWindows = await client.shell(deviceId, 'dumpsys window windows');
     const resultWindows = await adb.util.readAll(outputWindows);
     const textWindows = resultWindows.toString();
     const matchWindows = textWindows.match(/mCurrentFocus.+\/(.+?)}/);
     if (matchWindows && matchWindows[1]) {
       return matchWindows[1];
     }
 
     return 'unknown'; // If neither method yields a result
 
  } catch (err) {
    console.error('error on getCurrentApp: ', err);
    return null;
  }
}

async function isSnapchatOpen() {
  try {
    const currentApp = await getCurrentApp();
    // console.log('currentApp: ', currentApp);
    return currentApp && currentApp.includes('com.snapchat.android');
  } catch (err) {
    console.error('error on isSnapchatOpen: ', err);
    return false;
  }
}

async function takeScreenshot() {
  try {
    let deviceId = await getDeviceId();

    if (!deviceId) {
      console.error('No device connected');
      return;
    }

    const timestamp = Date.now();
    const remotePath = `/sdcard/screen-${timestamp}.png`;
    const localPath = path.join(localDir, `screenshot-${timestamp}.png`);

    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir);
    }

    // capture screenshot on device
    await client.shell(deviceId, `screencap -p ${remotePath}`);
    await delay(1500); // give the phone time to finish writing

    deviceId = await getDeviceId();

    if (!deviceId) {
      console.error('No device connected');
      return;
    }

    // verify remote file exists
    try {
      await client.shell(deviceId, `ls ${remotePath}`);
    } catch (err) {
      throw new Error(`Screenshot file not found on device: ${err.message}`);
    }

    // pull screenshot to local
    const transfer = await client.pull(deviceId, remotePath);
    const buffer = await streamToBuffer(transfer);
    fs.writeFileSync(localPath, buffer);
    // await waitForFile(localPath);

    try {
      await client.shell(deviceId, `rm ${remotePath}`);
    } catch (err) {
      console.warn('error on delete remote screenshot:', err.message);
    }

    return localPath;
  } catch (err) {
    console.error('error on takeScreenshot: ', err);
    return null;
  }
}

// function waitForFile(path, timeout = 1000) {
//   return new Promise((resolve, reject) => {
//     const start = Date.now();
//     const interval = setInterval(() => {
//       if (fs.existsSync(path) && fs.statSync(path).size > 0) {
//         clearInterval(interval);
//         resolve(true);
//       } else if (Date.now() - start > timeout) {
//         clearInterval(interval);
//         reject(new Error("File not ready or empty"));
//       }
//     }, 100);
//   });
// }

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

async function sendShellCommand(cmd) {
  const deviceId = await getDeviceId();
  await client.shell(deviceId, cmd);
}

module.exports = {
  checkDeviceConnected,
  isSnapchatOpen,
  takeScreenshot,
  sendShellCommand,
};
