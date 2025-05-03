// js/auth.js
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se o usuário já está logado
    checkLoginStatus();
    
    // Adiciona evento de submit ao formulário de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Adiciona evento ao link de recuperação de senha
    const forgotPasswordLink = document.querySelector('[data-bs-target="#forgotPasswordModal"]');
    if (forgotPasswordLink) {
        const forgotPasswordBtn = document.querySelector('#forgotPasswordModal .btn-primary');
        forgotPasswordBtn.addEventListener('click', handlePasswordRecovery);
    }
});

async function checkLoginStatus() {
    try {
        // Verifica se há uma sessão ativa no Appwrite
        const user = await account.get();
        
        // Se estiver na página de login e já estiver logado, redireciona para o dashboard
        if (window.location.pathname.includes('index.html')) {
            window.location.href = 'pages/dashboard.html';
        }
    } catch (error) {
        // Se não estiver logado ou a sessão expirou
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
        }
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        // Criar uma sessão (login) no Appwrite
        await account.createEmailSession(email, password);
        
        // Buscar dados do usuário
        const user = await account.get();
        
        // Buscar informações adicionais do usuário do banco de dados
        const userData = await databases.listDocuments(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            [Appwrite.Query.equal('email', email)]
        );
        
        if (userData.documents.length > 0) {
            const userInfo = userData.documents[0];
            
            // Salva informações básicas no localStorage para uso na aplicação
            localStorage.setItem('userName', userInfo.name);
            localStorage.setItem('userRole', userInfo.role);
            
            if (userInfo.propertyAccess) {
                localStorage.setItem('propertyAccess', userInfo.propertyAccess);
            }
            
            // Redireciona para o dashboard
            window.location.href = 'pages/dashboard.html';
        } else {
            throw new Error('Usuário não encontrado.');
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        
        // Exibe mensagem de erro
        const errorMessage = document.createElement('div');
        errorMessage.className = 'alert alert-danger mt-3';
        errorMessage.textContent = 'E-mail ou senha incorretos!';
        
        const form = document.getElementById('loginForm');
        form.appendChild(errorMessage);
        
        // Remove a mensagem após 3 segundos
        setTimeout(() => {
            errorMessage.remove();
        }, 3000);
    }
}

async function handlePasswordRecovery() {
    const email = document.getElementById('recoveryEmail').value;
    
    try {
        // Envia e-mail de recuperação de senha do Appwrite
        await account.createRecovery(
            email,
            window.location.origin + '/reset-password.html'
        );
        
        // Exibe mensagem de sucesso
        const resultElement = document.getElementById('recoveryResult');
        resultElement.classList.remove('d-none', 'alert-danger');
        resultElement.classList.add('alert-success');
        resultElement.textContent = 'E-mail de recuperação enviado. Verifique sua caixa de entrada.';
    } catch (error) {
        console.error('Erro na recuperação de senha:', error);
        
        // Exibe mensagem de erro
        const resultElement = document.getElementById('recoveryResult');
        resultElement.classList.remove('d-none', 'alert-success');
        resultElement.classList.add('alert-danger');
        resultElement.textContent = 'Erro ao enviar e-mail de recuperação. Verifique se o e-mail está correto.';
    }
}

async function logout() {
    try {
        // Excluir a sessão atual no Appwrite
        await account.deleteSession('current');
        
        // Limpa as informações do localStorage
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('propertyAccess');
        
        // Redireciona para a página de login
        window.location.href = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

// Função para atualizar o menu lateral com as propriedades
async function updateSidebarMenu() {
    // Verifica se o elemento do menu existe
    const propertyLinks = document.getElementById('propertyLinks');
    if (!propertyLinks) return;
    
    try {
        // Busca as propriedades no banco de dados
        const properties = await databases.listDocuments(
            DATABASE_ID,
            PROPERTIES_COLLECTION_ID
        );
        
        // Limpa os links existentes
        propertyLinks.innerHTML = '';
        
        // Obtém o ID da propriedade atual da URL (se estiver na página de propriedade)
        let currentPropertyId = '';
        if (window.location.pathname.includes('property.html')) {
            const urlParams = new URLSearchParams(window.location.search);
            currentPropertyId = urlParams.get('id') || '';
        }
        
        // Se não houver propriedades, exibe mensagem
        if (properties.documents.length === 0) {
            propertyLinks.innerHTML = '<p class="text-muted small px-3">Nenhuma propriedade encontrada</p>';
            return;
        }
        
        // Adiciona cada propriedade ao menu
        properties.documents.forEach(property => {
            const listItem = document.createElement('li');
            const isActive = property.$id === currentPropertyId;
            
            listItem.innerHTML = `
                <a href="${getProperPath()}property.html?id=${property.$id}" class="nav-link ${isActive ? 'active' : ''}">
                    <i class="bi bi-house me-2"></i>
                    ${property.name}
                </a>
            `;
            
            propertyLinks.appendChild(listItem);
        });
    } catch (error) {
        console.error('Erro ao carregar propriedades:', error);
        propertyLinks.innerHTML = '<p class="text-danger small px-3">Erro ao carregar propriedades</p>';
    }
}

// Função para obter o caminho correto (para links relativos)
function getProperPath() {
    // Verifica se estamos na raiz ou em uma subpasta
    if (window.location.pathname.includes('/pages/')) {
        return '';
    } else {
        return 'pages/';
    }
}

// Função para destacar a página atual no menu
function highlightCurrentPage() {
    // Remove a classe active de todos os links
    document.querySelectorAll('.nav-link').forEach(link => {
        // Não remova de links de propriedades que já estão destacados
        if (!link.closest('#propertyLinks')) {
            link.classList.remove('active');
        }
    });
    
    // Obtém o nome da página atual
    const currentPage = window.location.pathname.split('/').pop();
    
    // Destaca o link correspondente à página atual
    if (currentPage === '' || currentPage === 'index.html' || currentPage === 'dashboard.html') {
        const dashboardLink = document.querySelector('a[href*="dashboard.html"]');
        if (dashboardLink) dashboardLink.classList.add('active');
    } else if (currentPage === 'import.html') {
        const importLink = document.querySelector('a[href*="import.html"]');
        if (importLink) importLink.classList.add('active');
    } else if (currentPage === 'properties.html') {
        const propertiesLink = document.querySelector('a[href*="properties.html"]');
        if (propertiesLink) propertiesLink.classList.add('active');
    }
}

// Atualiza o menu lateral quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    updateSidebarMenu();
    highlightCurrentPage();
});
