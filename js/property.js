document.addEventListener('DOMContentLoaded', function() {
    // Atualiza o nome do usuário na sidebar
    updateUserInfo();
    
    // Obtém o ID da propriedade da URL (ex: ?id=property1)
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id') || 'property1'; // Default para property1
    
    // Destaca a propriedade atual no menu
    highlightCurrentProperty(propertyId);
    
    // Carrega os dados da propriedade
    loadPropertyData(propertyId);
    
    // Verifica permissões do usuário
    checkUserPermissions();
});

function updateUserInfo() {
    const userName = localStorage.getItem('userName');
    const userNameElement = document.getElementById('userName');
    
    if (userNameElement && userName) {
        userNameElement.textContent = userName;
    }
}

function highlightCurrentProperty(propertyId) {
    // Remove a classe active de todos os links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Adiciona a classe active ao link da propriedade atual
    const currentPropertyLink = document.getElementById(`${propertyId}Link`);
    if (currentPropertyLink) {
        currentPropertyLink.classList.add('active');
    }
    
    // Atualiza o título da página
    document.getElementById('propertyTitle').textContent = getPropertyName(propertyId);
}

function getPropertyName(propertyId) {
    const propertyNames = {
        'property1': 'Apartamento 1',
        'property2': 'Apartamento 2',
        'property3': 'Apartamento 3'
    };
    
    return propertyNames[propertyId] || 'Propriedade';
}

function checkUserPermissions() {
    const userRole = localStorage.getItem('userRole');
    const propertyAccess = localStorage.getItem('propertyAccess');
    
    // Se for co-proprietário, verifica acesso
    if (userRole === 'coproprietario') {
        const urlParams = new URLSearchParams(window.location.search);
        const currentProperty = urlParams.get('id') || 'property1';
        
        // Se não tiver acesso a esta propriedade, redireciona
        if (currentProperty !== propertyAccess) {
            alert('Você não tem acesso a esta propriedade.');
            window.location.href = `property.html?id=${propertyAccess}`;
        }
        
        // Desativa links para propriedades sem acesso
        const propertyLinks = document.querySelectorAll('.nav-pills .nav-link');
        propertyLinks.forEach(link => {
            if (link.getAttribute('onclick') && !link.getAttribute('onclick').includes(propertyAccess)) {
                if (!link.getAttribute('onclick').includes('showReports') && !link.getAttribute('onclick').includes('Dashboard')) {
                    link.classList.add('disabled');
                }
            }
        });
    }
}

// Modificar a função loadPropertyData no arquivo js/property.js
// Modificar a função loadPropertyData no arquivo js/property.js

function loadPropertyData(propertyId) {
    // Verifica se o ID da propriedade existe
    const propertiesRegistry = JSON.parse(localStorage.getItem('propertiesRegistry')) || {};
    
    // Determinar o nome da propriedade
    let propertyName = "Propriedade";
    
    // Verifica se é uma propriedade personalizada ou padrão
    if (propertiesRegistry[propertyId]) {
        propertyName = propertiesRegistry[propertyId].name;
    } else {
        // Propriedades padrão (para compatibilidade)
        const defaultNames = {
            'property1': 'Apartamento 1',
            'property2': 'Apartamento 2',
            'property3': 'Apartamento 3'
        };
        propertyName = defaultNames[propertyId] || "Propriedade";
    }
    
    // Atualiza o título da página
    document.getElementById('propertyTitle').textContent = propertyName;
    
    // Resto da função permanece igual...
    // ...
}

// Atualizar a função getPropertyName para usar o registro de propriedades
function getPropertyName(propertyId) {
    const propertiesRegistry = JSON.parse(localStorage.getItem('propertiesRegistry')) || {};
    
    if (propertiesRegistry[propertyId]) {
        return propertiesRegistry[propertyId].name;
    }
    
    // Propriedades padrão (para compatibilidade)
    const propertyNames = {
        'property1': 'Apartamento 1',
        'property2': 'Apartamento 2',
        'property3': 'Apartamento 3'
    };
    
    return propertyNames[propertyId] || 'Propriedade';
}

// Adicionar função auxiliar para converter período em nome do mês
function convertPeriodToMonthName(period) {
    if (!period) return '';
    
    const months = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    
    const parts = period.split('/');
    if (parts.length === 2) {
        const monthIndex = parseInt(parts[0]) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            return `${months[monthIndex]}/${parts[1].slice(-2)}`;
        }
    }
    
    return period;
}

