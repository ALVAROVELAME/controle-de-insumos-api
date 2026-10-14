import { FornecedorRepository } from "../repositories/FornecedorRepository";
import { InsumoRepository } from "../repositories/InsumoRepository";
import { MovimentacaoRepository } from "../repositories/MovimentacaoRepository";
import { ConflictError, NotFoundError } from "../errors/AppError";
import type { CriarFornecedorDTOType } from "../dtos/fornecedores/FornecedorDTO";

export const FornecedorService = {
  listar: (usuarioId: string) =>
    FornecedorRepository.findAllByUsuario(usuarioId),

  async criar(dto: CriarFornecedorDTOType, usuarioId: string) {
    const existente = await FornecedorRepository.findByNomeAndUsuario(
      dto.nome,
      usuarioId
    );
    if (existente)
      throw new ConflictError("Ja existe um fornecedor com este nome.");

    return FornecedorRepository.create({
      usuarioId: usuarioId as never,
      nome: dto.nome.trim(),
      documento: dto.documento?.trim() || null,
      telefone: dto.telefone?.trim() || null,
      email: dto.email ? String(dto.email).toLowerCase().trim() : null,
      observacoes: dto.observacoes ?? null,
      ativo: dto.ativo ?? true,
    });
  },

  async atualizar(id: string, dto: CriarFornecedorDTOType, usuarioId: string) {
    const atual = await FornecedorRepository.findByIdAndUsuario(id, usuarioId);
    if (!atual) throw new NotFoundError("Fornecedor nao encontrado.");

    if (dto.nome.trim().toLowerCase() !== atual.nome.trim().toLowerCase()) {
      const duplicado = await FornecedorRepository.findByNomeAndUsuario(
        dto.nome,
        usuarioId
      );
      if (duplicado && String(duplicado._id) !== id) {
        throw new ConflictError("Ja existe um fornecedor com este nome.");
      }
    }

    atual.nome = dto.nome.trim();
    atual.documento = dto.documento?.trim() || null;
    atual.telefone = dto.telefone?.trim() || null;
    atual.email = dto.email ? String(dto.email).toLowerCase().trim() : null;
    atual.observacoes = dto.observacoes ?? null;
    if (dto.ativo !== undefined) atual.ativo = dto.ativo;

    await atual.save();
    return atual;
  },

  async excluir(id: string, usuarioId: string): Promise<void> {
    const fornecedor = await FornecedorRepository.findByIdAndUsuario(
      id,
      usuarioId
    );
    if (!fornecedor) throw new NotFoundError("Fornecedor nao encontrado.");

    await InsumoRepository.nullifyFornecedor(usuarioId, id);
    await MovimentacaoRepository.nullifyFornecedor(usuarioId, id);
    await FornecedorRepository.deleteById(id, usuarioId);
  },

  async zerar(usuarioId: string): Promise<void> {
    const todos = await FornecedorRepository.findAllByUsuario(usuarioId);
    for (const f of todos) {
      await InsumoRepository.nullifyFornecedor(usuarioId, String(f._id));
      await MovimentacaoRepository.nullifyFornecedor(usuarioId, String(f._id));
    }
    await FornecedorRepository.deleteAllByUsuario(usuarioId);
  },
};