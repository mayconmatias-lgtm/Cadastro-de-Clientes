const mongoose = require('mongoose');

// Schema do Cliente
const clienteSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    minlength: [2, 'Nome deve ter pelo menos 2 caracteres'],
    maxlength: [100, 'Nome deve ter no máximo 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  telefone: {
    type: String,
    trim: true,
    match: [/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato de telefone inválido']
  },
  endereco: {
    type: String,
    trim: true,
    maxlength: [200, 'Endereço deve ter no máximo 200 caracteres']
  },
  cidade: {
    type: String,
    trim: true,
    maxlength: [50, 'Cidade deve ter no máximo 50 caracteres']
  },
  estado: {
    type: String,
    trim: true,
    uppercase: true,
    enum: {
      values: ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'],
      message: 'Estado inválido'
    }
  },
  cpf: {
    type: String,
    trim: true,
    match: [/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Formato de CPF inválido']
  },
  observacoes: {
    type: String,
    trim: true,
    maxlength: [500, 'Observações devem ter no máximo 500 caracteres']
  },
  valor: {
    type: Number,
    default: 0,
    min: [0, 'Valor não pode ser negativo']
  },
  status_pagamento: {
    type: String,
    enum: {
      values: ['pago', 'pendente', 'cancelado'],
      message: 'Status de pagamento inválido'
    },
    default: 'pendente'
  },
  categoria: {
    type: String,
    enum: {
      values: ['VIP', 'Regular', 'Lead', 'Inativo', 'Outro'],
      message: 'Categoria inválida'
    },
    default: 'Regular'
  },
  data_cadastro: {
    type: Date,
    default: Date.now
  },
  ativo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Adiciona createdAt e updatedAt automaticamente
  versionKey: false // Remove o campo __v
});

// Índices para melhor performance
clienteSchema.index({ nome: 'text', email: 'text' }); // Índice de texto para busca
clienteSchema.index({ data_cadastro: -1 });

// Middleware para formatação antes de salvar
clienteSchema.pre('save', function(next) {
  // Formatar telefone se não estiver no formato correto
  if (this.telefone && !this.telefone.match(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)) {
    const numbers = this.telefone.replace(/\D/g, '');
    if (numbers.length === 11) {
      this.telefone = numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numbers.length === 10) {
      this.telefone = numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
  }
  
  // Formatar CPF se não estiver no formato correto
  if (this.cpf && !this.cpf.match(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)) {
    const numbers = this.cpf.replace(/\D/g, '');
    if (numbers.length === 11) {
      this.cpf = numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
  }
  
  next();
});

// Método estático para buscar clientes
clienteSchema.statics.buscarClientes = function(termo) {
  const regex = new RegExp(termo, 'i');
  return this.find({
    $or: [
      { nome: regex },
      { email: regex },
      { telefone: regex },
      { cpf: regex }
    ],
    ativo: true
  }).sort({ data_cadastro: -1 });
};

// Método estático para estatísticas
clienteSchema.statics.obterEstatisticas = function() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  
  return this.aggregate([
    {
      $match: { ativo: true }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        hoje: {
          $sum: {
            $cond: [
              { $and: [
                { $gte: ['$data_cadastro', hoje] },
                { $lt: ['$data_cadastro', amanha] }
              ]},
              1,
              0
            ]
          }
        },
        totalPago: {
          $sum: {
            $cond: [{ $eq: ['$status_pagamento', 'pago'] }, 1, 0]
          }
        },
        totalPendente: {
          $sum: {
            $cond: [{ $eq: ['$status_pagamento', 'pendente'] }, 1, 0]
          }
        },
        totalCancelado: {
          $sum: {
            $cond: [{ $eq: ['$status_pagamento', 'cancelado'] }, 1, 0]
          }
        },
        valorTotal: { $sum: '$valor' },
        valorPago: {
          $sum: {
            $cond: [{ $eq: ['$status_pagamento', 'pago'] }, '$valor', 0]
          }
        },
        valorPendente: {
          $sum: {
            $cond: [{ $eq: ['$status_pagamento', 'pendente'] }, '$valor', 0]
          }
        }
      }
    }
  ]);
};

// Método estático para estatísticas por categoria
clienteSchema.statics.obterEstatisticasPorCategoria = function() {
  return this.aggregate([
    {
      $match: { ativo: true }
    },
    {
      $group: {
        _id: '$categoria',
        total: { $sum: 1 },
        valorTotal: { $sum: '$valor' }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
};

// Método estático para estatísticas por estado
clienteSchema.statics.obterEstatisticasPorEstado = function() {
  return this.aggregate([
    {
      $match: { ativo: true, estado: { $ne: null, $ne: '' } }
    },
    {
      $group: {
        _id: '$estado',
        total: { $sum: 1 }
      }
    },
    {
      $sort: { total: -1 }
    },
    {
      $limit: 10
    }
  ]);
};

// Método estático para métricas por período (dashboard de metas)
clienteSchema.statics.obterMetricasPorPeriodo = async function(inicio, fim) {
  const filtroPeriodo = { ativo: true };

  if (inicio || fim) {
    filtroPeriodo.data_cadastro = {};
    if (inicio) {
      filtroPeriodo.data_cadastro.$gte = inicio;
    }
    if (fim) {
      filtroPeriodo.data_cadastro.$lt = fim;
    }
  }

  const [stats] = await this.aggregate([
    { $match: filtroPeriodo },
    {
      $group: {
        _id: null,
        novosClientes: { $sum: 1 },
        valorTotal: { $sum: '$valor' },
        valorPago: {
          $sum: {
            $cond: [{ $eq: ['$status_pagamento', 'pago'] }, '$valor', 0]
          }
        },
        valorPendente: {
          $sum: {
            $cond: [{ $eq: ['$status_pagamento', 'pendente'] }, '$valor', 0]
          }
        },
        valorCancelado: {
          $sum: {
            $cond: [{ $eq: ['$status_pagamento', 'cancelado'] }, '$valor', 0]
          }
        }
      }
    }
  ]);

  const totalClientes = await this.countDocuments({});
  const clientesAtivos = await this.countDocuments({ ativo: true });
  const retencao = totalClientes === 0 ? 0 : Number(((clientesAtivos / totalClientes) * 100).toFixed(2));

  return {
    novosClientes: stats?.novosClientes || 0,
    valorTotal: stats?.valorTotal || 0,
    valorPago: stats?.valorPago || 0,
    valorPendente: stats?.valorPendente || 0,
    valorCancelado: stats?.valorCancelado || 0,
    clientesAtivos,
    totalClientes,
    retencao
  };
};

// Método de instância para formatação
clienteSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  return obj;
};

module.exports = mongoose.model('Cliente', clienteSchema);
