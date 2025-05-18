const { exec } = require('child_process');
const path = require('path');

const PYTHON = path.join(process.env.HOME, 'snappy-venv/bin/python');
const SCRIPT = path.join(__dirname, '../scripts/detect_ad.py');

function detectAdPython(screenPath) {
  return new Promise((resolve, reject) => {
    const cmd = `"${PYTHON}" "${SCRIPT}" "${screenPath}"`;

    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr);
      const result = stdout.trim();
      resolve(result === 'ad');
    });
  });
}

module.exports = { detectAdPython };
