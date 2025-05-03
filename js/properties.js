document.addEventListener('DOMContentLoaded', function() {
    // Atualiza o nome do usuário na sidebar
    updateUserInfo();
    
    // Verifica permissões do usuário
    checkUserPermissions();
    
    // Carrega as propriedades
    loadProperties();
    
    // Atualiza o menu lateral com as propriedades
    updateSidebar();
});

function updateUserInfo() {
    const userName = localStorage.getItem('userName');
    const userNameElement = document.getElementById('userName');
    
    if (userNameElement && userName) {
        userNameElement.textContent = userName;
    }
}

function checkUserPermissions() {
    const userRole = localStorage.getItem('userRole');
    
    // Se não for admin, redireciona para o dashboard
    if (userRole !== 'admin') {
        alert('Você não tem permissão para acessar esta página.');
        window.location.href = 'dashboard.html';
    }
}

function loadProperties() {
    // Obtém as propriedades do localStorage
    const propertiesRegistry = JSON.parse(localStorage.getItem('propertiesRegistry')) || {};
    const propertiesData = JSON.parse(localStorage.getItem('propertiesData')) || {};
    
    // Referência para a tabela
    const tableBody = document.getElementById('propertiesTableBody');
    const noPropertiesMessage = document.getElementById('noPropertiesMessage');
    
    // Limpa a tabela
    tableBody.innerHTML = '';
    
    // Se não houver propriedades, mostra mensagem
    if (Object.keys(propertiesRegistry).length === 0) {
        noPropertiesMessage.classList.remove('d-none');
        return;
    }
    
    noPropertiesMessage.classList.add('d-none');
    
    // Adiciona cada propriedade à tabela
    Object.entries(propertiesRegistry).forEach(([id, property]) => {
        const row = document.createElement('tr');
        
        // Conta o número de transações
        const transactionsCount = propertiesData[id]?.transactions?.length || 0;
        
        row.innerHTML = `
            <td>${id}</td>
            <td>${property.name}</td>
            <td>${transactionsCount}</td>
            <td>
                <button class="btn btn-sm btn-primary me-1" onclick="editProperty('${id}')">
                    <i class="bi bi-pencil"></i> Editar
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProperty('${id}')">
                    <i class="bi bi-trash"></i> Excluir
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function updateSidebar() {
    // Obtém as propriedades do localStorage
    const propertiesRegistry = JSON.parse(localStorage.getItem('propertiesRegistry')) || {};
    
    // Referência para o contêiner de links
    const propertyLinks = document.getElementById('propertyLinks');
    
    // Limpa os links existentes
    propertyLinks.innerHTML = '';
    
    // Adiciona cada propriedade ao menu
    Object.entries(propertiesRegistry).forEach(([id, property]) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <a href="property.html?id=${id}" class="nav-link">
                <i class="bi bi-house me-2"></i>
                ${property.name}
            </a>
        `;
        
        propertyLinks.appendChild(listItem);
    });
}

function saveProperty() {
    // Obtém os valores do formulário
    const propertyId = document.getElementById('propertyId').value;
    const propertyName = document.getElementById('propertyName').value.trim();
    const propertyAddress = document.getElementById('propertyAddress').value.trim();
    
    // Validação básica
    if (!propertyName) {
        alert('Por favor, informe o nome da propriedade.');
        return;
    }
    
    // Obtém as propriedades do localStorage
    const propertiesRegistry = JSON.parse(localStorage.getItem('propertiesRegistry')) || {};
    
    // Se for uma nova propriedade, gera um ID único
    const isNewProperty = !propertyId;
    const id = isNewProperty ? generatePropertyId() : propertyId;
    
    // Atualiza ou adiciona a propriedade
    propertiesRegistry[id] = {
        name: propertyName,
        address: propertyAddress,
        createdAt: isNewProperty ? new Date().toISOString() : propertiesRegistry[id].createdAt,
        updatedAt: new Date().toISOString()
    };
    
    // Salva no localStorage
    localStorage.setItem('propertiesRegistry', JSON.stringify(propertiesRegistry));
    
    // Inicializa dados da propriedade se for nova
    if (isNewProperty) {
        const propertiesData = JSON.parse(localStorage.getItem('propertiesData')) || {};
        propertiesData[id] = {
            transactions: []
        };
        localStorage.setItem('propertiesData', JSON.stringify(propertiesData));
    }
    
    // Fecha o modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addPropertyModal'));
    modal.hide();
    
    // Recarrega as propriedades
    loadProperties();
    
    // Atualiza o menu lateral
    updateSidebar();
    
    // Atualiza os menus laterais em todas as páginas abertas
    updateAllSidebars();
    
    alert(`Propriedade ${isNewProperty ? 'adicionada' : 'atualizada'} com sucesso!`);
}

function editProperty(id) {
    // Obtém as propriedades do localStorage
    const propertiesRegistry = JSON.parse(localStorage.getItem('propertiesRegistry')) || {};
    
    // Verifica se a propriedade existe
    if (!propertiesRegistry[id]) {
        alert('Propriedade não encontrada.');
        return;
    }
    
    // Preenche o formulário com os dados da propriedade
    document.getElementById('propertyId').value = id;
    document.getElementById('propertyName').value = propertiesRegistry[id].name;
    document.getElementById('propertyAddress').value = propertiesRegistry[id].address || '';
    
    // Atualiza o título do modal
    document.getElementById('addPropertyModalLabel').textContent = 'Editar Propriedade';
    
    // Abre o modal
    const modal = new bootstrap.Modal(document.getElementById('addPropertyModal'));
    modal.show();
}

