const Meta = require('../models/Meta');
const Cliente = require('../models/Cliente');

const normalizarMesAno = (valorMes, valorAno) => {
  const mes = Number(valorMes);
  const ano = Number(valorAno);

  if (
    Number.isNaN(mes) ||
    Number.isNaN(ano) ||
    mes < 1 ||
    mes > 12 ||
    ano < 2000 ||
    ano > 2100
  ) {
    throw new Error('Período inválido');
  }

  return { mes, ano };
};

const obterIntervaloMes = (ano, mes) => {
  const inicio = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
  const fim = new Date(ano, mes, 1, 0, 0, 0, 0);
  return { inicio, fim };
};

const calcularPercentual = (atual, meta) => {
  if (!meta || meta === 0) {
    return null;
  }
  const porcentagem = (atual / meta) * 100;
  return Number(porcentagem.toFixed(2));
};

exports.criarMeta = async (req, res) => {
  try {
    const { mes, ano, descricao, metaNovosClientes, metaValorPago, metaValorPendente, metaRetencao, responsavel, criadoPor } = req.body;

    if (!mes || !ano) {
      return res.status(400).json({ error: 'Mês e ano são obrigatórios' });
    }

    const { mes: mesNormalizado, ano: anoNormalizado } = normalizarMesAno(mes, ano);

    const metaExistente = await Meta.findOne({ mes: mesNormalizado, ano: anoNormalizado });
    if (metaExistente) {
      return res.status(409).json({ error: 'Meta para este período já existe' });
    }

    const novaMeta = await Meta.create({
      mes: mesNormalizado,
      ano: anoNormalizado,
      descricao,
      metaNovosClientes,
      metaValorPago,
      metaValorPendente,
      metaRetencao,
      responsavel,
      criadoPor
    });

    res.status(201).json({
      message: 'Meta criada com sucesso',
      meta: novaMeta.toJSON()
    });
  } catch (error) {
    if (error.message === 'Período inválido') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.listarMetas = async (req, res) => {
  try {
    const { ano } = req.query;
    const filtro = {};
    if (ano) {
      const anoNum = Number(ano);
      if (Number.isNaN(anoNum)) {
        return res.status(400).json({ error: 'Ano inválido' });
      }
      filtro.ano = anoNum;
    }

    const metas = await Meta.find(filtro).sort({ ano: -1, mes: -1 });
    res.json(metas.map(meta => meta.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.obterMetaPeriodo = async (req, res) => {
  try {
    const { mes, ano } = normalizarMesAno(req.params.mes, req.params.ano);
    const meta = await Meta.findOne({ mes, ano });

    const { inicio, fim } = obterIntervaloMes(ano, mes);
    const metricas = await Cliente.obterMetricasPorPeriodo(inicio, fim);

    const progresso = {
      ...metricas,
      percentualNovosClientes: calcularPercentual(metricas.novosClientes, meta?.metaNovosClientes || 0),
      percentualValorPago: calcularPercentual(metricas.valorPago, meta?.metaValorPago || 0),
      percentualValorPendente: calcularPercentual(metricas.valorPendente, meta?.metaValorPendente || 0),
      percentualRetencao: calcularPercentual(metricas.retencao, meta?.metaRetencao || 0)
    };

    res.json({
      meta: meta ? meta.toJSON() : null,
      progresso
    });
  } catch (error) {
    if (error.message === 'Período inválido') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.atualizarMeta = async (req, res) => {
  try {
    const metaAtualizada = await Meta.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!metaAtualizada) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    res.json({
      message: 'Meta atualizada com sucesso',
      meta: metaAtualizada.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removerMeta = async (req, res) => {
  try {
    const metaRemovida = await Meta.findByIdAndDelete(req.params.id);
    if (!metaRemovida) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    res.json({ message: 'Meta removida com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

