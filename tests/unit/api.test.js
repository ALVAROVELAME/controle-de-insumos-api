const { test } = require('node:test');
const assert = require('node:assert/strict');

// Valores isolados: os testes nunca usam credenciais ou servicos do .env.
Object.assign(process.env, {
  MONGO_URI: 'mongodb://127.0.0.1:27017/teste', MAIL_HOST: 'localhost',
  MAIL_PORT: '1025', MAIL_USERNAME: 'teste', MAIL_PASSWORD: 'teste',
  MAIL_FROM: 'teste@example.com', JWT_SECRET: 'segredo-exclusivo-para-testes-com-mais-de-32-caracteres',
  JWT_ISSUER: 'testes', JWT_AUDIENCE: 'testes', JWT_EXPIRATION: '3600000',
});

const Fastify = require('fastify');
const { errorHandler } = require('../../src/middlewares/errorHandler');
const { authRoutes } = require('../../src/routes/conta/auth.routes');
const { usuariosRoutes } = require('../../src/routes/conta/usuarios.routes');
const { insumosRoutes } = require('../../src/routes/estoque/insumos.routes');
const { fornecedoresRoutes } = require('../../src/routes/estoque/fornecedores.routes');
const { movimentacoesRoutes } = require('../../src/routes/estoque/movimentacoes.routes');
const { JwtTokenGenerator } = require('../../src/security/JwtTokenGenerator');
const { PasswordHasher } = require('../../src/services/PasswordHasher');
const { AuthService } = require('../../src/services/conta/AuthService');
const { UsuarioService } = require('../../src/services/conta/UsuarioService');
const { EmailConfirmationService } = require('../../src/services/conta/EmailConfirmationService');
const { EmailService } = require('../../src/services/EmailService');
const { InsumoService } = require('../../src/services/estoque/InsumoService');
const { FornecedorService } = require('../../src/services/estoque/FornecedorService');
const { MovimentacaoService } = require('../../src/services/estoque/MovimentacaoService');
const { UsuarioRepository } = require('../../src/repositories/conta/UsuarioRepository');
const { CadastroPendenteRepository } = require('../../src/repositories/conta/CadastroPendenteRepository');
const { InsumoRepository } = require('../../src/repositories/estoque/InsumoRepository');
const { FornecedorRepository } = require('../../src/repositories/estoque/FornecedorRepository');
const { MovimentacaoRepository } = require('../../src/repositories/estoque/MovimentacaoRepository');

const usuarioId = 'usuario-1';
const dtoMov = { insumoId: 'insumo-1', tipo: 'Compra', quantidade: 3, precoUnitario: 2, data: '2026-01-01' };
const dtoInsumo = { nome: ' Arroz ', categoria: ' Alimentos ', unidade: ' kg ', quantidadeAtual: 10, quantidadeMinima: 1, precoCompra: 2, precoVenda: 3 };
const insumo = (id = 'insumo-1', quantidadeAtual = 10) => ({ _id: id, quantidadeAtual, unidade: 'kg' });

test('senhas e tokens: hash, verificacao e autenticidade', () => {
  const hash = PasswordHasher.hash('senha-segura');
  assert.notEqual(hash, 'senha-segura');
  assert.equal(PasswordHasher.verify('senha-segura', hash), true);
  assert.equal(PasswordHasher.verify('outra', hash), false);
  assert.throws(() => PasswordHasher.hash('  '));
  const token = JwtTokenGenerator.gerarToken(usuarioId, 'a@example.com', 'Ana');
  assert.deepEqual(JwtTokenGenerator.verificar(token), { id: usuarioId, nome: 'Ana', email: 'a@example.com' });
  assert.throws(() => JwtTokenGenerator.verificar(token + 'x'));
});