function deleteProperty(id) {
    // Obtém as propriedades do localStorage
    const propertiesRegistry = JSON.parse(localStorage.getItem('propertiesRegistry')) || {};
    
    // Verifica se a propriedade existe
    if (!propertiesRegistry[id]) {
        alert('Propriedade não encontrada.');
        return;
    }
    
    // Atualiza o modal de confirmação
    document.getElementById('deletePropertyName').textContent = propertiesRegistry[id].name;
    
    // Armazena o ID para uso na função de confirmação
    window.propertyToDelete = id;
    
    // Abre o modal de confirmação
    const modal = new bootstrap.Modal(document.getElementById('deletePropertyModal'));
    modal.show();
}

function confirmDeleteProperty() {
    const id = window.propertyToDelete;
    
    if (!id) {
        alert('Erro ao excluir propriedade.');
        return;
    }
    
    // Obtém as propriedades do localStorage
    const propertiesRegistry = JSON.parse(localStorage.getItem('propertiesRegistry')) || {};
    const propertiesData = JSON.parse(localStorage.getItem('propertiesData')) || {};
    
    // Remove a propriedade
    delete propertiesRegistry[id];
    delete propertiesData[id];
    
    // Salva no localStorage
    localStorage.setItem('propertiesRegistry', JSON.stringify(propertiesRegistry));
    localStorage.setItem('propertiesData', JSON.stringify(propertiesData));
    
    // Fecha o modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('deletePropertyModal'));
    modal.hide();
    
    // Limpa a referência
    window.propertyToDelete = null;
    
    // Recarrega as propriedades
    loadProperties();
    
    // Atualiza o menu lateral
    updateSidebar();
    
    // Atualiza os menus laterais em todas as páginas abertas
    updateAllSidebars();
    
    // Atualiza dados do dashboard
    updateDashboardData(propertiesData);
    
    alert('Propriedade excluída com sucesso!');
}

function generatePropertyId() {
    // Gera um ID único baseado em timestamp + número aleatório
    return `property_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function resetPropertyForm() {
    // Limpa o formulário
    document.getElementById('propertyId').value = '';
    document.getElementById('propertyName').value = '';
    document.getElementById('propertyAddress').value = '';
    
    // Atualiza o título do modal
    document.getElementById('addPropertyModalLabel').textContent = 'Nova Propriedade';
}

function updateAllSidebars() {
    // Esta função emite um evento que será capturado por outras páginas
    // Para atualizar o menu lateral em tempo real
    
    // Em uma aplicação real, isso seria feito com outras técnicas
    // Como webhooks ou websockets
    
    // Para nossa aplicação simples, vamos usar localStorage como "mensageiro"
    localStorage.setItem('sidebarUpdateTimestamp', Date.now().toString());
}

function showReports() {
    alert('Funcionalidade de Relatórios em desenvolvimento.');
}

// Adiciona evento para resetar o formulário quando o modal for aberto
document.getElementById('addPropertyModal').addEventListener('show.bs.modal', function (event) {
    // Se for um novo cadastro, limpa o formulário
    if (!event.relatedTarget || event.relatedTarget.tagName === 'BUTTON') {
        resetPropertyForm();
    }
});

// Atualiza o dashboard com os dados das propriedades
function updateDashboardData(propertiesData) {
    // Extrai todas as transações de todas as propriedades
    const allTransactions = [];
    Object.values(propertiesData).forEach(property => {
        if (property.transactions) {
            allTransactions.push(...property.transactions);
        }
    });
    
    // Agrupa transações por período
    const transactionsByPeriod = {};
    allTransactions.forEach(transaction => {
        if (!transactionsByPeriod[transaction.period]) {
            transactionsByPeriod[transaction.period] = {
                income: 0,
                expenses: 0,
                result: 0
            };
        }
        
        transactionsByPeriod[transaction.period].income += transaction.totalIncome;
        transactionsByPeriod[transaction.period].expenses += transaction.totalExpenses;
        transactionsByPeriod[transaction.period].result += transaction.result;
    });
    
    // Converte para array e ordena por período
    const periodData = Object.entries(transactionsByPeriod).map(([period, data]) => ({
        period,
        ...data
    })).sort((a, b) => {
        // Converte período para um formato comparável (assume MM/YYYY)
        const periodToDate = (period) => {
            const [month, year] = period.split('/');
            return new Date(parseInt(year), parseInt(month) - 1);
        };
        
        const dateA = periodToDate(a.period);
        const dateB = periodToDate(b.period);
        
        return dateA - dateB; // Ordem cronológica para o gráfico
    });
    
    // Calcula totais gerais para o dashboard
    const dashboardTotals = {
        totalIncome: Object.values(propertiesData).reduce((sum, p) => sum + (p.metrics?.totalIncome || 0), 0),
        totalExpenses: Object.values(propertiesData).reduce((sum, p) => sum + (p.metrics?.totalExpenses || 0), 0),
        totalResult: Object.values(propertiesData).reduce((sum, p) => sum + (p.metrics?.result || 0), 0)
    };
    
    // Calcula distribuição de receitas
    const incomeDistribution = {
        airbnb: allTransactions.reduce((sum, t) => sum + (t.airbnb || 0), 0),
        booking: allTransactions.reduce((sum, t) => sum + (t.booking || 0), 0),
        direct: allTransactions.reduce((sum, t) => sum + (t.direct || 0), 0)
    };
    
    // Salva dados do dashboard
    const dashboardData = {
        totals: dashboardTotals,
        periodData,
        incomeDistribution
    };
    
    localStorage.setItem('dashboardData', JSON.stringify(dashboardData));
}
