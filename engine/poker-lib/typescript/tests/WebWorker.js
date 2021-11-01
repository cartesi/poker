/*
This mimics the Browser's  WebWorker behavior in a NodeJS environment.
Only intended to support testing of our WASM module.
*/

const fs = require('fs');
const path = require('path');

class WebWorker {
  constructor(src) {
    const self = this;
    this.listeners = []
    this.calls = [];
    const modulePath = `${src}`;
    const cwd = process.cwd();
    const base = process.chdir(path.dirname(modulePath))
    const src = fs.readFileSync(modulePath).toString();
    const m = {}
    const postMessage = function(a) { 
      self.listeners.map(fn => fn({data: a}));
    }      
    eval(`(function (module, postMessage, importScripts) { ${src}; module.onmessage=onmessage; })`)(m, postMessage, function(){})
    process.cwd(cwd);
    
    this.lib = m.exports;
    this.internal_onmessage = m.onmessage;
    this.lib.onRuntimeInitialized = function() {
      self.ready = true;
      self.processCalls();
    }
  }
  
  processCalls() {
    if (!this.ready) return;
    this.calls.map(m => {
      this.internal_onmessage({data:m});
    });
    this.calls = [];
  }

  postMessage(m) {
    this.calls.push(m);
    this.processCalls();
  }

  onmessage(m) {
  }

  onmessageerror() {
    
  }

  terminate() {}

  addEventListener(event, listener) {
    this.listeners.push(listener);
  }

 removeEventListener() { }

  dispatchEvent(x) {
  }

  onerror(e) {
  }
}

global.Worker = WebWorker;
