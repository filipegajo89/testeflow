// js/properties.js
document.addEventListener('DOMContentLoaded', function() {
    // Atualiza o nome do usuário na sidebar
    updateUserInfo();
    
    // Verifica permissões do usuário
    checkUserPermissions();
    
    // Carrega as propriedades
    loadProperties();
    
    // Configura os eventos dos modais
    setupModalEvents();
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
        
        // Referência para a tabela
        const tableBody = document.getElementById('propertiesTableBody');
        const noPropertiesMessage = document.getElementById('noPropertiesMessage');
        
        // Limpa a tabela
        tableBody.innerHTML = '';
        
        // Se não houver propriedades, mostra mensagem
        if (properties.documents.length === 0) {
            noPropertiesMessage.classList.remove('d-none');
            return;
        }
        
        noPropertiesMessage.classList.add('d-none');
        
        // Adiciona cada propriedade à tabela
        for (const property of properties.documents) {
            // Busca as transações desta propriedade
            const transactions = await databases.listDocuments(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                [Appwrite.Query.equal('propertyId', property.$id)]
            );
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${property.$id}</td>
                <td>${property.name}</td>
                <td>${transactions.documents.length}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="editProperty('${property.$id}')">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProperty('${property.$id}')">
                        <i class="bi bi-trash"></i> Excluir
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Erro ao carregar propriedades:', error);
        alert('Erro ao carregar propriedades. Por favor, tente novamente.');
    }
}

function setupModalEvents() {
    // Configura o modal de adicionar/editar propriedade
    const propertyModal = document.getElementById('addPropertyModal');
    if (propertyModal) {
        propertyModal.addEventListener('show.bs.modal', function(event) {
            // Se for aberto pelo botão "Nova Propriedade", reseta o formulário
            if (!event.relatedTarget || event.relatedTarget.classList.contains('btn-primary')) {
                resetPropertyForm();
            }
        });
    }
}

function resetPropertyForm() {
    // Limpa o formulário
    document.getElementById('propertyId').value = '';
    document.getElementById('propertyName').value = '';
    document.getElementById('propertyAddress').value = '';
    
    // Atualiza o título do modal
    document.getElementById('addPropertyModalLabel').textContent = 'Nova Propriedade';
}

async function saveProperty() {
    // Obtém os valores do formulário
    const propertyId = document.getElementById('propertyId').value;
    const propertyName = document.getElementById('propertyName').value.trim();
    const propertyAddress = document.getElementById('propertyAddress').value.trim();
    
    // Validação básica
    if (!propertyName) {
        alert('Por favor, informe o nome da propriedade.');
        return;
    }
    
    try {
        const propertyData = {
            name: propertyName,
            address: propertyAddress || ''
        };
        
        if (propertyId) {
            // Atualiza uma propriedade existente
            await databases.updateDocument(
                DATABASE_ID,
                PROPERTIES_COLLECTION_ID,
                propertyId,
                propertyData
            );
        } else {
            // Cria uma nova propriedade
            await databases.createDocument(
                DATABASE_ID,
                PROPERTIES_COLLECTION_ID,
                'unique()',
                propertyData
            );
        }
        
        // Fecha o modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addPropertyModal'));
        modal.hide();
        
        // Recarrega as propriedades
        loadProperties();
        
        // Avisa ao usuário
        alert(`Propriedade ${propertyId ? 'atualizada' : 'adicionada'} com sucesso!`);
    } catch (error) {
        console.error('Erro ao salvar propriedade:', error);
        alert('Erro ao salvar propriedade. Por favor, tente novamente.');
    }
}

async function editProperty(id) {
    try {
        // Busca a propriedade no banco de dados
        const property = await databases.getDocument(
            DATABASE_ID,
            PROPERTIES_COLLECTION_ID,
            id
        );
        
        // Preenche o formulário com os dados da propriedade
        document.getElementById('propertyId').value = property.$id;
        document.getElementById('propertyName').value = property.name;
        document.getElementById('propertyAddress').value = property.address || '';
        
        // Atualiza o título do modal
        document.getElementById('addPropertyModalLabel').textContent = 'Editar Propriedade';
        
        // Abre o modal
        const modal = new bootstrap.Modal(document.getElementById('addPropertyModal'));
        modal.show();
    } catch (error) {
        console.error('Erro ao carregar dados da propriedade:', error);
        alert('Erro ao carregar dados da propriedade. Por favor, tente novamente.');
    }
}

function deleteProperty(id) {
    // Abre modal de confirmação
    const modal = new bootstrap.Modal(document.getElementById('deletePropertyModal'));
    
    // Armazena o ID para uso na função de confirmação
    window.propertyToDelete = id;
    
    // Atualiza o modal de confirmação
    try {
        databases.getDocument(
            DATABASE_ID,
            PROPERTIES_COLLECTION_ID,
            id
        ).then(property => {
            document.getElementById('deletePropertyName').textContent = property.name;
            modal.show();
        });
    } catch (error) {
        console.error('Erro ao buscar nome da propriedade:', error);
        document.getElementById('deletePropertyName').textContent = 'selecionada';
        modal.show();
    }
}

async function confirmDeleteProperty() {
    const id = window.propertyToDelete;
    
    if (!id) {
        alert('Erro ao excluir propriedade.');
        return;
    }
    
    try {
        // Exclui a propriedade
        await databases.deleteDocument(
            DATABASE_ID,
            PROPERTIES_COLLECTION_ID,
            id
        );
        
        // Também exclui todas as transações desta propriedade
        const transactions = await databases.listDocuments(
            DATABASE_ID,
            TRANSACTIONS_COLLECTION_ID,
            [Appwrite.Query.equal('propertyId', id)]
        );
        
        // Exclui cada transação individualmente
        for (const transaction of transactions.documents) {
            await databases.deleteDocument(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                transaction.$id
            );
        }
        
        // Fecha o modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deletePropertyModal'));
        modal.hide();
        
        // Limpa a referência
        window.propertyToDelete = null;
        
        // Recarrega as propriedades
        loadProperties();
        
        // Avisa ao usuário
        alert('Propriedade excluída com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir propriedade:', error);
        alert('Erro ao excluir propriedade. Por favor, tente novamente.');
    }
}

function showReports() {
    alert('Funcionalidade de Relatórios em desenvolvimento.');
}
