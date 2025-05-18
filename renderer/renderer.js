let currentStep = 3;

// elements
const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const step3 = document.getElementById('step-3');

const deviceStatus = document.getElementById('device-status');
const snapchatStatus = document.getElementById('snapchat-status');
const adStatus = document.getElementById('ad-status');

const initialDeviceStatus = deviceStatus.innerHTML;
const initialSnapchatStatus = snapchatStatus.innerHTML;

// polling
let pollDeviceConnectionInterval;
let pollSnapchatInterval;

function showStep() {
  switch (currentStep) {
    case 1:
      deviceStatus.innerHTML = initialDeviceStatus;
      step1.style.display = 'block';
      step2.style.display = 'none';
      step3.style.display = 'none';
      startPollingConnection(1);
      break;
    case 2:
      console.log('step 2');
      snapchatStatus.innerHTML = initialSnapchatStatus;
      step1.style.display = 'none';
      step2.style.display = 'block';
      step3.style.display = 'none';
      startPollingSnapchat();
      break;
    case 3:
      step1.style.display = 'none';
      step2.style.display = 'none';
      step3.style.display = 'block';
      break;
    default:
      break;
  }

  document.body.style.pointerEvents = 'auto';
}

showStep();

async function progressUI(step) {
  switch (step) {
    case 1:
      deviceStatus.innerText = '✅ Phone connected';
      await new Promise((resolve) => setTimeout(resolve, 1500));
      currentStep = 2;
      showStep();
      break;
    case 2:
      break;
    case 3:
      break;
    default:
      break;
  }
}

function startPollingConnection(step) {
  switch (step) {
    case 1:
      if (pollDeviceConnectionInterval) {
        clearInterval(pollDeviceConnectionInterval);
      }
      pollDeviceConnectionInterval = setInterval(checkDeviceConnection, 2000);
      break;
    case 2:
      break;
  }
}

function stopPollingConnection(pollInterval) {
  if (pollInterval) clearInterval(pollInterval);
}

// async function updateUI(isConnected) {
//   if (!isConnected) {
//     return;
//   }

//   deviceStatus.innerText = '✅ Phone connected';
//   await new Promise((resolve) => setTimeout(resolve, 2000));
//   step1.style.display = 'none';
//   step2.style.display = 'block';
//   startPollingSnapchat();
// }

function startPollingSnapchat() {
  pollSnapchatInterval = setInterval(async () => {
    const isSnapchatOpen = await window.snappyAPI.checkSnapchat();
    updateSnapchatStatus(isSnapchatOpen);
  }, 4000);
}

function updateSnapchatStatus(isSnapchatOpen) {
  if (!isSnapchatOpen) {
    return;
  }

  snapchatStatus.innerText = '✅ Snapchat detected';
  stopPollingConnection(pollSnapchatInterval);
  currentStep = 3;
  showStep();
}

async function connect() {
  const result = await window.snappyAPI.checkConnection();
  document.getElementById('connectionStatus').innerText = result
    ? '✅ Phone Connected'
    : '❌ Phone Not Detected';
}

async function checkSnap() {
  const result = await window.snappyAPI.checkSnapchat();
  document.getElementById('snapStatus').innerText = result
    ? '📸 Snapchat is open'
    : '⛔ Snapchat not detected';
}

function startTapper() {
  window.snappyAPI.stopAutomation();

  window.snappyAPI.startTapper({});
  document.getElementById('automationStatus').innerText =
    '🚀 Tapping Started...';
}

function startLeftScroll() {
  window.snappyAPI.stopAutomation();

  window.snappyAPI.startLeftScroll({});
  document.getElementById('automationStatus').innerText =
    '🚀 Left Scrolling Started...';
}

function startRightScroll() {
  window.snappyAPI.stopAutomation();

  window.snappyAPI.startRightScroll({});
  document.getElementById('automationStatus').innerText =
    '🚀 Right Scrolling Started...';
}


function startScroller() {
  const direction = document.getElementById('scrollDirection').value;
  const delay = Number(document.getElementById('tapDelay').value || 1000);
  window.snappyAPI.startScroller({ direction, delay });
  document.getElementById('automationStatus').innerText =
    '📜 Scrolling Started...';
}

function startTapScroll() {
  const x = Number(document.getElementById('tapX').value || 500);
  const y = Number(document.getElementById('tapY').value || 1000);
  const delay = Number(document.getElementById('tapDelay').value || 1000);
  const direction = document.getElementById('scrollDirection').value;
  window.snappyAPI.startTapScroll({ x, y, delay, direction });
  document.getElementById('automationStatus').innerText =
    '🔁 Tap & Scroll Started...';
}

function stop() {
  window.snappyAPI.stopAutomation();
  // document.getElementById('automationStatus').innerText =
  //   '🛑 Automation Stopped.';
}

async function captureScreen() {
  await window.snappyAPI.takeScreenshot();
}

// check methods
async function checkDeviceConnection() {
  const connected = await window.snappyAPI.checkConnection();

  if (!connected) {
    if (currentStep != 1) {
      document.body.style.pointerEvents = 'none';
      alertError('Phone disconnected');
      currentStep = 1;
      await new Promise((resolve) => setTimeout(resolve, 2000));
      showStep();
    }
    return;
  }

  if (currentStep == 1) {
    progressUI(1);
  }
}

// alerts
function alertError(message) {
  toastify.toast({
    text: message,
    duration: 2000,
    close: false,
    style: {
      background: 'red',
      color: 'white',
      textAlign: 'center',
    },
  });
}

function alertSuccess(message) {
  toastify.toast({
    text: message,
    duration: 2000,
    close: false,
    style: {
      background: 'green',
      color: 'white',
      textAlign: 'center',
    },
  });
}
