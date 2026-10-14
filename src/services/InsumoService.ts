import { InsumoRepository } from "../repositories/InsumoRepository";
import { FornecedorRepository } from "../repositories/FornecedorRepository";
import { MovimentacaoRepository } from "../repositories/MovimentacaoRepository";
import { ConflictError, NotFoundError } from "../errors/AppError";
import type { CriarInsumoDTOType } from "../dtos/insumos/InsumoDTO";

export const InsumoService = {
  listar: (usuarioId: string) => InsumoRepository.findAllByUsuario(usuarioId),

  async criar(dto: CriarInsumoDTOType, usuarioId: string) {
    const existente = await InsumoRepository.findByNomeAndUsuario(
      dto.nome,
      usuarioId
    );
    if (existente) throw new ConflictError("Ja existe um insumo com este nome.");

    if (dto.fornecedorId) {
      const f = await FornecedorRepository.findByIdAndUsuario(
        dto.fornecedorId,
        usuarioId
      );
      if (!f) throw new NotFoundError("Fornecedor nao encontrado.");
    }

    return InsumoRepository.create({
      usuarioId: usuarioId as never,
      nome: dto.nome.trim(),
      categoria: dto.categoria.trim(),
      unidade: dto.unidade.trim(),
      quantidadeAtual: dto.quantidadeAtual,
      quantidadeMinima: dto.quantidadeMinima,
      precoCompra: dto.precoCompra,
      precoVenda: dto.precoVenda,
      fornecedorId: dto.fornecedorId ? (dto.fornecedorId as never) : null,
      observacoes: dto.observacoes ?? null,
      ativo: dto.ativo ?? true,
    });
  },

  async atualizar(id: string, dto: CriarInsumoDTOType, usuarioId: string) {
    const atual = await InsumoRepository.findByIdAndUsuario(id, usuarioId);
    if (!atual) throw new NotFoundError("Insumo nao encontrado.");

    if (dto.fornecedorId) {
      const f = await FornecedorRepository.findByIdAndUsuario(
        dto.fornecedorId,
        usuarioId
      );
      if (!f) throw new NotFoundError("Fornecedor nao encontrado.");
    }

    if (dto.nome.trim().toLowerCase() !== atual.nome.trim().toLowerCase()) {
      const duplicado = await InsumoRepository.findByNomeAndUsuario(
        dto.nome,
        usuarioId
      );
      if (duplicado && String(duplicado._id) !== id) {
        throw new ConflictError("Ja existe um insumo com este nome.");
      }
    }

    atual.nome = dto.nome.trim();
    atual.categoria = dto.categoria.trim();
    atual.unidade = dto.unidade.trim();
    atual.quantidadeAtual = dto.quantidadeAtual;
    atual.quantidadeMinima = dto.quantidadeMinima;
    atual.precoCompra = dto.precoCompra;
    atual.precoVenda = dto.precoVenda;
    atual.fornecedorId = dto.fornecedorId ? (dto.fornecedorId as never) : null;
    atual.observacoes = dto.observacoes ?? null;
    if (dto.ativo !== undefined) atual.ativo = dto.ativo;

    await atual.save();
    return atual;
  },

  async excluir(id: string, usuarioId: string): Promise<void> {
    const insumo = await InsumoRepository.findByIdAndUsuario(id, usuarioId);
    if (!insumo) throw new NotFoundError("Insumo nao encontrado.");

    await MovimentacaoRepository.deleteAllByInsumo(usuarioId, id);
    await InsumoRepository.deleteById(id, usuarioId);
  },

  async zerar(usuarioId: string): Promise<void> {
    await MovimentacaoRepository.deleteAllByUsuario(usuarioId);
    await InsumoRepository.deleteAllByUsuario(usuarioId);
  },
};