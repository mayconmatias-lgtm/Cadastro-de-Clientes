const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./config/database');
const Cliente = require('./models/Cliente');

const app = express();
const PORT = process.env.PORT || 3001;

// Conectar ao MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json({ charset: 'utf-8' }));
app.use(bodyParser.urlencoded({ extended: true, charset: 'utf-8' }));
app.use(express.static('public'));

// Rotas da API

// Listar todos os clientes
app.get('/api/clientes', async (req, res) => {
  try {
    const clientes = await Cliente.find({ ativo: true })
      .sort({ data_cadastro: -1 });
    
    // Aplicar toJSON() para converter _id para id
    const clientesFormatados = clientes.map(cliente => cliente.toJSON());
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(clientesFormatados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar cliente por ID
app.get('/api/clientes/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente || !cliente.ativo) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(cliente.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cadastrar novo cliente
app.post('/api/clientes', async (req, res) => {
  try {
    const { nome, email, telefone, endereco, cidade, estado, cpf, observacoes, valor, status_pagamento, categoria } = req.body;
    
    // Validações básicas
    if (!nome || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    const cliente = new Cliente({
      nome,
      email,
      telefone,
      endereco,
      cidade,
      estado,
      cpf,
      observacoes,
      valor: valor || 0,
      status_pagamento: status_pagamento || 'pendente',
      categoria: categoria || 'Regular'
    });

    await cliente.save();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(201).json({ 
      id: cliente._id, 
      message: 'Cliente cadastrado com sucesso' 
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      res.status(400).json({ error: messages.join(', ') });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Atualizar cliente
app.put('/api/clientes/:id', async (req, res) => {
  try {
    const { nome, email, telefone, endereco, cidade, estado, cpf, observacoes, valor, status_pagamento, categoria } = req.body;
    
    if (!nome || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      {
        nome,
        email,
        telefone,
        endereco,
        cidade,
        estado,
        cpf,
        observacoes,
        valor,
        status_pagamento,
        categoria
      },
      { new: true, runValidators: true }
    );

    if (!cliente || !cliente.ativo) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({ message: 'Cliente atualizado com sucesso' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      res.status(400).json({ error: messages.join(', ') });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Deletar cliente (soft delete)
app.delete('/api/clientes/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      { ativo: false },
      { new: true }
    );

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({ message: 'Cliente deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar clientes
app.get('/api/clientes/buscar/:termo', async (req, res) => {
  try {
    const termo = req.params.termo;
    const clientes = await Cliente.buscarClientes(termo);
    const clientesFormatados = clientes.map(cliente => cliente.toJSON());
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(clientesFormatados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estatísticas
app.get('/api/estatisticas', async (req, res) => {
  try {
    const stats = await Cliente.obterEstatisticas();
    const resultado = stats.length > 0 ? stats[0] : { 
      total: 0, 
      hoje: 0,
      totalPago: 0,
      totalPendente: 0,
      totalCancelado: 0,
      valorTotal: 0,
      valorPago: 0,
      valorPendente: 0
    };
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estatísticas por categoria
app.get('/api/estatisticas/categorias', async (req, res) => {
  try {
    const stats = await Cliente.obterEstatisticasPorCategoria();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estatísticas por estado
app.get('/api/estatisticas/estados', async (req, res) => {
  try {
    const stats = await Cliente.obterEstatisticasPorEstado();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Servir a página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Acesse: http://localhost:${PORT}`);
  console.log(`🗄️  MongoDB: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema_clientes'}`);
});
