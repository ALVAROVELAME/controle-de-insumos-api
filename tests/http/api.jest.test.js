const request = require('supertest');
const { criarApp } = require('../../dist/app');
const { JwtTokenGenerator } = require('../../dist/security/JwtTokenGenerator');
const { AuthService } = require('../../dist/services/conta/AuthService');
const { UsuarioService } = require('../../dist/services/conta/UsuarioService');
const { EmailConfirmationService } = require('../../dist/services/conta/EmailConfirmationService');
const { InsumoService } = require('../../dist/services/estoque/InsumoService');
const { FornecedorService } = require('../../dist/services/estoque/FornecedorService');
const { MovimentacaoService } = require('../../dist/services/estoque/MovimentacaoService');
const { UsuarioRepository } = require('../../dist/repositories/conta/UsuarioRepository');
const { ConflictError, NotFoundError } = require('../../dist/errors/AppError');

const usuarioId = 'usuario-1';
const token = JwtTokenGenerator.gerarToken(usuarioId, 'ana@example.com', 'Ana');
const auth = `Bearer ${token}`;
let app;

beforeAll(async () => {
  app = await criarApp({ logger: false });
  await app.ready();
});
afterAll(async () => { await app.close(); });

test('health check e documentacao estao disponiveis', async () => {
  await request(app.server).get('/').expect(200).expect({ status: 'API controle de insumos funcionando' });
  await request(app.server).get('/docs/').expect(200);
  await request(app.server).options('/api/insumos').set('Origin', 'http://localhost:5173')
    .set('Access-Control-Request-Method', 'GET').expect(204)
    .expect('access-control-allow-origin', 'http://localhost:5173');
});

describe('autenticacao e contas', () => {
  test('cadastro valido, conflito e dados invalidos', async () => {
    const criar = jest.spyOn(UsuarioService, 'cadastrar').mockResolvedValue({});
    const dados = { nome: 'Ana', email: 'ana@example.com', senha: 'senha123' };
    await request(app.server).post('/api/usuarios').send(dados).expect(200).expect(({ body }) => expect(body.sucesso).toBe(true));
    expect(criar).toHaveBeenCalledWith(dados);
    criar.mockRejectedValueOnce(new ConflictError('Email ja cadastrado'));
    await request(app.server).post('/api/usuarios').send(dados).expect(409);
    await request(app.server).post('/api/usuarios').send({ email: 'invalido' }).expect(400);
  });

  test('login valido, credenciais invalidas e payload invalido', async () => {
    const login = jest.spyOn(AuthService, 'login').mockResolvedValue({ sucesso: true, token: 'jwt' });
    const dados = { email: 'ana@example.com', senha: 'senha123' };
    await request(app.server).post('/api/auth/login').send(dados).expect(200).expect(({ body }) => expect(body.token).toBe('jwt'));
    login.mockResolvedValueOnce({ sucesso: false, mensagem: 'E-mail ou senha invalidos.' });
    await request(app.server).post('/api/auth/login').send(dados).expect(401);
    await request(app.server).post('/api/auth/login').send({ email: 'invalido', senha: 'x' }).expect(400);
  });

  test('confirmacao exige token valido', async () => {
    const confirmar = jest.spyOn(EmailConfirmationService, 'confirmarEmail').mockResolvedValue(false);
    await request(app.server).get('/api/auth/confirmar').expect(401);
    await request(app.server).get('/api/auth/confirmar?token=invalido').expect(400);
    confirmar.mockResolvedValueOnce(true);
    await request(app.server).get('/api/auth/confirmar?token=valido').expect(200);
  });

  test('dados da conta e exclusao autenticada', async () => {
    const usuario = { _id: usuarioId, nome: 'Ana', email: 'ana@example.com', ativo: true, senhaHash: 'privado' };
    jest.spyOn(UsuarioRepository, 'findById').mockResolvedValue(usuario);
    jest.spyOn(AuthService, 'obterPorId').mockResolvedValue({ id: usuarioId, nome: 'Ana' });
    const excluir = jest.spyOn(UsuarioService, 'excluirConta').mockResolvedValue();
    await request(app.server).get('/api/auth/me').set('Authorization', auth).expect(200).expect(({ body }) => expect(body.id).toBe(usuarioId));
    await request(app.server).get('/api/usuarios/me').set('Authorization', auth).expect(200).expect(({ body }) => expect(body.senhaHash).toBeUndefined());
    await request(app.server).post('/api/usuarios/me/excluir').set('Authorization', auth).send({ senha: 'senha123' }).expect(200);
    expect(excluir).toHaveBeenCalledWith(usuario, 'senha123');
  });
});

describe.each([
  ['insumos', InsumoService, { nome: 'Arroz', categoria: 'Alimento', unidade: 'kg', quantidadeAtual: 10, quantidadeMinima: 2, precoCompra: 3, precoVenda: 5 }],
  ['fornecedores', FornecedorService, { nome: 'Fornecedor' }],
  ['movimentacoes', MovimentacaoService, { insumoId: 'insumo-1', tipo: 'Compra', quantidade: 2, precoUnitario: 3, data: '2026-01-01' }],
])('rotas de %s', (recurso, service, dados) => {
  const url = `/api/${recurso}`;
  test('protege todas as operacoes contra tokens ausentes ou invalidos', async () => {
    for (const [metodo, caminho] of [['get', url], ['post', url], ['put', `${url}/id`], ['delete', `${url}/id`], ['delete', url]]) {
      await request(app.server)[metodo](caminho).expect(401);
      await request(app.server)[metodo](caminho).set('Authorization', 'Bearer invalido').expect(401);
    }
  });
  test('lista, cria, atualiza, exclui e zera para o usuario autenticado', async () => {
    const listar = jest.spyOn(service, 'listar').mockResolvedValue([{ id: 'item' }]);
    const criar = jest.spyOn(service, 'criar').mockResolvedValue({ id: 'item' });
    const atualizar = jest.spyOn(service, 'atualizar').mockResolvedValue({ id: 'item' });
    const excluir = jest.spyOn(service, 'excluir').mockResolvedValue();
    const zerar = jest.spyOn(service, 'zerar').mockResolvedValue();
    await request(app.server).get(url).set('Authorization', auth).expect(200).expect([{ id: 'item' }]);
    await request(app.server).post(url).set('Authorization', auth).send(dados).expect(201);
    await request(app.server).put(`${url}/item`).set('Authorization', auth).send(dados).expect(200);
    await request(app.server).delete(`${url}/item`).set('Authorization', auth).expect(204);
    await request(app.server).delete(url).set('Authorization', auth).expect(204);
    expect(listar).toHaveBeenCalledWith(usuarioId);
    expect(criar).toHaveBeenCalledWith(dados, usuarioId);
    expect(atualizar).toHaveBeenCalledWith('item', dados, usuarioId);
    expect(excluir).toHaveBeenCalledWith('item', usuarioId);
    expect(zerar).toHaveBeenCalledWith(usuarioId);
  });
  test('rejeita dados invalidos e traduz erros de dominio', async () => {
    await request(app.server).post(url).set('Authorization', auth).send({}).expect(400);
    await request(app.server).put(`${url}/item`).set('Authorization', auth).send({}).expect(400);
    jest.spyOn(service, 'excluir').mockRejectedValue(new NotFoundError('Nao encontrado'));
    await request(app.server).delete(`${url}/item`).set('Authorization', auth).expect(404).expect(({ body }) => expect(body.sucesso).toBe(false));
  });
});
