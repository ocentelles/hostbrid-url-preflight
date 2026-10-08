import {spawn} from 'node:child_process';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

export async function chrome(directory) {
  const profile = await mkdtemp(join(directory, 'chrome-'));
  const process = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], {stdio: 'ignore'});
  const exited = new Promise(resolve => process.once('exit', resolve));
  try {
    let port; const deadline = Date.now() + 15000;
    while (!port && Date.now() < deadline) { try { port = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); } catch { await delay(50); } }
    if (!port) throw Error('Chrome did not become ready');
    return {port, close: async () => { process.kill('SIGTERM'); await exited; await rm(profile, {recursive: true, force: true}); }};
  } catch (error) { process.kill('SIGTERM'); await exited; await rm(profile, {recursive: true, force: true}); throw error; }
}

export async function tab(port, width) {
  const target = await (await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', {method: 'PUT'})).json();
  const socket = new WebSocket(target.webSocketDebuggerUrl); const pending = new Map(); const events = []; let id = 0;
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, {once: true}); socket.addEventListener('error', reject, {once: true}); });
  socket.addEventListener('message', event => {
    const value = JSON.parse(event.data);
    if (value.id) { const item = pending.get(value.id); if (item) { pending.delete(value.id); clearTimeout(item.timer); value.error ? item.reject(Error('CDP error')) : item.resolve(value.result); } }
    else events.push(value);
  });
  socket.addEventListener('close', () => { for (const item of pending.values()) { clearTimeout(item.timer); item.reject(Error('CDP socket closed')); } pending.clear(); });
  const call = (method, params = {}) => new Promise((resolve, reject) => { const key = ++id; const timer = setTimeout(() => { pending.delete(key); reject(Error('CDP timeout: ' + method)); }, 10000); pending.set(key, {resolve, reject, timer}); socket.send(JSON.stringify({id: key, method, params})); });
  const evaluate = async expression => { const value = await call('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true}); if (value.exceptionDetails) throw Error('Browser assertion failed'); return value.result.value; };
  await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable');
  await call('Emulation.setDeviceMetricsOverride', {width, height: 1000, deviceScaleFactor: 2, mobile: false});
  return {call, evaluate, events, go: async url => {
    await call('Page.navigate', {url}); const deadline = Date.now() + 10000;
    while (Date.now() < deadline) { if (await evaluate('!!document.querySelector("[data-contact-label]")')) return; await delay(50); }
    throw Error('React label not rendered');
  }, close: async () => { socket.close(); await fetch('http://127.0.0.1:' + port + '/json/close/' + target.id); }};
}
