const { test } = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');

test('envia confirmacao pelo protocolo SMTP com destinatario e link corretos', async (t) => {
  let mensagem = '';
  const server = net.createServer((socket) => {
    let buffer = '';
    let data = false;
    socket.write('220 localhost SMTP\r\n');
    socket.on('data', (chunk) => {
      buffer += chunk.toString();
      let end;
      while ((end = buffer.indexOf('\r\n')) !== -1) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (data) {
          if (line === '.') { data = false; socket.write('250 mensagem aceita\r\n'); }
          else mensagem += `${line}\n`;
        } else if (/^EHLO /i.test(line)) socket.write('250-localhost\r\n250 AUTH PLAIN\r\n');
        else if (/^AUTH PLAIN/i.test(line)) socket.write('235 autenticado\r\n');
        else if (/^(MAIL FROM|RCPT TO):/i.test(line)) socket.write('250 ok\r\n');
        else if (line === 'DATA') { data = true; socket.write('354 envie a mensagem\r\n'); }
        else if (line === 'QUIT') { socket.write('221 ate logo\r\n'); socket.end(); }
        else socket.write('500 comando desconhecido\r\n');
      }
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  Object.assign(process.env, {
    MONGO_URI: 'mongodb://127.0.0.1:27017/teste', MAIL_HOST: '127.0.0.1',
    MAIL_PORT: String(server.address().port), MAIL_USERNAME: 'teste', MAIL_PASSWORD: 'teste',
    MAIL_FROM: 'remetente@example.com', JWT_SECRET: 'segredo-exclusivo-para-testes-com-mais-de-32-caracteres',
    APP_FRONTEND_URL: 'https://frontend.example.com',
  });
  const { EmailService } = require('../../src/services/EmailService');
  await EmailService.enviarEmailConfirmacao('destino@example.com', 'Ana', 'token123');
  assert.match(mensagem, /To: destino@example\.com/);
  assert.match(mensagem, /https:\/\/frontend\.example\.com\/confirmar\?token=token123/);
});
