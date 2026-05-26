const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080/ws');

ws.on('open', function open() {
  console.log('Connected to server');
  const msg = {
    command: 'start',
    code: `
#include <iostream>
int main() {
    int x = 42;
    std::cout << x << std::endl;
    return 0;
}
    `
  };
  ws.send(JSON.stringify(msg));
});

ws.on('message', function incoming(data) {
  const msg = JSON.parse(data);
  console.log('Received:', msg.event, msg.state || '');
  if (msg.event === 'error') {
    console.error('ERROR:', msg.message);
    process.exit(1);
  }
  if (msg.event === 'LAUNCH_SUCCESS') {
    console.log('SUCCESS: Debugger is ready!');
    process.exit(0);
  }
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err);
  process.exit(1);
});
