// Estado da aplicação
let clients = [];
let currentClientId = null;
let isGridView = true;

// Elementos DOM
const addClientBtn = document.getElementById('addClientBtn');
const clientModal = document.getElementById('clientModal');
const deleteModal = document.getElementById('deleteModal');
const clientForm = document.getElementById('clientForm');
const searchInput = document.getElementById('searchInput');
const clientsContainer = document.getElementById('clientsContainer');
const gridViewBtn = document.getElementById('gridViewBtn');
const listViewBtn = document.getElementById('listViewBtn');
const totalClientsSpan = document.getElementById('totalClients');
const todayClientsSpan = document.getElementById('todayClients');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadClients();
    setupEventListeners();
    setupFormValidation();
});

// Event Listeners
function setupEventListeners() {
    // Modal de cliente
    addClientBtn.addEventListener('click', () => openClientModal());
    document.getElementById('closeModal').addEventListener('click', closeClientModal);
    document.getElementById('cancelBtn').addEventListener('click', closeClientModal);
    clientForm.addEventListener('submit', handleClientSubmit);
    
    // Modal de exclusão
    document.getElementById('closeDeleteModal').addEventListener('click', closeDeleteModal);
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    
    // Busca
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Visualização
    gridViewBtn.addEventListener('click', () => setViewMode(true));
    listViewBtn.addEventListener('click', () => setViewMode(false));
    
    // Fechar modais clicando fora
    window.addEventListener('click', (e) => {
        if (e.target === clientModal) closeClientModal();
        if (e.target === deleteModal) closeDeleteModal();
    });
}

// Validação de formulário
function setupFormValidation() {
    const telefoneInput = document.getElementById('telefone');
    const cpfInput = document.getElementById('cpf');
    
    // Máscara para telefone
    telefoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 11) {
            value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (value.length >= 7) {
            value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else if (value.length >= 3) {
            value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
        }
        e.target.value = value;
    });
    
    // Máscara para CPF
    cpfInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 11) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (value.length >= 9) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
        } else if (value.length >= 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
        } else if (value.length >= 3) {
            value = value.replace(/(\d{3})(\d{0,3})/, '$1.$2');
        }
        e.target.value = value;
    });
}

// Carregar clientes
async function loadClients() {
  try {
    showLoading();
    const [clientsResponse, statsResponse] = await Promise.all([
      fetch('/api/clientes'),
      fetch('/api/estatisticas')
    ]);
    
    clients = await clientsResponse.json();
    const stats = await statsResponse.json();
    
    renderClients(clients);
    updateStats(stats);
  } catch (error) {
    showError('Erro ao carregar clientes: ' + error.message);
  }
}

