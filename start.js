import net from 'net';
import { spawn } from 'child_process';

const forwarder = net.createServer(client => {
  const remote = net.connect(5000, '127.0.0.1', () => {
    client.pipe(remote);
    remote.pipe(client);
  });
  client.on('error', () => remote.destroy());
  remote.on('error', () => client.destroy());
});

forwarder.listen(5173, '0.0.0.0', () => {
  console.log('Port forwarder: 5173 -> 5000');
});

const vite = spawn('npx', ['vite'], { stdio: 'inherit' });
vite.on('exit', code => process.exit(code));
