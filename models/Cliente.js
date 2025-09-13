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
    unique: true,
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
    unique: true,
    sparse: true, // Permite múltiplos documentos sem CPF
    trim: true,
    match: [/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Formato de CPF inválido']
  },
  observacoes: {
    type: String,
    trim: true,
    maxlength: [500, 'Observações devem ter no máximo 500 caracteres']
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
        }
      }
    }
  ]);
};

// Método de instância para formatação
clienteSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  return obj;
};

module.exports = mongoose.model('Cliente', clienteSchema);
