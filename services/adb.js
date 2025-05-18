const path = require('path');
const fs = require('fs');
const adb = require('adbkit');

const client = adb.createClient({ host: '127.0.0.1', port: 5037 });

async function getDeviceId() {
  const devices = await client.listDevices();
  if (!devices.length) throw new Error('No device connected');
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
    const devices = await client.listDevices();

    if (!devices.length) return null;

    const deviceId = devices[0].id;
    const output = await client.shell(deviceId, 'dumpsys window windows');
    const result = await adb.util.readAll(output);
    const text = result.toString();
    const match = text.match(/mCurrentFocus.+\/(.+?)}/);
    return match ? match[1] : 'unknown';
  } catch (err) {
    console.error('error on getCurrentApp: ', err);
    return null;
  }
}

async function isSnapchatOpen() {
  try {
    console.log(new Date().toISOString(), 'isSnapchatOpen');
    const currentApp = await getCurrentApp();
    console.log('currentApp: ', currentApp);
    return currentApp && currentApp.includes('com.snapchat.android');
  } catch (err) {
    console.error('error on isSnapchatOpen: ', err);
    return false;
  }
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

async function takeScreenshot() {
  try {
    const deviceId = await getDeviceId();
    const timestamp = Date.now();
    const remotePath = `/sdcard/screen-top-${timestamp}.png`;
    const localDir = path.join(__dirname, '../snapshots');
    const localPath = path.join(localDir, `screenshot-top-${timestamp}.png`);

    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir);
    }

    // capture screenshot on device
    await client.shell(deviceId, `screencap -p ${remotePath}`);
    await delay(1500); // give the phone time to finish writing

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

    // Optionally delete remote screenshot
    try {
      await client.shell(deviceId, `rm ${remotePath}`);
    } catch (err) {
      console.warn('⚠️ Failed to delete remote screenshot:', err.message);
    }

    return localPath;
  } catch (err) {
    console.error('error on takeScreenshot: ', err);
    return null;
  }
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  checkDeviceConnected,
  getCurrentApp,
  isSnapchatOpen,
  takeScreenshot,
};
