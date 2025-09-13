const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema_clientes';

// Configurações de conexão
const options = {
  maxPoolSize: 10, // Manter até 10 conexões no pool
  serverSelectionTimeoutMS: 5000, // Manter tentando enviar operações por 5 segundos
  socketTimeoutMS: 45000, // Fechar sockets após 45 segundos de inatividade
};

// Conectar ao MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, options);
    
    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Eventos de conexão
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose conectado ao MongoDB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erro na conexão MongoDB:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose desconectado do MongoDB');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🛑 Conexão MongoDB fechada devido ao encerramento da aplicação');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Erro ao conectar com MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
