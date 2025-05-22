let currentStep;

// elements
const step0 = document.getElementById('step-0');
const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const step3 = document.getElementById('step-3');

const pythonSetupStatus = document.getElementById('python-setup-status');
const deviceStatus = document.getElementById('device-status');
const snapchatStatus = document.getElementById('snapchat-status');
const adStatus = document.getElementById('ad-status');

const btnContinueStep0 = document.getElementById('btn-continue-step0');
const initialDeviceStatus = deviceStatus.innerHTML;
const initialSnapchatStatus = snapchatStatus.innerHTML;
const initialAdStatus = adStatus.innerHTML;

// polling
let pollDeviceConnectionInterval;
let pollSnapchatInterval;
let pollAdInterval;

function showStep() {
  stopAutomation();
  // console.log('showStep: currentStep: ', currentStep);
  switch (currentStep) {
    case 0:
      stopPollingAll();
      step0.style.display = 'block';
      step1.style.display = 'none';
      step2.style.display = 'none';
      step3.style.display = 'none';
      break;
    case 1:
      stopPollingAll();
      deviceStatus.innerHTML = initialDeviceStatus;
      step1.style.display = 'block';
      step2.style.display = 'none';
      step3.style.display = 'none';
      startPollingConnection(1);
      break;
    case 2:
      if (pollAdInterval) {
        clearInterval(pollAdInterval);
      }
      snapchatStatus.innerHTML = initialSnapchatStatus;
      step1.style.display = 'none';
      step2.style.display = 'block';
      step3.style.display = 'none';
      startPollingConnection(2);
      break;
    case 3:
      adStatus.innerHTML = initialAdStatus;
      step1.style.display = 'none';
      step2.style.display = 'none';
      step3.style.display = 'block';
      startPollingConnection(3);
      break;
    default:
      break;
  }

  document.body.style.pointerEvents = 'auto';
}

checkPythonSetup();

async function checkPythonSetup() {
  try {
    const setupDone = await window.snappyAPI.checkPythonSetup();

    if (setupDone) {
      currentStep = 1;
      showStep();
    } else {
      currentStep = 0;
      showStep();
      pythonSetupStatus.textContent = '⚠️ Setup Required';
    }
  } catch (e) {
    pythonSetupStatus.textContent = '⚠️ Error checking setup';
  }
}

btnContinueStep0.addEventListener('click', () => {
  checkPythonSetup();
});

function copyCommand() {
  const commandText = document.querySelector('.command-box pre').innerText;

  if (!navigator.clipboard) {
    const textarea = document.createElement('textarea');
    textarea.value = commandText;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      alertSuccess('Copied');
    } catch (err) {
      alertError('Failed to copy');
    }
    document.body.removeChild(textarea);
    return;
  }

  navigator.clipboard.writeText(commandText)
    .then(() => {
      alertSuccess('Copied');
    })
    .catch(() => {
      alertError('Failed to copy');
    });
}


async function progressUI(step) {
  switch (step) {
    case 1:
      deviceStatus.innerText = '✅ Phone connected';
      await new Promise((resolve) => setTimeout(resolve, 1500));
      currentStep = 2;
      showStep();
      break;
    case 2:
      snapchatStatus.innerText = '✅ Snapchat detected';
      await new Promise((resolve) => setTimeout(resolve, 1500));
      currentStep = 3;
      showStep();
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

      pollDeviceConnectionInterval = setInterval(checkDeviceConnection, 1000);
      break;
    case 2:
      if (pollSnapchatInterval) {
        clearInterval(pollSnapchatInterval);
      }

      pollSnapchatInterval = setInterval(checkSnapchat, 1000);
      break;
    case 3:
      if (pollAdInterval) {
        clearInterval(pollAdInterval);
      }

      pollAdInterval = setInterval(checkAd, 1500);
      break;
  }
}

// function stopPollingConnection(pollInterval) {
//   if (pollInterval) clearInterval(pollInterval);
// }

function stopPollingAll() {
  if (pollDeviceConnectionInterval) {
    clearInterval(pollDeviceConnectionInterval);
  }

  if (pollSnapchatInterval) {
    clearInterval(pollSnapchatInterval);
  }

  if (pollAdInterval) {
    clearInterval(pollAdInterval);
  }
}

// operations
function startTapper() {
  window.snappyAPI.stopAutomation();
  window.snappyAPI.startTapper({});
  alertSuccess('🚀 Tapping');
}

function startLeftScroll() {
  window.snappyAPI.stopAutomation();
  window.snappyAPI.startLeftScroll({});
  alertSuccess('🚀 Left Scrolling');
}

function startRightScroll() {
  window.snappyAPI.stopAutomation();
  window.snappyAPI.startRightScroll({});
  alertSuccess('🚀 Right Scrolling');
}

function startTapScroll() {
  window.snappyAPI.stopAutomation();
  window.snappyAPI.startTapScroll({});
  alertSuccess('🚀 Auto Tap & Scroll');
}

async function captureScreen() {
  await window.snappyAPI.takeScreenshot();
}

function stopAutomation() {
  window.snappyAPI.stopAutomation();
}

function stopAdChecker() {
  if (pollAdInterval) {
    clearInterval(pollAdInterval);
  }
}

// check methods
async function checkDeviceConnection() {
  const connected = await window.snappyAPI.checkConnection();

  if (!connected) {
    if (currentStep != 1) {
      document.body.style.pointerEvents = 'none';
      alertError('Phone disconnected');
      currentStep = 1;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showStep();
    }
    return;
  }

  if (currentStep == 1) {
    progressUI(1);
  }
}

async function checkSnapchat() {
  const isSnapchatOpen = await window.snappyAPI.checkSnapchat();

  if (!isSnapchatOpen) {
    if (currentStep != 2) {
      document.body.style.pointerEvents = 'none';
      alertError('Snapchat not detected');
      currentStep = 2;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showStep();
    }
    return;
  }

  if (currentStep == 2) {
    progressUI(2);
  }
}

async function checkAd() {
  try {
    const isAdDisplayed = await window.snappyAPI.checkAd();
  
    if (isAdDisplayed) {
      adStatus.innerText = '✅ Ad detected';
    } else {
      adStatus.innerText = '❌ Ad not detected';
    }
  } catch (error) {
    console.error('checkAd error: ', error);
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
      background: '#64ccc9',
      color: 'white',
      textAlign: 'center',
    },
  });
}
