// Estado da aplicação
let clients = [];
let currentClientId = null;
let isGridView = true;

// Variáveis dos gráficos
let categoryChart = null;
let paymentChart = null;
let stateChart = null;

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

// Elementos de filtro
const filterCategoria = document.getElementById('filterCategoria');
const filterStatus = document.getElementById('filterStatus');
const filterEstado = document.getElementById('filterEstado');
const filterValorMin = document.getElementById('filterValorMin');
const filterValorMax = document.getElementById('filterValorMax');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

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
    
    // Filtros
    filterCategoria.addEventListener('change', applyFilters);
    filterStatus.addEventListener('change', applyFilters);
    filterEstado.addEventListener('change', applyFilters);
    filterValorMin.addEventListener('input', debounce(applyFilters, 500));
    filterValorMax.addEventListener('input', debounce(applyFilters, 500));
    clearFiltersBtn.addEventListener('click', clearFilters);
    
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
    const valorInput = document.getElementById('valor');
    
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
    
    // Máscara para valor (moeda brasileira)
    valorInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = (parseInt(value) / 100).toFixed(2);
        value = value.replace('.', ',');
        value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        e.target.value = value;
    });
}

// Carregar clientes
async function loadClients() {
  try {
    showLoading();
    const [clientsResponse, statsResponse, categoriesResponse, statesResponse] = await Promise.all([
      fetch('/api/clientes'),
      fetch('/api/estatisticas'),
      fetch('/api/estatisticas/categorias'),
      fetch('/api/estatisticas/estados')
    ]);
    
    clients = await clientsResponse.json();
    const stats = await statsResponse.json();
    const categories = await categoriesResponse.json();
    const states = await statesResponse.json();
    
    renderClients(clients);
    updateStats(stats);
    updateCharts(stats, categories, states);
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
    
    // Aplicar modo de visualização atual
    applyCurrentViewMode();
    
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
    
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };
    
    const getCategoryBadge = (categoria) => {
        const badgeClass = `badge-${(categoria || 'regular').toLowerCase()}`;
        return `<span class="badge ${badgeClass}">${categoria || 'Regular'}</span>`;
    };
    
    const getStatusBadge = (status) => {
        const badgeClass = `badge-${(status || 'pendente').toLowerCase()}`;
        const statusText = {
            'pago': 'Pago',
            'pendente': 'Pendente',
            'cancelado': 'Cancelado'
        };
        return `<span class="badge ${badgeClass}">${statusText[status] || 'Pendente'}</span>`;
    };
    
    return `
        <div class="client-card">
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
            <div class="client-badges">
                ${getCategoryBadge(client.categoria)}
                ${getStatusBadge(client.status_pagamento)}
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
            ${client.valor > 0 ? `
                <div class="client-valor">
                    <span>Valor:</span>
                    <strong>${formatCurrency(client.valor)}</strong>
                </div>
            ` : ''}
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
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };
  
  totalClientsSpan.textContent = stats.total || 0;
  todayClientsSpan.textContent = stats.hoje || 0;
  document.getElementById('totalPago').textContent = stats.totalPago || 0;
  document.getElementById('totalPendente').textContent = stats.totalPendente || 0;
  document.getElementById('valorTotal').textContent = formatCurrency(stats.valorTotal);
  document.getElementById('valorPago').textContent = formatCurrency(stats.valorPago);
}

// Atualizar gráficos
function updateCharts(stats, categories, states) {
  // Gráfico de Categorias
  const categoryCtx = document.getElementById('categoryChart');
  if (categoryChart) {
    categoryChart.destroy();
  }
  
  const categoryLabels = categories.map(c => c._id || 'Sem Categoria');
  const categoryData = categories.map(c => c.total);
  const categoryColors = {
    'VIP': '#f59e0b',
    'Regular': '#2563eb',
    'Lead': '#6366f1',
    'Inativo': '#64748b',
    'Outro': '#9333ea'
  };
  const categoryBackgrounds = categoryLabels.map(label => categoryColors[label] || '#64748b');
  
  categoryChart = new Chart(categoryCtx, {
    type: 'doughnut',
    data: {
      labels: categoryLabels,
      datasets: [{
        data: categoryData,
        backgroundColor: categoryBackgrounds,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 12,
              family: 'Inter'
            }
          }
        }
      }
    }
  });
  
  // Gráfico de Status de Pagamento
  const paymentCtx = document.getElementById('paymentChart');
  if (paymentChart) {
    paymentChart.destroy();
  }
  
  paymentChart = new Chart(paymentCtx, {
    type: 'bar',
    data: {
      labels: ['Pago', 'Pendente', 'Cancelado'],
      datasets: [{
        label: 'Quantidade',
        data: [stats.totalPago || 0, stats.totalPendente || 0, stats.totalCancelado || 0],
        backgroundColor: ['#16a34a', '#f59e0b', '#dc2626'],
        borderWidth: 0,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: {
              size: 11,
              family: 'Inter'
            }
          },
          grid: {
            color: '#f1f5f9'
          }
        },
        x: {
          ticks: {
            font: {
              size: 11,
              family: 'Inter'
            }
          },
          grid: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
  
  // Gráfico de Estados
  const stateCtx = document.getElementById('stateChart');
  if (stateChart) {
    stateChart.destroy();
  }
  
  const stateLabels = states.map(s => s._id);
  const stateData = states.map(s => s.total);
  
  stateChart = new Chart(stateCtx, {
    type: 'bar',
    data: {
      labels: stateLabels,
      datasets: [{
        label: 'Clientes',
        data: stateData,
        backgroundColor: '#2563eb',
        borderWidth: 0,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: {
              size: 11,
              family: 'Inter'
            }
          },
          grid: {
            color: '#f1f5f9'
          }
        },
        y: {
          ticks: {
            font: {
              size: 11,
              family: 'Inter'
            }
          },
          grid: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
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
        document.getElementById('categoria').value = client.categoria || 'Regular';
        document.getElementById('status_pagamento').value = client.status_pagamento || 'pendente';
        
        // Formatar valor para exibição
        const valorFormatado = (client.valor || 0).toFixed(2).replace('.', ',');
        document.getElementById('valor').value = valorFormatado;
        
        document.getElementById('observacoes').value = client.observacoes || '';
    } else {
        // Limpar formulário
        clientForm.reset();
        document.getElementById('categoria').value = 'Regular';
        document.getElementById('status_pagamento').value = 'pendente';
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
    
    // Converter valor de formato brasileiro para número
    if (clientData.valor) {
        const valorString = clientData.valor.replace(/\./g, '').replace(',', '.');
        clientData.valor = parseFloat(valorString) || 0;
    } else {
        clientData.valor = 0;
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
    applyFilters();
}

// Aplicar filtros
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const categoria = filterCategoria.value;
    const status = filterStatus.value;
    const estado = filterEstado.value;
    const valorMin = parseFloat(filterValorMin.value) || 0;
    const valorMax = parseFloat(filterValorMax.value) || Infinity;
    
    let filteredClients = clients;
    
    // Filtro de busca por texto
    if (searchTerm) {
        filteredClients = filteredClients.filter(client => 
            client.nome.toLowerCase().includes(searchTerm) ||
            client.email.toLowerCase().includes(searchTerm) ||
            (client.telefone && client.telefone.includes(searchTerm)) ||
            (client.cpf && client.cpf.includes(searchTerm))
        );
    }
    
    // Filtro por categoria
    if (categoria) {
        filteredClients = filteredClients.filter(client => 
            client.categoria === categoria
        );
    }
    
    // Filtro por status
    if (status) {
        filteredClients = filteredClients.filter(client => 
            client.status_pagamento === status
        );
    }
    
    // Filtro por estado
    if (estado) {
        filteredClients = filteredClients.filter(client => 
            client.estado === estado
        );
    }
    
    // Filtro por valor
    filteredClients = filteredClients.filter(client => {
        const valor = client.valor || 0;
        return valor >= valorMin && valor <= valorMax;
    });
    
    renderClients(filteredClients);
    updateFilteredStats(filteredClients);
}

// Limpar filtros
function clearFilters() {
    searchInput.value = '';
    filterCategoria.value = '';
    filterStatus.value = '';
    filterEstado.value = '';
    filterValorMin.value = '';
    filterValorMax.value = '';
    
    // Resetar título da seção
    const clientsSection = document.querySelector('.section-header h2');
    if (clientsSection) {
        clientsSection.textContent = 'Lista de Clientes';
    }
    
    renderClients(clients);
}

// Atualizar estatísticas dos clientes filtrados
function updateFilteredStats(filteredClients) {
    const totalFiltrado = filteredClients.length;
    
    if (totalFiltrado === clients.length) {
        // Se está mostrando todos, não atualiza as estatísticas
        return;
    }
    
    // Mostrar quantos clientes estão sendo exibidos
    const clientsSection = document.querySelector('.section-header h2');
    if (clientsSection) {
        if (totalFiltrado < clients.length) {
            clientsSection.innerHTML = `Lista de Clientes <span style="color: #64748b; font-size: 0.9rem; font-weight: 400;">(${totalFiltrado} de ${clients.length})</span>`;
        } else {
            clientsSection.textContent = 'Lista de Clientes';
        }
    }
}

// Modo de visualização
function setViewMode(grid) {
    isGridView = grid;
    gridViewBtn.classList.toggle('active', grid);
    listViewBtn.classList.toggle('active', !grid);
    
    applyCurrentViewMode();
}

// Aplicar modo de visualização atual
function applyCurrentViewMode() {
    // Aplicar classe no container
    clientsContainer.classList.toggle('list-view', !isGridView);
    
    // Aplicar classe nos cards
    const cards = clientsContainer.querySelectorAll('.client-card');
    cards.forEach(card => {
        card.classList.toggle('list-view', !isGridView);
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
