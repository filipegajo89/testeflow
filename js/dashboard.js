// js/dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    // Atualiza o nome do usuário na sidebar
    updateUserInfo();
    
    // Verifica permissões do usuário
    checkUserPermissions();
    
    // Carrega os dados do dashboard
    loadDashboardData();
});

async function updateUserInfo() {
    try {
        // Obtém as informações do usuário atual
        const user = await account.get();
        const userName = user.name || user.email;
        
        // Atualiza o nome do usuário na interface
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = userName;
        }
    } catch (error) {
        console.error('Erro ao obter informações do usuário:', error);
    }
}

async function checkUserPermissions() {
    try {
        // Obtém o usuário atual
        const user = await account.get();
        
        // Busca os detalhes do usuário no banco de dados
        const userData = await databases.listDocuments(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            [Appwrite.Query.equal('userId', user.$id)]
        );
        
        // Se o usuário for co-proprietário, destaca suas propriedades
        if (userData.documents.length > 0 && userData.documents[0].role === 'coproprietario') {
            // Destaca as propriedades permitidas
            const allowedProperties = userData.documents[0].propertyAccess || [];
            
            // Desativa links para propriedades sem acesso
            document.querySelectorAll('#propertyLinks .nav-link').forEach(link => {
                const href = link.getAttribute('href');
                if (href) {
                    const url = new URL(href, window.location.origin);
                    const propertyId = url.searchParams.get('id');
                    
                    if (propertyId && !allowedProperties.includes(propertyId)) {
                        link.classList.add('disabled');
                        link.setAttribute('aria-disabled', 'true');
                        link.addEventListener('click', (e) => e.preventDefault());
                    }
                }
            });
        }
    } catch (error) {
        console.error('Erro ao verificar permissões:', error);
    }
}

async function loadDashboardData() {
    try {
        // Busca todas as propriedades
        let properties;
        const user = await account.get();
        const userData = await databases.listDocuments(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            [Appwrite.Query.equal('userId', user.$id)]
        );
        
        // Se for co-proprietário, filtra apenas suas propriedades
        if (userData.documents.length > 0 && userData.documents[0].role === 'coproprietario') {
            const allowedProperties = userData.documents[0].propertyAccess || [];
            
            // Busca apenas as propriedades permitidas
            properties = await databases.listDocuments(
                DATABASE_ID,
                PROPERTIES_COLLECTION_ID,
                [Appwrite.Query.equal('$id', allowedProperties)]
            );
        } else {
            // Se for admin, busca todas as propriedades
            properties = await databases.listDocuments(
                DATABASE_ID,
                PROPERTIES_COLLECTION_ID
            );
        }
        
        // Obtém as transações para calcular métricas
        let allTransactions = [];
        
        for (const property of properties.documents) {
            const transactions = await databases.listDocuments(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                [Appwrite.Query.equal('propertyId', property.$id)]
            );
            
            // Adiciona o nome da propriedade a cada transação
            transactions.documents.forEach(transaction => {
                transaction.propertyName = property.name;
                allTransactions.push(transaction);
            });
        }
        
        // Processa os dados para o dashboard
        const dashboardData = processDashboardData(properties.documents, allTransactions);
        
        // Atualiza a interface com os dados
        updateDashboardInterface(dashboardData);
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        alert('Erro ao carregar dados do dashboard. Por favor, tente novamente.');
    }
}

