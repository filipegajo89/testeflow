// js/import.js
document.addEventListener('DOMContentLoaded', function() {
    // Atualiza o nome do usuário na sidebar
    updateUserInfo();
    
    // Verifica permissões do usuário
    checkUserPermissions();
    
    // Carrega as propriedades para o select
    loadProperties();
    
    // Inicializa o formulário de upload
    initializeUploadForm();
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
        
        // Se o usuário não for admin, redireciona para o dashboard
        if (userData.documents.length > 0 && userData.documents[0].role !== 'admin') {
            alert('Você não tem permissão para acessar esta página.');
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        // Se ocorrer algum erro, redireciona para a página de login
        window.location.href = '../index.html';
    }
}

async function loadProperties() {
    try {
        // Busca todas as propriedades no banco de dados
        const properties = await databases.listDocuments(
            DATABASE_ID,
            PROPERTIES_COLLECTION_ID
        );
        
        // Referência para o select de propriedades
        const propertySelect = document.getElementById('propertySelect');
        
        // Limpa as opções existentes (mantém apenas a opção placeholder)
        propertySelect.innerHTML = '<option value="" selected disabled>Escolha uma propriedade</option>';
        
        // Adiciona cada propriedade ao select
        properties.documents.forEach(property => {
            const option = document.createElement('option');
            option.value = property.$id;
            option.textContent = property.name;
            propertySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar propriedades:', error);
        alert('Erro ao carregar propriedades. Por favor, tente novamente.');
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

async function importData() {
    if (!window.importData) {
        alert('Nenhum dado para importar. Por favor, visualize os dados primeiro.');
        return;
    }
    
    const { data, property } = window.importData;
    
    try {
        // Processa os dados para o formato do aplicativo
        const processedData = processDataForImport(data);
        
        // Contador para acompanhar progresso
        let importedCount = 0;
        
        // Importa cada transação
        for (const transaction of processedData) {
            // Verifica se já existe uma transação para este período
            const existingTransactions = await databases.listDocuments(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                [
                    Appwrite.Query.equal('propertyId', property),
                    Appwrite.Query.equal('period', transaction.period)
                ]
            );
            
            // Adiciona o ID da propriedade
            transaction.propertyId = property;
            
            if (existingTransactions.documents.length > 0) {
                // Atualiza a transação existente
                await databases.updateDocument(
                    DATABASE_ID,
                    TRANSACTIONS_COLLECTION_ID,
                    existingTransactions.documents[0].$id,
                    transaction
                );
            } else {
                // Cria uma nova transação
                await databases.createDocument(
                    DATABASE_ID,
                    TRANSACTIONS_COLLECTION_ID,
                    'unique()',
                    transaction
                );
            }
            
            importedCount++;
        }
        
        alert(`Importação concluída com sucesso! Foram processadas ${importedCount} transações.`);
        
        // Redireciona para a página da propriedade
        window.location.href = `property.html?id=${property}`;
    } catch (error) {
        console.error('Erro ao importar dados:', error);
        alert('Erro ao importar dados: ' + error.message);
    }
}

function processDataForImport(data) {
    // Mapeia os dados da planilha para o formato do aplicativo
    return data.map(row => {
        // Arrays de possíveis nomes de colunas para cada categoria
        const periodColumns = ['PERÍODO', 'PERIODO', 'MÊS', 'MES', 'DATA', 'MONTH'];
        const airbnbColumns = ['AIRBNB', 'RECEITA AIRBNB', 'AIRBNB RECEITA'];
        const bookingColumns = ['BOOKING', 'RECEITA BOOKING', 'BOOKING RECEITA'];
        const diretasColumns = ['DIRETAS', 'RECEITA DIRETA', 'RESERVAS DIRETAS'];
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
        
        // Despesas (sempre positivas em valores absolutos)
        let condominium = Math.abs(convertValue(findValue(condominioColumns)));
        let iptu = Math.abs(convertValue(findValue(iptuColumns)));
        let electricity = Math.abs(convertValue(findValue(luzColumns)));
        let internet = Math.abs(convertValue(findValue(internetColumns)));
        let platforms = Math.abs(convertValue(findValue(plataformasColumns)));
        
        // Receita total
        const totalIncome = airbnb + booking + direct;
        
        // Despesas totais
        const totalExpenses = condominium + iptu + electricity + internet + platforms;
        
        // Retorna o objeto formatado
        return {
            period,
            airbnb,
            booking,
            direct,
            totalIncome,
            condominium,
            iptu,
            electricity,
            internet,
            platforms,
            totalExpenses
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

function downloadTemplate() {
    // Cria um template de planilha para download
    const template = [
        ['PERÍODO', 'AIRBNB', 'BOOKING', 'DIRETAS', 'RECEITA', 'CONDOMÍNIO', 'IPTU', 'LUZ', 'INTERNET', 'PLATAFORMAS'],
        ['01/2025', 'R$ 3.000,00', 'R$ 0,00', 'R$ 0,00', 'R$ 3.000,00', 'R$ 1.000,00', 'R$ 150,00', 'R$ 100,00', 'R$ 120,00', 'R$ 150,00']
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