function updatePropertyInterface(propertyData) {
    // Atualiza os cards de resumo
    document.getElementById('propertyIncome').textContent = formatCurrency(propertyData.summary.income);
    document.getElementById('propertyExpenses').textContent = formatCurrency(propertyData.summary.expenses);
    document.getElementById('propertyResult').textContent = formatCurrency(propertyData.summary.result);
    document.getElementById('propertyProfitability').textContent = propertyData.summary.profitability.toFixed(2);
    
    // Preenche a tabela de transações
    const tableBody = document.getElementById('transactionsTable');
    tableBody.innerHTML = '';
    
    propertyData.transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.period}</td>
            <td class="text-income">R$ ${formatCurrency(transaction.airbnb)}</td>
            <td class="text-income">R$ ${formatCurrency(transaction.booking)}</td>
            <td class="text-income">R$ ${formatCurrency(transaction.direct)}</td>
            <td class="text-expense">R$ ${formatCurrency(transaction.condominium)}</td>
            <td class="text-expense">R$ ${formatCurrency(transaction.iptu)}</td>
            <td class="text-expense">R$ ${formatCurrency(transaction.electricity)}</td>
            <td class="text-expense">R$ ${formatCurrency(transaction.internet)}</td>
            <td class="text-expense">R$ ${formatCurrency(transaction.platforms)}</td>
            <td>R$ ${formatCurrency(transaction.result)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editTransaction('${transaction.period}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteTransaction('${transaction.period}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Inicializa os gráficos
    initPropertyCharts(propertyData);
    
    // Armazena os dados para uso futuro
    window.currentPropertyData = propertyData;
}

function initPropertyCharts(propertyData) {
    // Gráfico de evolução mensal
    const monthlyChartCtx = document.getElementById('propertyMonthlyChart').getContext('2d');
    new Chart(monthlyChartCtx, {
        type: 'line',
        data: {
            labels: propertyData.monthlyData.map(item => item.month),
            datasets: [
                {
                    label: 'Receitas',
                    data: propertyData.monthlyData.map(item => item.income),
                    borderColor: '#51cf66',
                    backgroundColor: 'rgba(81, 207, 102, 0.2)',
                    tension: 0.1
                },
                {
                    label: 'Despesas',
                    data: propertyData.monthlyData.map(item => item.expenses),
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.2)',
                    tension: 0.1
                },
                {
                    label: 'Resultado',
                    data: propertyData.monthlyData.map(item => item.result),
                    borderColor: '#339af0',
                    backgroundColor: 'rgba(51, 154, 240, 0.2)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    }
                }
            }
        }
    });
    
    // Gráfico de fontes de receita
    const incomeSourcesCtx = document.getElementById('propertyIncomeSourcesChart').getContext('2d');
    new Chart(incomeSourcesCtx, {
        type: 'pie',
        data: {
            labels: ['Airbnb', 'Booking', 'Diretas'],
            datasets: [{
                data: [
                    propertyData.incomeBySource.airbnb,
                    propertyData.incomeBySource.booking,
                    propertyData.incomeBySource.direct
                ],
                backgroundColor: [
                    '#00AB67', // Verde da logo
                    '#0C3C60', // Azul da logo
                    '#ffd43b' // Amarelo para contraste
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(2) + '%';
                            return `R$ ${value.toLocaleString('pt-BR')} (${percentage})`;
                        }
                    }
                }
            }
        }
    });
}

function saveTransaction() {
    // Em uma versão completa, aqui salvaria a transação
    alert('Transação salva com sucesso!');
    
    // Fecha o modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addTransactionModal'));
    modal.hide();
    
    // Na implementação real, você recarregaria os dados
}

function editTransaction(period) {
    // Em uma versão completa, aqui abriria o modal com os dados da transação
    alert(`Editando transação do período: ${period}`);
}

function deleteTransaction(period) {
    // Em uma versão completa, aqui confirmaria e excluiria a transação
    const confirmDelete = confirm(`Tem certeza que deseja excluir a transação do período ${period}?`);
    
    if (confirmDelete) {
        alert(`Transação do período ${period} excluída com sucesso!`);
        // Na implementação real, você recarregaria os dados
    }
}

function changePropertyPeriod(period) {
    // Em uma versão completa, aqui atualizaria os dados com base no período selecionado
    alert(`Período alterado para: ${period}`);
    
    // Na implementação real, você recarregaria os dados e atualizaria os gráficos
}