function processDashboardData(properties, transactions) {
    // Calcula totais
    let totalIncome = 0;
    let totalExpenses = 0;
    let airbnbTotal = 0;
    let bookingTotal = 0;
    let directTotal = 0;
    
    // Calcular métricas por propriedade
    const propertiesData = properties.map(property => {
        // Filtrar transações desta propriedade
        const propertyTransactions = transactions.filter(t => t.propertyId === property.$id);
        
        let income = 0;
        let expenses = 0;
        
        propertyTransactions.forEach(transaction => {
            income += transaction.totalIncome || 0;
            expenses += transaction.totalExpenses || 0;
        });
        
        const result = income - expenses;
        const profitability = income > 0 ? (result / income) * 100 : 0;
        
        // Adicionar ao total geral
        totalIncome += income;
        totalExpenses += expenses;
        
        return {
            id: property.$id,
            name: property.name,
            income: income,
            expenses: expenses,
            result: result,
            profitability: profitability
        };
    });
    
    // Calcular distribuição de receitas por plataforma
    transactions.forEach(transaction => {
        airbnbTotal += transaction.airbnb || 0;
        bookingTotal += transaction.booking || 0;
        directTotal += transaction.direct || 0;
    });
    
    // Agrupar transações por período para o gráfico
    const periodData = {};
    transactions.forEach(transaction => {
        if (!periodData[transaction.period]) {
            periodData[transaction.period] = {
                income: 0,
                expenses: 0
            };
        }
        
        periodData[transaction.period].income += transaction.totalIncome || 0;
        periodData[transaction.period].expenses += transaction.totalExpenses || 0;
    });
    
    // Converter para array e ordenar por data
    const monthlyData = Object.entries(periodData).map(([period, data]) => {
        return {
            period: period,
            month: convertPeriodToMonthName(period),
            income: data.income,
            expenses: data.expenses,
            result: data.income - data.expenses
        };
    });
    
    // Ordenar por data
    monthlyData.sort((a, b) => {
        const [aMonth, aYear] = a.period.split('/');
        const [bMonth, bYear] = b.period.split('/');
        
        if (aYear !== bYear) {
            return parseInt(aYear) - parseInt(bYear);
        }
        
        return parseInt(aMonth) - parseInt(bMonth);
    });
    
    return {
        propertiesList: propertiesData,
        totals: {
            totalIncome: totalIncome,
            totalExpenses: totalExpenses,
            totalResult: totalIncome - totalExpenses
        },
        monthlyData: monthlyData,
        incomeBySource: {
            airbnb: airbnbTotal,
            booking: bookingTotal,
            direct: directTotal
        }
    };
}

function updateDashboardInterface(dashboardData) {
    // Atualiza os cards de resumo
    document.getElementById('totalIncome').textContent = formatCurrency(dashboardData.totals.totalIncome);
    document.getElementById('totalExpenses').textContent = formatCurrency(dashboardData.totals.totalExpenses);
    document.getElementById('netResult').textContent = formatCurrency(dashboardData.totals.totalResult);
    
    // Preenche a tabela de propriedades
    const tableBody = document.getElementById('propertiesSummary');
    tableBody.innerHTML = '';
    
    dashboardData.propertiesList.forEach(property => {
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
    
    // Inicializa os gráficos
    initDashboardCharts(dashboardData);
}

function initDashboardCharts(dashboardData) {
    // Gráfico de Evolução de Receitas e Despesas
    const incomeExpenseCtx = document.getElementById('incomeExpenseChart').getContext('2d');
    
    // Verifica se já existe um gráfico e destrói
    if (window.incomeExpenseChart) {
        window.incomeExpenseChart.destroy();
    }
    
    window.incomeExpenseChart = new Chart(incomeExpenseCtx, {
        type: 'line',
        data: {
            labels: dashboardData.monthlyData.map(item => item.month),
            datasets: [
                {
                    label: 'Receitas',
                    data: dashboardData.monthlyData.map(item => item.income),
                    borderColor: '#51cf66',
                    backgroundColor: 'rgba(81, 207, 102, 0.2)',
                    tension: 0.1
                },
                {
                    label: 'Despesas',
                    data: dashboardData.monthlyData.map(item => item.expenses),
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.2)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
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
    
    // Verifica se já existe um gráfico e destrói
    if (window.incomeSourcesChart) {
        window.incomeSourcesChart.destroy();
    }
    
    window.incomeSourcesChart = new Chart(incomeSourcesCtx, {
        type: 'pie',
        data: {
            labels: ['Airbnb', 'Booking', 'Diretas'],
            datasets: [{
                data: [
                    dashboardData.incomeBySource.airbnb,
                    dashboardData.incomeBySource.booking,
                    dashboardData.incomeBySource.direct
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

function changePeriod(period) {
    // Armazena o período selecionado
    localStorage.setItem('dashboardPeriod', period);
    
    // Recarrega os dados do dashboard
    loadDashboardData();
}

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