// Renderizar clientes
function renderClients(clientsToRender) {
    if (clientsToRender.length === 0) {
        clientsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>Nenhum cliente encontrado</h3>
                <p>Clique em "Novo Cliente" para começar</p>
            </div>
        `;
        return;
    }
    
    const clientsHTML = clientsToRender.map(client => createClientCard(client)).join('');
    clientsContainer.innerHTML = clientsHTML;
    
    // Adicionar animação
    const cards = clientsContainer.querySelectorAll('.client-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('slide-up');
    });
}

// Criar card do cliente
function createClientCard(client) {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };
    
    const formatPhone = (phone) => {
        if (!phone) return '';
        const numbers = phone.replace(/\D/g, '');
        if (numbers.length === 11) {
            return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        return phone;
    };
    
    return `
        <div class="client-card ${isGridView ? '' : 'list-view'}">
            <div class="client-header">
                <div>
                    <div class="client-name">${client.nome}</div>
                    <div class="client-email">${client.email}</div>
                </div>
                <div class="client-actions">
                    <button class="action-btn edit-btn" onclick="editClient('${client.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteClient('${client.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="client-info">
                ${client.telefone ? `
                    <div class="info-item">
                        <i class="fas fa-phone"></i>
                        <span>${formatPhone(client.telefone)}</span>
                    </div>
                ` : ''}
                ${client.cpf ? `
                    <div class="info-item">
                        <i class="fas fa-id-card"></i>
                        <span>${client.cpf}</span>
                    </div>
                ` : ''}
                ${client.endereco ? `
                    <div class="info-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${client.endereco}${client.cidade ? `, ${client.cidade}` : ''}${client.estado ? ` - ${client.estado}` : ''}</span>
                    </div>
                ` : ''}
                <div class="info-item">
                    <i class="fas fa-calendar"></i>
                    <span>Cadastrado em ${formatDate(client.data_cadastro)}</span>
                </div>
            </div>
            ${client.observacoes ? `
                <div class="client-observations">
                    <strong>Observações:</strong> ${client.observacoes}
                </div>
            ` : ''}
        </div>
    `;
}

// Atualizar estatísticas
function updateStats(stats) {
  totalClientsSpan.textContent = stats.total || 0;
  todayClientsSpan.textContent = stats.hoje || 0;
}

// Modal de cliente
function openClientModal(client = null) {
    currentClientId = client ? client.id : null;
    document.getElementById('modalTitle').textContent = client ? 'Editar Cliente' : 'Novo Cliente';
    
    if (client) {
        // Preencher formulário com dados do cliente
        document.getElementById('nome').value = client.nome;
        document.getElementById('email').value = client.email;
        document.getElementById('telefone').value = client.telefone || '';
        document.getElementById('cpf').value = client.cpf || '';
        document.getElementById('endereco').value = client.endereco || '';
        document.getElementById('cidade').value = client.cidade || '';
        document.getElementById('estado').value = client.estado || '';
        document.getElementById('observacoes').value = client.observacoes || '';
    } else {
        // Limpar formulário
        clientForm.reset();
    }
    
    clientModal.style.display = 'block';
    document.getElementById('nome').focus();
}

function closeClientModal() {
    clientModal.style.display = 'none';
    currentClientId = null;
    clientForm.reset();
}

// Submissão do formulário
async function handleClientSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(clientForm);
    const clientData = Object.fromEntries(formData.entries());
    
    // Validações
    if (!clientData.nome.trim()) {
        showError('Nome é obrigatório');
        return;
    }
    
    if (!clientData.email.trim()) {
        showError('Email é obrigatório');
        return;
    }
    
    if (!isValidEmail(clientData.email)) {
        showError('Email inválido');
        return;
    }
    
    try {
        const url = currentClientId ? `/api/clientes/${currentClientId}` : '/api/clientes';
        const method = currentClientId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(clientData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showSuccess(currentClientId ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!');
            closeClientModal();
            loadClients();
        } else {
            showError(result.error || 'Erro ao salvar cliente');
        }
    } catch (error) {
        showError('Erro ao salvar cliente: ' + error.message);
    }
}

// Editar cliente
function editClient(id) {
    const client = clients.find(c => c.id === id);
    if (client) {
        openClientModal(client);
    } else {
        showError('Cliente não encontrado');
    }
}

// Deletar cliente
let clientToDelete = null;

function deleteClient(id) {
    const client = clients.find(c => c.id === id);
    if (client) {
        clientToDelete = id;
        deleteModal.style.display = 'block';
    } else {
        showError('Cliente não encontrado');
    }
}

function closeDeleteModal() {
    deleteModal.style.display = 'none';
    clientToDelete = null;
}

async function confirmDelete() {
    if (!clientToDelete) return;
    
    try {
        const response = await fetch(`/api/clientes/${clientToDelete}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showSuccess('Cliente excluído com sucesso!');
            closeDeleteModal();
            loadClients();
        } else {
            const result = await response.json();
            showError(result.error || 'Erro ao excluir cliente');
        }
    } catch (error) {
        showError('Erro ao excluir cliente: ' + error.message);
    }
}

// Busca
function handleSearch(e) {
    const term = e.target.value.toLowerCase().trim();
    
    if (term === '') {
        renderClients(clients);
        return;
    }
    
    const filteredClients = clients.filter(client => 
        client.nome.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        (client.telefone && client.telefone.includes(term)) ||
        (client.cpf && client.cpf.includes(term))
    );
    
    renderClients(filteredClients);
}

// Modo de visualização
function setViewMode(grid) {
    isGridView = grid;
    gridViewBtn.classList.toggle('active', grid);
    listViewBtn.classList.toggle('active', !grid);
    
    const cards = clientsContainer.querySelectorAll('.client-card');
    cards.forEach(card => {
        card.classList.toggle('list-view', !grid);
    });
}

// Utilitários
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showLoading() {
    clientsContainer.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner"></i>
            <p>Carregando clientes...</p>
        </div>
    `;
}

function showError(message) {
    // Criar notificação de erro
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    // Adicionar estilos inline para a notificação
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fed7d7;
        color: #c53030;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function showSuccess(message) {
    // Criar notificação de sucesso
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    // Adicionar estilos inline para a notificação
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #c6f6d5;
        color: #2f855a;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}


// Adicionar animação CSS para as notificações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);
