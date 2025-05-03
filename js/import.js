document.addEventListener('DOMContentLoaded', function() {
    // Atualiza o nome do usuário na sidebar
    updateUserInfo();
    
    // Verifica permissões do usuário
    checkUserPermissions();
    
    // Inicializa o formulário de upload
    initializeUploadForm();
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

function initializeUploadForm() {
    // Adiciona evento para o input de arquivo
    const fileInput = document.getElementById('fileUpload');
    fileInput.addEventListener('change', function() {
        // Reset preview
        document.getElementById('previewContainer').classList.add('d-none');
        document.getElementById('importButton').disabled = true;
    });
}

function previewData() {
    const fileInput = document.getElementById('fileUpload');
    const propertySelect = document.getElementById('propertySelect');
    
    // Validações básicas
    if (!propertySelect.value) {
        alert('Por favor, selecione uma propriedade.');
        return;
    }
    
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Por favor, selecione um arquivo para upload.');
        return;
    }
    
    const file = fileInput.files[0];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    // Processa o arquivo com base na extensão
    if (fileExtension === 'csv') {
        parseCSV(file);
    } else if (['xls', 'xlsx'].includes(fileExtension)) {
        parseExcel(file);
    } else {
        alert('Formato de arquivo não suportado. Por favor, faça upload de um arquivo CSV ou Excel.');
    }
}

function parseCSV(file) {
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            displayPreview(results.data, Object.keys(results.data[0]));
        },
        error: function(error) {
            alert('Erro ao processar o arquivo CSV: ' + error);
        }
    });
}

function parseExcel(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Assume a primeira planilha
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converte para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Extrai cabeçalhos e dados
        const headers = jsonData[0];
        const rows = jsonData.slice(1);
        
        // Converte para o formato adequado
        const formattedData = rows.map(row => {
            const rowData = {};
            headers.forEach((header, index) => {
                rowData[header] = row[index];
            });
            return rowData;
        });
        
        displayPreview(formattedData, headers);
    };
    
    reader.onerror = function() {
        alert('Erro ao ler o arquivo Excel.');
    };
    
    reader.readAsArrayBuffer(file);
}

function displayPreview(data, headers) {
    // Limita a exibição a 10 linhas
    const previewData = data.slice(0, 10);
    
    // Referências aos elementos HTML
    const previewContainer = document.getElementById('previewContainer');
    const previewTableHead = document.getElementById('previewTableHead');
    const previewTableBody = document.getElementById('previewTableBody');
    const previewInfo = document.getElementById('previewInfo');
    const importButton = document.getElementById('importButton');
    
    // Limpa conteúdo anterior
    previewTableHead.innerHTML = '';
    previewTableBody.innerHTML = '';
    
    // Adiciona cabeçalhos
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    previewTableHead.appendChild(headerRow);
    
    // Adiciona linhas de dados
    previewData.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] || '';
            tr.appendChild(td);
        });
        previewTableBody.appendChild(tr);
    });
    
    // Atualiza informações e mostra a visualização
    previewInfo.textContent = `Mostrando ${previewData.length} de ${data.length} registros. Verifique se os dados estão corretos antes de importar.`;
    previewContainer.classList.remove('d-none');
    importButton.disabled = false;
    
    // Armazena dados para importação
    window.importData = {
        data: data,
        headers: headers,
        property: document.getElementById('propertySelect').value
    };
}

function importData() {
    if (!window.importData) {
        alert('Nenhum dado para importar. Por favor, visualize os dados primeiro.');
        return;
    }
    
    const { data, property } = window.importData;
    
    try {
        // Processa os dados para o formato do aplicativo
        const processedData = processDataForImport(data, property);
        
        // Armazena os dados no localStorage
        saveImportedData(processedData, property);
        
        alert('Dados importados com sucesso!');
        
        // Redireciona para a página da propriedade
        window.location.href = `property.html?id=${property}`;
    } catch (error) {
        alert('Erro ao importar dados: ' + error.message);
    }
}

