const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const toastify = require('toastify-js');

contextBridge.exposeInMainWorld('path', {
  join: (...args) => path.join(...args),
});

contextBridge.exposeInMainWorld('toastify', {
  toast: (options) => toastify(options).showToast(),
});

contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  //   on: (channel, func) => ipcRenderer.on(channel, func),
  on: (channel, func) =>
    ipcRenderer.on(channel, (event, ...args) => func(...args)),
});

contextBridge.exposeInMainWorld('snappyAPI', {
  checkConnection: () => ipcRenderer.invoke('check-connection'),
  checkSnapchat: () => ipcRenderer.invoke('check-snapchat'),
  startTapper: (config) => ipcRenderer.invoke('start-tapper', config),
  startLeftScroll: (config) => ipcRenderer.invoke('start-left-scroll', config),
  startRightScroll: (config) => ipcRenderer.invoke('start-right-scroll', config),
  startScroller: (config) => ipcRenderer.invoke('start-scroller', config),
  startTapScroll: (config) => ipcRenderer.invoke('start-tapscroll', config),
  stopAutomation: () => ipcRenderer.invoke('stop-automation'),
  takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),
  checkAd: () => ipcRenderer.invoke('check-ad'),
});