test('login aceita apenas credenciais validas e conta ativa', async (t) => {
  const user = { _id: usuarioId, nome: 'Ana', email: 'a@example.com', ativo: true, senhaHash: PasswordHasher.hash('senha123') };
  const find = t.mock.method(UsuarioRepository, 'findByEmail', async () => user);
  assert.equal((await AuthService.login({ email: user.email, senha: 'errada' })).sucesso, false);
  user.ativo = false;
  assert.match((await AuthService.login({ email: user.email, senha: 'senha123' })).mensagem, /confirmada/);
  user.ativo = true;
  const result = await AuthService.login({ email: user.email, senha: 'senha123' });
  assert.equal(result.sucesso, true);
  assert.equal(JwtTokenGenerator.verificar(result.token).id, usuarioId);
  assert.equal('senhaHash' in result.usuario, false);
  find.mock.mockImplementation(async () => null);
  assert.equal((await AuthService.login({ email: user.email, senha: 'senha123' })).sucesso, false);
});

test('cadastro gera senha protegida e envia confirmacao; duplicatas sao recusadas', async (t) => {
  const find = t.mock.method(UsuarioRepository, 'findByEmail', async () => null);
  t.mock.method(CadastroPendenteRepository, 'findByEmail', async () => null);
  t.mock.method(CadastroPendenteRepository, 'create', async (data) => data);
  const mail = t.mock.method(EmailService, 'enviarEmailConfirmacao', async () => {});
  const result = await UsuarioService.cadastrar({ nome: 'Ana', email: 'a@example.com', senha: 'senha123' });
  assert.equal(PasswordHasher.verify('senha123', result.senhaHash), true);
  assert.ok(result.tokenExpiraEm.getTime() > Date.now());
  assert.deepEqual(mail.mock.calls[0].arguments, [result.email, result.nome, result.tokenConfirmacao]);
  find.mock.mockImplementation(async () => ({}));
  await assert.rejects(() => UsuarioService.cadastrar({ nome: 'Ana', email: 'a@example.com', senha: 'senha123' }), /Email ja cadastrado/);
});

test('confirmacao recusa token ausente ou expirado e ativa cadastro valido', async (t) => {
  const cadastro = { nome: 'Ana', email: 'a@example.com', senhaHash: 'hash', tokenExpiraEm: new Date(Date.now() - 1000) };
  const find = t.mock.method(CadastroPendenteRepository, 'findByToken', async () => null);
  const create = t.mock.method(UsuarioRepository, 'create', async (data) => data);
  const remove = t.mock.method(CadastroPendenteRepository, 'delete', async () => {});
  assert.equal(await EmailConfirmationService.confirmarEmail('x'), false);
  find.mock.mockImplementation(async () => cadastro);
  assert.equal(await EmailConfirmationService.confirmarEmail('x'), false);
  cadastro.tokenExpiraEm = new Date(Date.now() + 60000);
  assert.equal(await EmailConfirmationService.confirmarEmail('x'), true);
  assert.equal(create.mock.calls[0].arguments[0].ativo, true);
  assert.equal(remove.mock.calls.length, 1);
});

test('exclusao de conta exige senha e remove dados do usuario em ordem', async (t) => {
  const user = { _id: usuarioId, email: 'a@example.com', senhaHash: PasswordHasher.hash('senha123') };
  const calls = [];
  for (const [repo, method, label] of [[MovimentacaoRepository, 'deleteAllByUsuario', 'mov'], [InsumoRepository, 'deleteAllByUsuario', 'insumo'], [FornecedorRepository, 'deleteAllByUsuario', 'fornecedor'], [UsuarioRepository, 'delete', 'usuario']]) {
    t.mock.method(repo, method, async () => { calls.push(label); });
  }
  t.mock.method(CadastroPendenteRepository, 'findByEmail', async () => null);
  await assert.rejects(() => UsuarioService.excluirConta(user, 'errada'), /Senha incorreta/);
  assert.deepEqual(calls, []);
  await UsuarioService.excluirConta(user, 'senha123');
  assert.deepEqual(calls, ['mov', 'insumo', 'fornecedor', 'usuario']);
});