// Modificação na função parseExcel e parseCSV
function processDataForImport(data, propertyId) {
    // Mapeia os dados da planilha para o formato do aplicativo
    return data.map(row => {
        // Arrays de possíveis nomes de colunas para cada categoria
        const periodColumns = ['PERÍODO', 'PERIODO', 'MÊS', 'MES', 'DATA', 'MONTH'];
        const airbnbColumns = ['AIRBNB', 'RECEITA AIRBNB', 'AIRBNB RECEITA'];
        const bookingColumns = ['BOOKING', 'RECEITA BOOKING', 'BOOKING RECEITA'];
        const diretasColumns = ['DIRETAS', 'RECEITA DIRETA', 'RESERVAS DIRETAS'];
        const receitaColumns = ['RECEITA', 'RECEITA TOTAL', 'TOTAL RECEITAS'];
        const condominioColumns = ['CONDOMÍNIO', 'CONDOMINIO', 'TAXA CONDOMÍNIO'];
        const iptuColumns = ['IPTU', 'IPTU + TX LIXO', 'IMPOSTO'];
        const luzColumns = ['LUZ', 'ENERGIA', 'ELETRICIDADE'];
        const internetColumns = ['INTERNET', 'WIFI', 'REDE'];
        const plataformasColumns = ['PLATAFORMAS', 'TAXA PLATAFORMAS', 'COMISSÕES'];
        
        // Função para encontrar valor com base nos possíveis nomes de coluna
        const findValue = (possibleColumns) => {
            for (let column of possibleColumns) {
                if (row[column] !== undefined) {
                    return row[column];
                }
            }
            return 0;
        };
        
        // Função para converter valores, respeitando sinais
        const convertValue = (value) => {
            if (!value) return 0;
            if (typeof value === 'number') return value;
            
            // Remove R$ e espaços, preserva sinal negativo
            const isNegative = value.toString().includes('-');
            const cleanValue = value.toString()
                .replace('R$', '')
                .replace(/\s/g, '')
                .replace('-', '')
                .replace('.', '')
                .replace(',', '.');
            
            const numValue = parseFloat(cleanValue) || 0;
            return isNegative ? -numValue : numValue;
        };
        
        // Obtém valores das colunas
        const period = formatPeriod(findValue(periodColumns) || '');
        
        // Receitas (sempre positivas)
        let airbnb = Math.abs(convertValue(findValue(airbnbColumns)));
        let booking = Math.abs(convertValue(findValue(bookingColumns)));
        let direct = Math.abs(convertValue(findValue(diretasColumns)));
        
        // Despesas (sempre negativas)
        const condominium = -Math.abs(convertValue(findValue(condominioColumns)));
        const iptu = -Math.abs(convertValue(findValue(iptuColumns)));
        const electricity = -Math.abs(convertValue(findValue(luzColumns)));
        const internet = -Math.abs(convertValue(findValue(internetColumns)));
        const platforms = -Math.abs(convertValue(findValue(plataformasColumns)));
        
        // Se algum valor vier negativo da planilha, consideramos como despesa
        if (airbnb < 0) airbnb = 0;
        if (booking < 0) booking = 0;
        if (direct < 0) direct = 0;
        
        // Receita total
        const totalIncome = airbnb + booking + direct;
        
        // Despesas totais (já são negativas)
        const totalExpenses = condominium + iptu + electricity + internet + platforms;
        
        // Resultado (receita - despesas)
        const result = totalIncome + totalExpenses; // Soma pois totalExpenses já é negativo
        
        // Retorna o objeto formatado
        return {
            period,
            airbnb,
            booking,
            direct,
            totalIncome,
            condominium: Math.abs(condominium), // Armazena valor absoluto
            iptu: Math.abs(iptu),
            electricity: Math.abs(electricity),
            internet: Math.abs(internet),
            platforms: Math.abs(platforms),
            totalExpenses: Math.abs(totalExpenses),
            result
        };
    });
}

function formatPeriod(periodStr) {
    // Tenta identificar e formatar corretamente o período
    if (!periodStr) return '';
    
    // Se for uma data no formato DD/MM/YYYY
    if (periodStr.match(/\d{2}\/\d{2}\/\d{4}/)) {
        const parts = periodStr.split('/');
        return `${parts[1]}/${parts[2]}`; // Retorna MM/YYYY
    }
    
    // Se for MM/YYYY, retorna como está
    if (periodStr.match(/\d{2}\/\d{4}/)) {
        return periodStr;
    }
    
    // Se for apenas texto como "Jan", converte para número do mês
    const monthMap = {
        'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06',
        'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
    };
    
    // Tenta extrair mês e ano
    const monthMatch = periodStr.toLowerCase().match(/^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/);
    const yearMatch = periodStr.match(/\d{4}/);
    
    if (monthMatch && yearMatch) {
        return `${monthMap[monthMatch[1]]}/${yearMatch[0]}`;
    }
    
    // Retorna como está se não conseguir formatar
    return periodStr;
}

function saveImportedData(processedData, propertyId) {
    // Obtém dados existentes ou inicializa
    const allProperties = JSON.parse(localStorage.getItem('propertiesData')) || {};
    
    // Cria estrutura para a propriedade se não existir
    if (!allProperties[propertyId]) {
        allProperties[propertyId] = {
            transactions: []
        };
    }
    
    // Atualiza ou adiciona transações
    processedData.forEach(transaction => {
        // Verifica se já existe uma transação para este período
        const existingIndex = allProperties[propertyId].transactions.findIndex(
            t => t.period === transaction.period
        );
        
        if (existingIndex >= 0) {
            // Atualiza a transação existente
            allProperties[propertyId].transactions[existingIndex] = transaction;
        } else {
            // Adiciona nova transação
            allProperties[propertyId].transactions.push(transaction);
        }
    });
    
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
}

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

function updateDashboardData(allProperties) {
    // Atualiza os dados do dashboard com base em todas as propriedades
    
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

function downloadTemplate() {
    // Cria um template de planilha para download
    const template = [
        ['PERÍODO', 'AIRBNB', 'BOOKING', 'DIRETAS', 'RECEITA', 'CONDOMÍNIO', 'IPTU', 'LUZ', 'INTERNET', 'PLATAFORMAS', 'RESULTADO'],
        ['01/2025', 'R$ 3.000,00', 'R$ 0,00', 'R$ 0,00', 'R$ 3.000,00', 'R$ 1.000,00', 'R$ 0,00', 'R$ 100,00', 'R$ 120,00', 'R$ 150,00', 'R$ 1.630,00']
    ];
    
    // Cria uma planilha
    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    
    // Gera o arquivo e inicia o download
    XLSX.writeFile(wb, 'flowbnb_template.xlsx');
}

function showReports() {
    alert('Funcionalidade de Relatórios em desenvolvimento.');
}
