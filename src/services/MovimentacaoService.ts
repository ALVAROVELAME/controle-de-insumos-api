import { MovimentacaoRepository } from "../repositories/MovimentacaoRepository";
import { InsumoRepository } from "../repositories/InsumoRepository";
import { FornecedorRepository } from "../repositories/FornecedorRepository";
import { AppError, NotFoundError } from "../errors/AppError";
import type { CriarMovimentacaoDTOType } from "../dtos/movimentacoes/MovimentacaoDTO";
import type { TipoMov } from "../models/Movimentacao";

function calcularDeltaEstoque(tipo: TipoMov, quantidade: number): number {
  if (tipo === "Venda") return -Math.abs(quantidade);
  if (tipo === "Compra") return Math.abs(quantidade);
  return quantidade;
}

function calcularTotal(
  tipo: TipoMov,
  quantidade: number,
  precoUnitario: number
): number {
  if (tipo === "Ajuste") return 0;
  return Math.abs(quantidade) * precoUnitario;
}

async function validarFornecedor(
  fornecedorId: string | null | undefined,
  usuarioId: string
) {
  if (!fornecedorId) return;
  const f = await FornecedorRepository.findByIdAndUsuario(
    fornecedorId,
    usuarioId
  );
  if (!f) throw new NotFoundError("Fornecedor nao encontrado.");
}

export const MovimentacaoService = {
  listar: (usuarioId: string) =>
    MovimentacaoRepository.findAllByUsuario(usuarioId),

  async criar(dto: CriarMovimentacaoDTOType, usuarioId: string) {
    const insumo = await InsumoRepository.findByIdAndUsuario(
      dto.insumoId,
      usuarioId
    );
    if (!insumo) throw new NotFoundError("Insumo nao encontrado.");

    await validarFornecedor(dto.fornecedorId, usuarioId);

    const delta = calcularDeltaEstoque(dto.tipo, dto.quantidade);
    const novoEstoque = insumo.quantidadeAtual + delta;
    if (novoEstoque < 0) {
      throw new AppError(
        dto.tipo === "Venda"
          ? `Estoque insuficiente. Disponivel: ${insumo.quantidadeAtual} ${insumo.unidade}.`
          : "Este ajuste deixaria o estoque negativo."
      );
    }

    const total = calcularTotal(dto.tipo, dto.quantidade, dto.precoUnitario);

    const mov = await MovimentacaoRepository.create({
      usuarioId: usuarioId as never,
      insumoId: insumo._id,
      tipo: dto.tipo,
      quantidade: dto.quantidade,
      precoUnitario: dto.precoUnitario,
      total,
      data: new Date(dto.data),
      fornecedorId: dto.fornecedorId ? (dto.fornecedorId as never) : null,
      cliente: dto.cliente ?? null,
      observacoes: dto.observacoes ?? null,
    });

    try {
      await InsumoRepository.setEstoque(String(insumo._id), novoEstoque);
    } catch (err) {
      await MovimentacaoRepository.deleteById(String(mov._id), usuarioId);
      throw err;
    }

    return mov;
  },

  async atualizar(
    id: string,
    dto: CriarMovimentacaoDTOType,
    usuarioId: string
  ) {
    const antiga = await MovimentacaoRepository.findByIdAndUsuario(
      id,
      usuarioId
    );
    if (!antiga) throw new NotFoundError("Movimentacao nao encontrada.");

    const insumoAntigo = await InsumoRepository.findByIdAndUsuario(
      String(antiga.insumoId),
      usuarioId
    );
    if (!insumoAntigo)
      throw new NotFoundError("Insumo original nao encontrado.");

    const mudouInsumo = String(antiga.insumoId) !== dto.insumoId;
    const insumoNovo = mudouInsumo
      ? await InsumoRepository.findByIdAndUsuario(dto.insumoId, usuarioId)
      : insumoAntigo;
    if (!insumoNovo) throw new NotFoundError("Insumo nao encontrado.");

    await validarFornecedor(dto.fornecedorId, usuarioId);

    const deltaAntigo = calcularDeltaEstoque(antiga.tipo, antiga.quantidade);
    const deltaNovo = calcularDeltaEstoque(dto.tipo, dto.quantidade);

    const estoqueAntigoApos = insumoAntigo.quantidadeAtual - deltaAntigo;
    if (estoqueAntigoApos < 0) {
      throw new AppError(
        "Nao foi possivel atualizar: o estoque original ficaria negativo."
      );
    }

    let estoqueAntigoFinal = estoqueAntigoApos;
    let estoqueNovoFinal: number | null = null;

    if (!mudouInsumo) {
      estoqueAntigoFinal = estoqueAntigoApos + deltaNovo;
      if (estoqueAntigoFinal < 0) {
        throw new AppError(
          dto.tipo === "Venda"
            ? `Estoque insuficiente. Disponivel: ${estoqueAntigoApos} ${insumoAntigo.unidade}.`
            : "Este ajuste deixaria o estoque negativo."
        );
      }
    } else {
      estoqueNovoFinal = insumoNovo.quantidadeAtual + deltaNovo;
      if (estoqueNovoFinal < 0) {
        throw new AppError("Estoque insuficiente no insumo de destino.");
      }
    }

    const total = calcularTotal(dto.tipo, dto.quantidade, dto.precoUnitario);

    const atualizada = await MovimentacaoRepository.updateById(id, usuarioId, {
      insumoId: insumoNovo._id,
      tipo: dto.tipo,
      quantidade: dto.quantidade,
      precoUnitario: dto.precoUnitario,
      total,
      data: new Date(dto.data),
      fornecedorId: dto.fornecedorId ? (dto.fornecedorId as never) : null,
      cliente: dto.cliente ?? null,
      observacoes: dto.observacoes ?? null,
    });

    if (!atualizada) throw new NotFoundError("Movimentacao nao encontrada.");

    if (!mudouInsumo) {
      await InsumoRepository.setEstoque(
        String(insumoAntigo._id),
        estoqueAntigoFinal
      );
    } else {
      await InsumoRepository.setEstoque(
        String(insumoAntigo._id),
        estoqueAntigoApos
      );
      if (estoqueNovoFinal !== null) {
        await InsumoRepository.setEstoque(
          String(insumoNovo._id),
          estoqueNovoFinal
        );
      }
    }

    return atualizada;
  },

  async excluir(id: string, usuarioId: string): Promise<void> {
    const mov = await MovimentacaoRepository.findByIdAndUsuario(id, usuarioId);
    if (!mov) throw new NotFoundError("Movimentacao nao encontrada.");

    const insumo = await InsumoRepository.findByIdAndUsuario(
      String(mov.insumoId),
      usuarioId
    );
    if (!insumo) throw new NotFoundError("Insumo nao encontrado.");

    const delta = calcularDeltaEstoque(mov.tipo, mov.quantidade);
    const novoEstoque = insumo.quantidadeAtual - delta;
    if (novoEstoque < 0) {
      throw new AppError(
        "Nao e possivel excluir: o estoque ficaria negativo."
      );
    }

    await MovimentacaoRepository.deleteById(id, usuarioId);
    await InsumoRepository.setEstoque(String(insumo._id), novoEstoque);
  },

  async zerar(usuarioId: string): Promise<void> {
    await MovimentacaoRepository.deleteAllByUsuario(usuarioId);
  },
};