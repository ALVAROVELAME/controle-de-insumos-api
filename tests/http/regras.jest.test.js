const { Types } = require('mongoose');
const { Insumo } = require('../../dist/models/estoque/Insumo');
const { Fornecedor } = require('../../dist/models/estoque/Fornecedor');
const { Movimentacao } = require('../../dist/models/estoque/Movimentacao');
const { Usuario } = require('../../dist/models/conta/Usuario');
const { InsumoRepository } = require('../../dist/repositories/estoque/InsumoRepository');
const { FornecedorRepository } = require('../../dist/repositories/estoque/FornecedorRepository');
const { MovimentacaoRepository } = require('../../dist/repositories/estoque/MovimentacaoRepository');
const { UsuarioRepository } = require('../../dist/repositories/conta/UsuarioRepository');
const { InsumoService } = require('../../dist/services/estoque/InsumoService');
const { FornecedorService } = require('../../dist/services/estoque/FornecedorService');
const { MovimentacaoService } = require('../../dist/services/estoque/MovimentacaoService');
const { UsuarioService } = require('../../dist/services/conta/UsuarioService');
const { CadastroPendenteRepository } = require('../../dist/repositories/conta/CadastroPendenteRepository');
const { CriarInsumoDTO } = require('../../dist/dtos/estoque/InsumoDTO');
const { CriarMovimentacaoDTO } = require('../../dist/dtos/estoque/MovimentacaoDTO');
const uid = 'usuario-1';
const dto = { nome: ' Arroz ', categoria: ' Alimento ', unidade: ' kg ', quantidadeAtual: 5, quantidadeMinima: 1, precoCompra: 2, precoVenda: 3 };
const mov = { insumoId: 'i1', tipo: 'Venda', quantidade: 3, precoUnitario: 2, data: '2026-01-01' };

test('modelos validam campos obrigatorios e serializam sem _id', async () => {
  const userId = new Types.ObjectId();
  const item = new Insumo({ usuarioId: userId, nome: ' Arroz ', categoria: 'Alimento', unidade: 'kg' });
  await expect(item.validate()).resolves.toBeUndefined();
  expect(item.toJSON()).toMatchObject({ nome: 'Arroz', quantidadeAtual: 0, ativo: true, id: String(item._id) });
  expect(item.toJSON()).not.toHaveProperty('_id');
  await expect(new Insumo({ usuarioId: userId }).validate()).rejects.toHaveProperty('errors.nome');
  await expect(new Movimentacao({ usuarioId: userId, tipo: 'invalido' }).validate()).rejects.toHaveProperty('errors.tipo');
  expect(Insumo.schema.indexes()).toEqual(expect.arrayContaining([[{ usuarioId: 1, nome: 1 }, expect.objectContaining({ unique: true })]]));
});

test('DTOs recusam precos e quantidades invalidas e movimentos desconhecidos', () => {
  expect(CriarInsumoDTO.safeParse({ ...dto, quantidadeAtual: -1 }).success).toBe(false);
  expect(CriarInsumoDTO.safeParse({ ...dto, precoVenda: -1 }).success).toBe(false);
  expect(CriarMovimentacaoDTO.safeParse({ ...mov, tipo: 'Outro' }).success).toBe(false);
  expect(CriarMovimentacaoDTO.safeParse({ ...mov, precoUnitario: -1 }).success).toBe(false);
  expect(CriarMovimentacaoDTO.safeParse(mov).success).toBe(true);
});

test.each([[InsumoRepository, Insumo], [FornecedorRepository, Fornecedor], [MovimentacaoRepository, Movimentacao]])('repositorio limita consulta e exclusao ao usuario', (repo, model) => {
  const find = jest.spyOn(model, 'findOne').mockReturnValue(null);
  const remove = jest.spyOn(model, 'deleteOne').mockReturnValue(null);
  repo.findByIdAndUsuario('item', uid);
  repo.deleteById('item', uid);
  expect(find).toHaveBeenCalledWith({ _id: 'item', usuarioId: uid });
  expect(remove).toHaveBeenCalledWith({ _id: 'item', usuarioId: uid });
});

test.each([[InsumoRepository, Insumo], [FornecedorRepository, Fornecedor]])('busca por nome escapa caracteres especiais', (repo, model) => {
  const find = jest.spyOn(model, 'findOne').mockReturnValue(null);
  repo.findByNomeAndUsuario(' A.* ', uid);
  expect(find).toHaveBeenCalledWith({ usuarioId: uid, nome: { $regex: '^A\\.\\*$', $options: 'i' } });
});

test('recuperacao de senha exige usuario ativo e token ainda valido', () => {
  const update = jest.spyOn(Usuario, 'findOneAndUpdate').mockReturnValue(null);
  const before = Date.now();
  UsuarioRepository.consumirRecuperacao('hash-token', 'hash-senha');
  const [filter, change] = update.mock.calls[0];
  expect(filter).toMatchObject({ recuperacaoHash: 'hash-token', ativo: true });
  expect(filter.recuperacaoExpiraEm.$gt.getTime()).toBeGreaterThanOrEqual(before);
  expect(change).toEqual({ $set: { senhaHash: 'hash-senha' }, $unset: { recuperacaoHash: 1, recuperacaoExpiraEm: 1 } });
});

