// js/property.js
document.addEventListener('DOMContentLoaded', function() {
    // Atualiza o nome do usuário na sidebar
    updateUserInfo();
    
    // Obtém o ID da propriedade da URL (ex: ?id=property1)
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');
    
    if (!propertyId) {
        alert('ID da propriedade não especificado.');
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Carrega os dados da propriedade
    loadPropertyData(propertyId);
    
    // Verifica permissões do usuário
    checkUserPermissions(propertyId);
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

async function checkUserPermissions(propertyId) {
    try {
        // Obtém o usuário atual
        const user = await account.get();
        
        // Busca os detalhes do usuário no banco de dados
        const userData = await databases.listDocuments(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            [Appwrite.Query.equal('userId', user.$id)]
        );
        
        // Se o usuário for co-proprietário, verifica se tem acesso a esta propriedade
        if (userData.documents.length > 0 && userData.documents[0].role === 'coproprietario') {
            // Verifica as propriedades permitidas
            const allowedProperties = userData.documents[0].propertyAccess || [];
            
            // Se não tiver acesso a esta propriedade, redireciona
            if (!allowedProperties.includes(propertyId)) {
                alert('Você não tem acesso a esta propriedade.');
                window.location.href = 'dashboard.html';
            }
        }
    } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        // Se ocorrer algum erro, redireciona para a página de login
        window.location.href = '../index.html';
    }
}

async function loadPropertyData(propertyId) {
    try {
        // Busca a propriedade
        const property = await databases.getDocument(
            DATABASE_ID,
            PROPERTIES_COLLECTION_ID,
            propertyId
        );
        
        // Atualiza o título da página
        document.getElementById('propertyTitle').textContent = property.name;
        
        // Busca as transações da propriedade
        const transactions = await databases.listDocuments(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            [
                Appwrite.Query.equal('propertyId', propertyId),
                Appwrite.Query.orderDesc('period')
            ]
        );
        
        // Processa os dados para exibição
        const propertyData = processPropertyData(property, transactions.documents);
        
        // Atualiza a interface com os dados
        updatePropertyInterface(propertyData);
    } catch (error) {
        console.error('Erro ao carregar dados da propriedade:', error);
        alert('Erro ao carregar dados da propriedade. Por favor, tente novamente.');
    }
}

function processPropertyData(property, transactions) {
    // Calcula totais e métricas
    let totalIncome = 0;
    let totalExpenses = 0;
    let airbnbTotal = 0;
    let bookingTotal = 0;
    let directTotal = 0;
    
    // Processa as transações para os últimos 30 dias
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const recent = transactions.filter(transaction => {
        const [month, year] = transaction.period.split('/');
        const transactionDate = new Date(parseInt(year), parseInt(month) - 1);
        return transactionDate >= thirtyDaysAgo;
    });
    
    recent.forEach(transaction => {
        totalIncome += transaction.totalIncome || 0;
        totalExpenses += transaction.totalExpenses || 0;
        airbnbTotal += transaction.airbnb || 0;
        bookingTotal += transaction.booking || 0;
        directTotal += transaction.direct || 0;
    });
    
    const result = totalIncome - totalExpenses;
    const profitability = totalIncome > 0 ? (result / totalIncome) * 100 : 0;
    
    // Processa os dados mensais para o gráfico
    const monthlyData = transactions.map(transaction => {
        return {
            month: convertPeriodToMonthName(transaction.period),
            income: transaction.totalIncome || 0,
            expenses: transaction.totalExpenses || 0,
            result: (transaction.totalIncome || 0) - (transaction.totalExpenses || 0)
        };
    });
    
    // Ordena por data (mais antigo primeiro)
    monthlyData.sort((a, b) => {
        const [aMonth, aYear] = a.month.split('/');
        const [bMonth, bYear] = b.month.split('/');
        
        if (aYear !== bYear) {
            return parseInt(aYear) - parseInt(bYear);
        }
        
        return parseInt(aMonth) - parseInt(bMonth);
    });
    
    return {
        property: property,
        transactions: transactions,
        summary: {
            income: totalIncome,
            expenses: totalExpenses,
            result: result,
            profitability: profitability
        },
        monthlyData: monthlyData,
        incomeBySource: {
            airbnb: airbnbTotal,
            booking: bookingTotal,
            direct: directTotal
        }
    };
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
            <td class="text-income">R$ ${formatCurrency(transaction.airbnb || 0)}</td>
            <td class="text-income">R$ ${formatCurrency(transaction.booking || 0)}</td>
            <td class="text-income">R$ ${formatCurrency(transaction.direct || 0)}</td>
            <td class="text-expense">R$ ${formatCurrency(transaction.condominium || 0)}</td>
            <td class="text-expense">R$ ${formatCurrency(transaction.iptu || 0)}</td>
            <td class="text-expense">R$ ${formatCurrency(transaction.electricity || 0)}</td>
            <td class="text-expense">R$ ${formatCurrency(transaction.internet || 0)}</td>
            <td class="text-expense">R$ ${formatCurrency(transaction.platforms || 0)}</td>
            <td>R$ ${formatCurrency((transaction.totalIncome || 0) - (transaction.totalExpenses || 0))}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editTransaction('${transaction.$id}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteTransaction('${transaction.$id}')">
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
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(2) + '%' : '0%';
                        return `R$ ${value.toLocaleString('pt-BR')} (${percentage})`;
                    }
                }
            },
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    font: {
                        size: 12
                    }
                }
            },
            title: {
                display: false
            }
        }
    }
});