test('insumos validam duplicidade e fornecedor e normalizam dados', async (t) => {
  const find = t.mock.method(InsumoRepository, 'findByNomeAndUsuario', async () => null);
  const fornecedor = t.mock.method(FornecedorRepository, 'findByIdAndUsuario', async () => null);
  const create = t.mock.method(InsumoRepository, 'create', async (data) => data);
  await assert.rejects(() => InsumoService.criar({ ...dtoInsumo, fornecedorId: 'outro' }, usuarioId), /Fornecedor nao encontrado/);
  fornecedor.mock.mockImplementation(async () => ({ _id: 'f' }));
  const result = await InsumoService.criar({ ...dtoInsumo, fornecedorId: 'f' }, usuarioId);
  assert.equal(result.nome, 'Arroz');
  assert.equal(result.usuarioId, usuarioId);
  assert.equal(result.unidade, 'kg');
  assert.equal(create.mock.calls.length, 1);
  find.mock.mockImplementation(async () => ({}));
  await assert.rejects(() => InsumoService.criar(dtoInsumo, usuarioId), /Ja existe/);
});

test('fornecedor duplicado e exclusao com limpeza de referencias', async (t) => {
  const find = t.mock.method(FornecedorRepository, 'findByNomeAndUsuario', async () => ({}));
  await assert.rejects(() => FornecedorService.criar({ nome: 'Fornecedor' }, usuarioId), /Ja existe/);
  find.mock.mockImplementation(async () => null);
  t.mock.method(FornecedorRepository, 'findByIdAndUsuario', async () => ({ _id: 'f' }));
  const a = t.mock.method(InsumoRepository, 'nullifyFornecedor', async () => {});
  const b = t.mock.method(MovimentacaoRepository, 'nullifyFornecedor', async () => {});
  const c = t.mock.method(FornecedorRepository, 'deleteById', async () => {});
  await FornecedorService.excluir('f', usuarioId);
  for (const mock of [a, b, c]) assert.deepEqual(mock.mock.calls[0].arguments, mock === c ? ['f', usuarioId] : [usuarioId, 'f']);
});

for (const [tipo, quantidade, esperado, total] of [['Compra', 3, 13, 6], ['Venda', 3, 7, 6], ['Ajuste', -3, 7, 0]]) {
  test(`movimentacao ${tipo} atualiza estoque e total`, async (t) => {
    t.mock.method(InsumoRepository, 'findByIdAndUsuario', async () => insumo());
    const create = t.mock.method(MovimentacaoRepository, 'create', async (data) => ({ ...data, _id: 'm' }));
    const set = t.mock.method(InsumoRepository, 'setEstoque', async () => {});
    await MovimentacaoService.criar({ ...dtoMov, tipo, quantidade }, usuarioId);
    assert.equal(create.mock.calls[0].arguments[0].total, total);
    assert.deepEqual(set.mock.calls[0].arguments, ['insumo-1', esperado]);
  });
}

test('movimentacao impede estoque negativo e fornecedor de outro usuario', async (t) => {
  t.mock.method(InsumoRepository, 'findByIdAndUsuario', async () => insumo());
  t.mock.method(FornecedorRepository, 'findByIdAndUsuario', async () => null);
  const create = t.mock.method(MovimentacaoRepository, 'create', async () => ({}));
  await assert.rejects(() => MovimentacaoService.criar({ ...dtoMov, tipo: 'Venda', quantidade: 11 }, usuarioId), /Estoque insuficiente/);
  await assert.rejects(() => MovimentacaoService.criar({ ...dtoMov, fornecedorId: 'f' }, usuarioId), /Fornecedor nao encontrado/);
  assert.equal(create.mock.calls.length, 0);
});