test('edicao de insumo valida duplicidade e atualiza dados normalizados', async () => {
  const item = { _id: 'i1', nome: 'Antigo', ativo: true, save: jest.fn().mockResolvedValue() };
  jest.spyOn(InsumoRepository, 'findByIdAndUsuario').mockResolvedValue(item);
  const duplicate = jest.spyOn(InsumoRepository, 'findByNomeAndUsuario').mockResolvedValue({ _id: 'i2' });
  await expect(InsumoService.atualizar('i1', dto, uid)).rejects.toThrow('Ja existe');
  expect(item.save).not.toHaveBeenCalled();
  duplicate.mockResolvedValue(null);
  expect(await InsumoService.atualizar('i1', { ...dto, ativo: false }, uid)).toMatchObject({ nome: 'Arroz', categoria: 'Alimento', unidade: 'kg', ativo: false, fornecedorId: null });
  expect(item.save).toHaveBeenCalledTimes(1);
});

test('edicao e limpeza de fornecedores respeitam usuario e referencias', async () => {
  const item = { _id: 'f1', nome: 'Loja', ativo: true, save: jest.fn().mockResolvedValue() };
  jest.spyOn(FornecedorRepository, 'findByIdAndUsuario').mockResolvedValue(item);
  jest.spyOn(FornecedorRepository, 'findByNomeAndUsuario').mockResolvedValue(null);
  await FornecedorService.atualizar('f1', { nome: ' Nova ', email: ' TESTE@EXAMPLE.COM ', ativo: false }, uid);
  expect(item).toMatchObject({ nome: 'Nova', email: 'teste@example.com', ativo: false });
  jest.spyOn(FornecedorRepository, 'findAllByUsuario').mockResolvedValue([{ _id: 'f1' }, { _id: 'f2' }]);
  const insumos = jest.spyOn(InsumoRepository, 'nullifyFornecedor').mockResolvedValue();
  const movimentos = jest.spyOn(MovimentacaoRepository, 'nullifyFornecedor').mockResolvedValue();
  const apagar = jest.spyOn(FornecedorRepository, 'deleteAllByUsuario').mockResolvedValue();
  await FornecedorService.zerar(uid);
  expect(insumos.mock.calls).toEqual([[uid, 'f1'], [uid, 'f2']]);
  expect(movimentos.mock.calls).toEqual([[uid, 'f1'], [uid, 'f2']]);
  expect(apagar).toHaveBeenCalledWith(uid);
});

test('excluir e zerar insumos remove movimentacoes antes dos insumos', async () => {
  jest.spyOn(InsumoRepository, 'findByIdAndUsuario').mockResolvedValue({ _id: 'i1' });
  const ordem = [];
  jest.spyOn(MovimentacaoRepository, 'deleteAllByInsumo').mockImplementation(async () => ordem.push('movimento'));
  jest.spyOn(InsumoRepository, 'deleteById').mockImplementation(async () => ordem.push('insumo'));
  await InsumoService.excluir('i1', uid);
  expect(ordem).toEqual(['movimento', 'insumo']);
  const movs = jest.spyOn(MovimentacaoRepository, 'deleteAllByUsuario').mockResolvedValue();
  const itens = jest.spyOn(InsumoRepository, 'deleteAllByUsuario').mockResolvedValue();
  await InsumoService.zerar(uid);
  expect(movs).toHaveBeenCalledWith(uid); expect(itens).toHaveBeenCalledWith(uid);
});

test('edicao de movimentacao impede saldo negativo sem salvar', async () => {
  jest.spyOn(MovimentacaoRepository, 'findByIdAndUsuario').mockResolvedValue({ insumoId: 'i1', tipo: 'Compra', quantidade: 2 });
  jest.spyOn(InsumoRepository, 'findByIdAndUsuario').mockResolvedValue({ _id: 'i1', quantidadeAtual: 4, unidade: 'kg' });
  const update = jest.spyOn(MovimentacaoRepository, 'updateById').mockResolvedValue({});
  await expect(MovimentacaoService.atualizar('m1', mov, uid)).rejects.toThrow('Estoque insuficiente');
  expect(update).not.toHaveBeenCalled();
  const set = jest.spyOn(InsumoRepository, 'setEstoque').mockResolvedValue();
  await MovimentacaoService.atualizar('m1', { ...mov, quantidade: 1 }, uid);
  expect(set).toHaveBeenCalledWith('i1', 1);
});

test('cadastro com email pendente nao cria usuario nem envia email', async () => {
  jest.spyOn(UsuarioRepository, 'findByEmail').mockResolvedValue(null);
  jest.spyOn(CadastroPendenteRepository, 'findByEmail').mockResolvedValue({});
  const create = jest.spyOn(CadastroPendenteRepository, 'create');
  await expect(UsuarioService.cadastrar({ nome: 'Ana', email: 'ana@example.com', senha: 'senha123' })).rejects.toThrow('aguardando confirmacao');
  expect(create).not.toHaveBeenCalled();
});