function loadProperty(propertyId) {
    // Redireciona para a página da propriedade
    window.location.href = `property.html?id=${propertyId}`;
}

function showReports() {
    // Em uma versão completa, aqui redirecionaria para a página de relatórios
    alert('Carregando relatórios');
    
    // Na implementação real, você redirecionaria para:
    // window.location.href = 'reports.html';
}

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Função para editar uma transação
function editTransaction(period) {
    const propertyId = new URLSearchParams(window.location.search).get('id') || 'property1';
    const allProperties = JSON.parse(localStorage.getItem('propertiesData')) || {};
    const property = allProperties[propertyId];
    
    if (!property || !property.transactions) {
        alert('Dados não encontrados.');
        return;
    }
    
    // Encontra a transação pelo período
    const transaction = property.transactions.find(t => t.period === period);
    if (!transaction) {
        alert('Transação não encontrada.');
        return;
    }
    
    // Preenche o formulário do modal com os dados da transação
    document.getElementById('transactionPeriod').value = periodToInputFormat(period);
    document.getElementById('incomeAirbnb').value = transaction.airbnb;
    document.getElementById('incomeBooking').value = transaction.booking;
    document.getElementById('incomeDirect').value = transaction.direct;
    document.getElementById('expenseCondominium').value = transaction.condominium;
    document.getElementById('expenseIptu').value = transaction.iptu;
    document.getElementById('expenseElectricity').value = transaction.electricity;
    document.getElementById('expenseInternet').value = transaction.internet;
    document.getElementById('expensePlatforms').value = transaction.platforms;
    
    // Armazena o período original para uso na função de salvar
    window.editingPeriod = period;
    
    // Abre o modal
    const modal = new bootstrap.Modal(document.getElementById('addTransactionModal'));
    modal.show();
}

// Função para deletar uma transação
function deleteTransaction(period) {
    const confirmDelete = confirm(`Tem certeza que deseja excluir a transação do período ${period}?`);
    
    if (!confirmDelete) return;
    
    const propertyId = new URLSearchParams(window.location.search).get('id') || 'property1';
    const allProperties = JSON.parse(localStorage.getItem('propertiesData')) || {};
    
    if (!allProperties[propertyId] || !allProperties[propertyId].transactions) {
        alert('Dados não encontrados.');
        return;
    }
    
    // Remove a transação
    allProperties[propertyId].transactions = allProperties[propertyId].transactions.filter(
        t => t.period !== period
    );
    
    // Atualiza métricas
    updatePropertyMetrics(allProperties[propertyId]);
    
    // Salva no localStorage
    localStorage.setItem('propertiesData', JSON.stringify(allProperties));
    
    // Atualiza dados do dashboard
    updateDashboardData(allProperties);
    
    // Recarrega a página
    loadPropertyData(propertyId);
    
    alert('Transação excluída com sucesso!');
}