test('falha ao atualizar estoque desfaz criacao da movimentacao', async (t) => {
  t.mock.method(InsumoRepository, 'findByIdAndUsuario', async () => insumo());
  t.mock.method(MovimentacaoRepository, 'create', async () => ({ _id: 'm' }));
  t.mock.method(InsumoRepository, 'setEstoque', async () => { throw new Error('falha'); });
  const remove = t.mock.method(MovimentacaoRepository, 'deleteById', async () => {});
  await assert.rejects(() => MovimentacaoService.criar(dtoMov, usuarioId), /falha/);
  assert.deepEqual(remove.mock.calls[0].arguments, ['m', usuarioId]);
});

test('editar movimentacao entre insumos reverte e aplica estoques', async (t) => {
  t.mock.method(MovimentacaoRepository, 'findByIdAndUsuario', async () => ({ insumoId: 'insumo-1', tipo: 'Compra', quantidade: 3 }));
  t.mock.method(InsumoRepository, 'findByIdAndUsuario', async (id) => insumo(id, id === 'insumo-1' ? 10 : 5));
  t.mock.method(MovimentacaoRepository, 'updateById', async (_id, _usuario, data) => data);
  const set = t.mock.method(InsumoRepository, 'setEstoque', async () => {});
  await MovimentacaoService.atualizar('m', { ...dtoMov, insumoId: 'insumo-2', tipo: 'Venda', quantidade: 2 }, usuarioId);
  assert.deepEqual(set.mock.calls.map((call) => call.arguments), [['insumo-1', 7], ['insumo-2', 3]]);
});

test('excluir movimentacao reverte estoque e impede saldo negativo', async (t) => {
  t.mock.method(MovimentacaoRepository, 'findByIdAndUsuario', async () => ({ insumoId: 'insumo-1', tipo: 'Compra', quantidade: 3 }));
  const find = t.mock.method(InsumoRepository, 'findByIdAndUsuario', async () => insumo('insumo-1', 2));
  const remove = t.mock.method(MovimentacaoRepository, 'deleteById', async () => {});
  const set = t.mock.method(InsumoRepository, 'setEstoque', async () => {});
  await assert.rejects(() => MovimentacaoService.excluir('m', usuarioId), /estoque ficaria negativo/);
  assert.equal(remove.mock.calls.length, 0);
  find.mock.mockImplementation(async () => insumo('insumo-1', 10));
  await MovimentacaoService.excluir('m', usuarioId);
  assert.deepEqual(set.mock.calls[0].arguments, ['insumo-1', 7]);
});

test('rotas HTTP aplicam autenticacao, validacao e identidade do token', async (t) => {
  const app = Fastify();
  t.after(() => app.close());
  app.setErrorHandler(errorHandler);
  for (const route of [authRoutes, usuariosRoutes, insumosRoutes, fornecedoresRoutes, movimentacoesRoutes]) await app.register(route);
  const token = JwtTokenGenerator.gerarToken(usuarioId, 'a@example.com', 'Ana');
  const headers = { authorization: `Bearer ${token}` };
  for (const url of ['/api/auth/me', '/api/usuarios/me', '/api/insumos', '/api/fornecedores', '/api/movimentacoes']) {
    assert.equal((await app.inject({ method: 'GET', url })).statusCode, 401);
    assert.equal((await app.inject({ method: 'GET', url, headers: { authorization: 'Bearer invalido' } })).statusCode, 401);
  }
  const list = t.mock.method(InsumoService, 'listar', async () => []);
  const res = await app.inject({ method: 'GET', url: '/api/insumos', headers });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), []);
  assert.deepEqual(list.mock.calls[0].arguments, [usuarioId]);
  for (const [url, payload] of [['/api/auth/login', { email: 'invalido', senha: 'x' }], ['/api/usuarios', {}], ['/api/insumos', {}], ['/api/fornecedores', {}], ['/api/movimentacoes', {}]]) {
    const response = await app.inject({ method: 'POST', url, headers, payload });
    assert.equal(response.statusCode, 400, url);
    assert.equal(response.json().sucesso, false);
  }
});
