const mongoose = require('mongoose');

const metaSchema = new mongoose.Schema({
  ano: {
    type: Number,
    required: true,
    min: [2000, 'Ano inválido'],
    max: [2100, 'Ano inválido']
  },
  mes: {
    type: Number,
    required: true,
    min: [1, 'Mês inválido'],
    max: [12, 'Mês inválido']
  },
  descricao: {
    type: String,
    trim: true,
    maxlength: [200, 'Descrição deve ter no máximo 200 caracteres']
  },
  metaNovosClientes: {
    type: Number,
    default: 0,
    min: [0, 'Meta não pode ser negativa']
  },
  metaValorPago: {
    type: Number,
    default: 0,
    min: [0, 'Meta não pode ser negativa']
  },
  metaValorPendente: {
    type: Number,
    default: 0,
    min: [0, 'Meta não pode ser negativa']
  },
  metaRetencao: {
    type: Number,
    default: 0,
    min: [0, 'Meta não pode ser negativa'],
    max: [100, 'Retenção deve ser percentual entre 0 e 100']
  },
  responsavel: {
    type: String,
    trim: true,
    maxlength: [100, 'Responsável deve ter no máximo 100 caracteres']
  },
  criadoPor: {
    type: String,
    trim: true,
    maxlength: [100, 'Nome deve ter no máximo 100 caracteres']
  }
}, {
  timestamps: true,
  versionKey: false
});

metaSchema.index({ ano: 1, mes: 1 }, { unique: true });

metaSchema.virtual('periodo').get(function() {
  return `${this.mes.toString().padStart(2, '0')}/${this.ano}`;
});

metaSchema.methods.toJSON = function() {
  const obj = this.toObject({ virtuals: true });
  obj.id = obj._id;
  delete obj._id;
  return obj;
};

module.exports = mongoose.model('Meta', metaSchema);