// Função para converter período em nome do mês
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

async function saveTransaction() {
    const propertyId = new URLSearchParams(window.location.search).get('id');
    const periodInput = document.getElementById('transactionPeriod').value;
    const transactionId = window.editingTransactionId;
    
    // Validação básica
    if (!periodInput) {
        alert('Por favor, informe o período.');
        return;
    }
    
    // Converte o período para o formato MM/YYYY
    const period = inputFormatToPeriod(periodInput);
    
    // Coleta os valores do formulário
    const transaction = {
        propertyId: propertyId,
        period: period,
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
    
    try {
        if (transactionId) {
            // Atualiza uma transação existente
            await databases.updateDocument(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                transactionId,
                transaction
            );
        } else {
            // Antes de criar, verifica se já existe uma transação para este período
            const existingTransactions = await databases.listDocuments(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                [
                    Appwrite.Query.equal('propertyId', propertyId),
                    Appwrite.Query.equal('period', period)
                ]
            );
            
            if (existingTransactions.documents.length > 0) {
                // Se existir, atualiza
                await databases.updateDocument(
                    DATABASE_ID,
                    TRANSACTIONS_COLLECTION_ID,
                    existingTransactions.documents[0].$id,
                    transaction
                );
            } else {
                // Se não existir, cria
                await databases.createDocument(
                    DATABASE_ID,
                    TRANSACTIONS_COLLECTION_ID,
                    'unique()',
                    transaction
                );
            }
        }
        
        // Reseta o formulário
        document.getElementById('transactionForm').reset();
        
        // Limpa variável de edição
        window.editingTransactionId = null;
        
        // Fecha o modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addTransactionModal'));
        modal.hide();
        
        // Recarrega os dados da propriedade
        loadPropertyData(propertyId);
        
        alert('Transação salva com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar transação:', error);
        alert('Erro ao salvar transação. Por favor, tente novamente.');
    }
}

async function editTransaction(transactionId) {
    try {
        // Busca a transação
        const transaction = await databases.getDocument(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            transactionId
        );
        
        // Armazena o ID para uso na função de salvar
        window.editingTransactionId = transactionId;
        
        // Preenche o formulário do modal com os dados da transação
        document.getElementById('transactionPeriod').value = periodToInputFormat(transaction.period);
        document.getElementById('incomeAirbnb').value = transaction.airbnb || 0;
        document.getElementById('incomeBooking').value = transaction.booking || 0;
        document.getElementById('incomeDirect').value = transaction.direct || 0;
        document.getElementById('expenseCondominium').value = transaction.condominium || 0;
        document.getElementById('expenseIptu').value = transaction.iptu || 0;
        document.getElementById('expenseElectricity').value = transaction.electricity || 0;
        document.getElementById('expenseInternet').value = transaction.internet || 0;
        document.getElementById('expensePlatforms').value = transaction.platforms || 0;
        
        // Abre o modal
        const modal = new bootstrap.Modal(document.getElementById('addTransactionModal'));
        modal.show();
    } catch (error) {
        console.error('Erro ao carregar dados da transação:', error);
        alert('Erro ao carregar dados da transação. Por favor, tente novamente.');
    }
}

async function deleteTransaction(transactionId) {
    const confirmDelete = confirm('Tem certeza que deseja excluir esta transação?');
    
    if (!confirmDelete) return;
    
    try {
        // Remove a transação
        await databases.deleteDocument(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            transactionId
        );
        
        // Recarrega os dados da propriedade
        const propertyId = new URLSearchParams(window.location.search).get('id');
        loadPropertyData(propertyId);
        
        alert('Transação excluída com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir transação:', error);
        alert('Erro ao excluir transação. Por favor, tente novamente.');
    }
}

function changePropertyPeriod(period) {
    // Armazena o período selecionado
    localStorage.setItem('selectedPeriod', period);
    
    // Recarrega os dados da propriedade
    const propertyId = new URLSearchParams(window.location.search).get('id');
    loadPropertyData(propertyId);
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

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showReports() {
    alert('Funcionalidade de Relatórios em desenvolvimento.');
}