// Função para salvar uma transação (nova ou editada)
function saveTransaction() {
    const propertyId = new URLSearchParams(window.location.search).get('id') || 'property1';
    const periodInput = document.getElementById('transactionPeriod').value;
    
    // Validação básica
    if (!periodInput) {
        alert('Por favor, informe o período.');
        return;
    }
    
    // Converte o período para o formato MM/YYYY
    const period = inputFormatToPeriod(periodInput);
    
    // Coleta os valores do formulário
    const transaction = {
        period,
        airbnb: parseFloat(document.getElementById('incomeAirbnb').value) || 0,
        booking: parseFloat(document.getElementById('incomeBooking').value) || 0,
        direct: parseFloat(document.getElementById('incomeDirect').value) || 0,
        condominium: parseFloat(document.getElementById('expenseCondominium').value) || 0,
        iptu: parseFloat(document.getElementById('expenseIptu').value) || 0,
        electricity: parseFloat(document.getElementById('expenseElectricity').value) || 0,
        internet: parseFloat(document.getElementById('expenseInternet').value) || 0,
        platforms: parseFloat(document.getElementById('expensePlatforms').value) || 0
    };
    
    // Calcula totais
    transaction.totalIncome = transaction.airbnb + transaction.booking + transaction.direct;
    transaction.totalExpenses = transaction.condominium + transaction.iptu + 
                               transaction.electricity + transaction.internet + 
                               transaction.platforms;
    transaction.result = transaction.totalIncome - transaction.totalExpenses;
    
    // Obtém dados existentes ou inicializa
    const allProperties = JSON.parse(localStorage.getItem('propertiesData')) || {};
    
    if (!allProperties[propertyId]) {
        allProperties[propertyId] = {
            transactions: []
        };
    }
    
    // Verifica se é uma edição ou uma nova transação
    const editingPeriod = window.editingPeriod;
    if (editingPeriod) {
        // Remove a transação antiga
        allProperties[propertyId].transactions = allProperties[propertyId].transactions.filter(
            t => t.period !== editingPeriod
        );
        
        // Limpa a variável de edição
        window.editingPeriod = null;
    }
    
    // Verifica se já existe uma transação para este período
    const existingIndex = allProperties[propertyId].transactions.findIndex(
        t => t.period === period
    );
    
    if (existingIndex >= 0) {
        // Atualiza a transação existente
        allProperties[propertyId].transactions[existingIndex] = transaction;
    } else {
        // Adiciona nova transação
        allProperties[propertyId].transactions.push(transaction);
    }
    
    // Ordena as transações por período (mais recente primeiro)
    allProperties[propertyId].transactions.sort((a, b) => {
        // Converte período para um formato comparável (assume MM/YYYY)
        const periodToDate = (period) => {
            const [month, year] = period.split('/');
            return new Date(parseInt(year), parseInt(month) - 1);
        };
        
        const dateA = periodToDate(a.period);
        const dateB = periodToDate(b.period);
        
        return dateB - dateA;
    });
    
    // Atualiza métricas da propriedade
    updatePropertyMetrics(allProperties[propertyId]);
    
    // Salva no localStorage
    localStorage.setItem('propertiesData', JSON.stringify(allProperties));
    
    // Atualiza dados do dashboard
    updateDashboardData(allProperties);
    
    // Reseta o formulário
    document.getElementById('transactionForm').reset();
    
    // Fecha o modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addTransactionModal'));
    modal.hide();
    
    // Recarrega os dados da propriedade
    loadPropertyData(propertyId);
    
    alert('Transação salva com sucesso!');
}

// Função auxiliar para converter período MM/YYYY para formato de input (YYYY-MM)
function periodToInputFormat(period) {
    if (!period) return '';
    
    const parts = period.split('/');
    if (parts.length !== 2) return period;
    
    return `${parts[1]}-${parts[0]}`;
}

// Função auxiliar para converter formato de input (YYYY-MM) para período MM/YYYY
function inputFormatToPeriod(inputFormat) {
    if (!inputFormat) return '';
    
    const parts = inputFormat.split('-');
    if (parts.length !== 2) return inputFormat;
    
    return `${parts[1]}/${parts[0]}`;
}

// Função para calcular métricas da propriedade
function updatePropertyMetrics(property) {
    // Calcula métricas baseadas nas transações
    const transactions = property.transactions;
    
    if (!transactions || transactions.length === 0) return;
    
    // Últimos 12 meses
    const last12Months = transactions.slice(0, 12);
    
    // Métricas
    const totalIncome = last12Months.reduce((sum, t) => sum + t.totalIncome, 0);
    const totalExpenses = last12Months.reduce((sum, t) => sum + t.totalExpenses, 0);
    const result = totalIncome - totalExpenses;
    const profitability = totalIncome > 0 ? (result / totalIncome) * 100 : 0;
    
    // Armazena as métricas
    property.metrics = {
        totalIncome,
        totalExpenses,
        result,
        profitability
    };
}

// Função para atualizar os dados do dashboard
function updateDashboardData(allProperties) {
    // Extrai todas as transações de todas as propriedades
    const allTransactions = [];
    Object.values(allProperties).forEach(property => {
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
        totalIncome: Object.values(allProperties).reduce((sum, p) => sum + (p.metrics?.totalIncome || 0), 0),
        totalExpenses: Object.values(allProperties).reduce((sum, p) => sum + (p.metrics?.totalExpenses || 0), 0),
        totalResult: Object.values(allProperties).reduce((sum, p) => sum + (p.metrics?.result || 0), 0)
    };
    
    // Calcula distribuição de receitas
    const incomeDistribution = {
        airbnb: allTransactions.reduce((sum, t) => sum + t.airbnb, 0),
        booking: allTransactions.reduce((sum, t) => sum + t.booking, 0),
        direct: allTransactions.reduce((sum, t) => sum + t.direct, 0)
    };
    
    // Salva dados do dashboard
    const dashboardData = {
        totals: dashboardTotals,
        periodData,
        incomeDistribution
    };
    
    localStorage.setItem('dashboardData', JSON.stringify(dashboardData));
}
