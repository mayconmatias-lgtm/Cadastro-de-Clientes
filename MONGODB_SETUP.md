# Configuração do MongoDB

Este guia explica como configurar o MongoDB para o Sistema de Cadastro de Clientes.

## 🚀 Opção 1: MongoDB Local

### 1. Instalar MongoDB Community Server

**Windows:**
1. Baixe o instalador em: https://www.mongodb.com/try/download/community
2. Execute o instalador e siga as instruções
3. Durante a instalação, marque "Install MongoDB as a Service"
4. Marque "Install MongoDB Compass" (interface gráfica opcional)

**macOS:**
```bash
# Usando Homebrew
brew tap mongodb/brew
brew install mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
# Importar chave pública
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Adicionar repositório
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Instalar MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org
```

### 2. Iniciar o MongoDB

**Windows:**
- O MongoDB será iniciado automaticamente como serviço
- Ou execute: `net start MongoDB`

**macOS/Linux:**
```bash
# Iniciar MongoDB
sudo systemctl start mongod

# Verificar status
sudo systemctl status mongod

# Iniciar automaticamente no boot
sudo systemctl enable mongod
```

### 3. Verificar Instalação

```bash
# Conectar ao MongoDB
mongosh

# Ou versão mais antiga
mongo
```

## 🌐 Opção 2: MongoDB Atlas (Nuvem)

### 1. Criar Conta
1. Acesse: https://www.mongodb.com/atlas
2. Crie uma conta gratuita
3. Escolha o plano "Free" (M0)

### 2. Criar Cluster
1. Clique em "Build a Database"
2. Escolha "FREE" (M0 Sandbox)
3. Selecione uma região próxima
4. Escolha um nome para o cluster
5. Clique em "Create"

### 3. Configurar Acesso
1. Crie um usuário de banco de dados
2. Configure o IP whitelist (0.0.0.0/0 para desenvolvimento)
3. Obtenha a string de conexão

### 4. String de Conexão
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/sistema_clientes?retryWrites=true&w=majority
```

## ⚙️ Configuração do Projeto

### 1. Configurar Variáveis de Ambiente

Copie o arquivo `config.env` para `.env`:

```bash
cp config.env .env
```

### 2. Editar .env

**Para MongoDB Local:**
```env
MONGODB_URI=mongodb://localhost:27017/sistema_clientes
```

**Para MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://usuario:senha@cluster0.xxxxx.mongodb.net/sistema_clientes?retryWrites=true&w=majority
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Executar o Sistema

```bash
npm start
```

## 🔧 Comandos Úteis

### MongoDB Shell (mongosh)

```javascript
// Conectar ao banco
use sistema_clientes

// Ver coleções
show collections

// Ver documentos da coleção clientes
db.clientes.find()

// Contar documentos
db.clientes.countDocuments()

// Deletar todos os documentos (cuidado!)
db.clientes.deleteMany({})

// Ver estatísticas
db.clientes.aggregate([
  { $group: { _id: null, total: { $sum: 1 } } }
])
```

### Backup e Restore

```bash
# Backup
mongodump --db sistema_clientes --out backup/

# Restore
mongorestore --db sistema_clientes backup/sistema_clientes/
```

## 🐛 Solução de Problemas

### Erro de Conexão

**Problema:** `MongoServerError: connection timed out`

**Solução:**
1. Verifique se o MongoDB está rodando
2. Verifique a string de conexão
3. Para Atlas, verifique o IP whitelist

### Erro de Autenticação

**Problema:** `MongoServerError: Authentication failed`

**Solução:**
1. Verifique usuário e senha
2. Verifique se o usuário tem permissões
3. Para Atlas, verifique a string de conexão

### Porta em Uso

**Problema:** `EADDRINUSE: address already in use :::27017`

**Solução:**
```bash
# Encontrar processo usando a porta
lsof -i :27017

# Matar processo
kill -9 <PID>
```

### Permissões

**Problema:** `Permission denied`

**Solução:**
```bash
# Dar permissões ao diretório de dados
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chown -R mongodb:mongodb /var/log/mongodb
```

## 📊 Monitoramento

### MongoDB Compass
- Interface gráfica para visualizar dados
- Baixe em: https://www.mongodb.com/products/compass

### Logs
```bash
# Ver logs do MongoDB
tail -f /var/log/mongodb/mongod.log

# Windows
type "C:\Program Files\MongoDB\Server\7.0\log\mongod.log"
```

## 🔒 Segurança

### Produção
1. Use autenticação
2. Configure SSL/TLS
3. Restrinja IPs de acesso
4. Use senhas fortes
5. Mantenha o MongoDB atualizado

### Desenvolvimento
1. Use MongoDB local quando possível
2. Não exponha o banco na internet
3. Use variáveis de ambiente para credenciais

## 📚 Recursos Adicionais

- [Documentação MongoDB](https://docs.mongodb.com/)
- [MongoDB University](https://university.mongodb.com/)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [MongoDB Compass](https://www.mongodb.com/products/compass)
