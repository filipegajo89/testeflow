document.addEventListener('DOMContentLoaded', function() {
    // Atualiza o nome do usuário na sidebar
    updateUserInfo();
    
    // Carrega os dados de exemplo
    loadSampleData();
    
    // Verifica permissões do usuário
    checkUserPermissions();
    
    // Inicializa os gráficos
    initCharts();
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
    const propertyAccess = localStorage.getItem('propertyAccess');
    
    // Se for co-proprietário, desativa links para propriedades que não tem acesso
    if (userRole === 'coproprietario') {
        const propertyLinks = document.querySelectorAll('.nav-pills .nav-link');
        
        propertyLinks.forEach(link => {
            // Verifica se o link contém onclick que acessa uma propriedade
            if (link.getAttribute('onclick') && !link.getAttribute('onclick').includes(propertyAccess)) {
                // Se não for dashboard ou relatórios e não for a propriedade com acesso
                if (!link.getAttribute('onclick').includes('showReports') && !link.classList.contains('active')) {
                    link.classList.add('disabled');
                }
            }
        });
    }
}

// Modificar a função loadSampleData no arquivo js/dashboard.js
function loadSampleData() {
    // Tenta carregar dados do localStorage
    const dashboardData = JSON.parse(localStorage.getItem('dashboardData'));
    
    // Se não houver dados no localStorage, usa os dados de exemplo
    if (!dashboardData) {
        // Use o código existente para carregar dados de exemplo
        loadSampleDashboardData();
        return;
    }
    
    // Atualiza os valores no dashboard com os dados importados
    document.getElementById('totalIncome').textContent = formatCurrency(dashboardData.totals.totalIncome);
    document.getElementById('totalExpenses').textContent = formatCurrency(dashboardData.totals.totalExpenses);
    document.getElementById('netResult').textContent = formatCurrency(dashboardData.totals.totalResult);
    
    // Carrega dados das propriedades
    const allProperties = JSON.parse(localStorage.getItem('propertiesData')) || {};
    const propertiesList = [];
    
    // Prepara dados das propriedades para exibição
    Object.entries(allProperties).forEach(([id, property]) => {
        if (property.metrics) {
            propertiesList.push({
                id,
                name: getPropertyName(id),
                income: property.metrics.totalIncome,
                expenses: property.metrics.totalExpenses,
                result: property.metrics.result,
                profitability: property.metrics.profitability
            });
        }
    });
    
    // Atualiza a tabela de propriedades
    const tableBody = document.getElementById('propertiesSummary');
    tableBody.innerHTML = '';
    
    propertiesList.forEach(property => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><a href="property.html?id=${property.id}">${property.name}</a></td>
            <td class="text-income">R$ ${formatCurrency(property.income)}</td>
            <td class="text-expense">R$ ${formatCurrency(property.expenses)}</td>
            <td>R$ ${formatCurrency(property.result)}</td>
            <td>${property.profitability.toFixed(2)}%</td>
        `;
        tableBody.appendChild(row);
    });
    
    // Armazena os dados para uso nos gráficos
    window.dashboardData = dashboardData;
}

// Adicionar função auxiliar
function getPropertyName(propertyId) {
    const propertyNames = {
        'property1': 'Apartamento 1',
        'property2': 'Apartamento 2',
        'property3': 'Apartamento 3'
    };
    
    return propertyNames[propertyId] || 'Propriedade';
}

// Modificar a função initCharts para usar os dados novos
function initCharts() {
    const data = window.dashboardData;
    
    if (!data) return;
    
    // Gráfico de Evolução de Receitas e Despesas
    const incomeExpenseCtx = document.getElementById('incomeExpenseChart').getContext('2d');
    new Chart(incomeExpenseCtx, {
        type: 'line',
        data: {
            labels: data.periodData.map(item => convertPeriodToMonthName(item.period)),
            datasets: [
                {
                    label: 'Receitas',
                    data: data.periodData.map(item => item.income),
                    borderColor: '#51cf66',
                    backgroundColor: 'rgba(81, 207, 102, 0.2)',
                    tension: 0.1
                },
                {
                    label: 'Despesas',
                    data: data.periodData.map(item => item.expenses),
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.2)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            height: 300,
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
    
    // Gráfico de Pizza para Distribuição de Receitas
    const incomeSourcesCtx = document.getElementById('incomePieChart').getContext('2d');
    new Chart(incomeSourcesCtx, {
        type: 'pie',
        data: {
            labels: ['Airbnb', 'Booking', 'Diretas'],
            datasets: [{
                data: [
                    data.incomeDistribution.airbnb,
                    data.incomeDistribution.booking,
                    data.incomeDistribution.direct
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
            maintainAspectRatio: true,
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

// Adicionar função para converter período em nome do mês (igual à do arquivo property.js)
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

function initCharts() {
    const data = window.dashboardData;
    
    if (!data) return;
    
    // Gráfico de Evolução de Receitas e Despesas
    const incomeExpenseCtx = document.getElementById('incomeExpenseChart').getContext('2d');
    new Chart(incomeExpenseCtx, {
        type: 'line',
        data: {
            labels: data.monthlyData.map(item => item.month),
            datasets: [
                {
                    label: 'Receitas',
                    data: data.monthlyData.map(item => item.income),
                    borderColor: '#51cf66',
                    backgroundColor: 'rgba(81, 207, 102, 0.2)',
                    tension: 0.1
                },
                {
                    label: 'Despesas',
                    data: data.monthlyData.map(item => item.expenses),
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.2)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true, // Mudar para true
            height: 300, // Definir altura fixa
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
    
    // Gráfico de Pizza para Distribuição de Receitas
    const incomeSourcesCtx = document.getElementById('incomePieChart').getContext('2d');
    new Chart(incomeSourcesCtx, {
        type: 'pie',
        data: {
            labels: ['Airbnb', 'Booking', 'Diretas'],
            datasets: [{
                data: [
                    data.incomeBySource.airbnb,
                    data.incomeBySource.booking,
                    data.incomeBySource.direct
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

function loadProperty(propertyId) {
    // Em uma versão completa, aqui redirecionaria para a página da propriedade
    // Por enquanto, apenas alertamos
    alert(`Carregando propriedade: ${propertyId}`);
    
    // Na implementação real, você redirecionaria para:
    // window.location.href = `property.html?id=${propertyId}`;
}

function showReports() {
    // Em uma versão completa, aqui redirecionaria para a página de relatórios
    alert('Carregando relatórios');
    
    // Na implementação real, você redirecionaria para:
    // window.location.href = 'reports.html';
}

function changePeriod(period) {
    // Em uma versão completa, aqui atualizaria os dados com base no período selecionado
    alert(`Período alterado para: ${period}`);
    
    // Na implementação real, você recarregaria os dados e atualizaria os gráficos
}

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
