// js/setup.js - Versão modificada com seu email
async function setupDatabase() {
    try {
        console.log('Iniciando criação do usuário administrador...');
        
        // Criar usuário administrador padrão
        try {
            // Use seu próprio email aqui
            const seuEmail = "filipegajo89@gmail.com"; // Substitua pelo seu email
            const senha = "M@ite2702"; // Escolha uma senha segura
            
            // Cria usuário na autenticação do Appwrite
            const user = await account.create(
                ID.unique(),
                seuEmail,
                senha,
                'Administrador'
            );
            
            // Adiciona detalhes do usuário no banco de dados
            await databases.createDocument(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                ID.unique(),
                {
                    userId: user.$id,
                    email: seuEmail,
                    name: 'Administrador',
                    role: 'admin'
                }
            );
            
            console.log('Usuário administrador criado com sucesso!');
            console.log('Email: ' + seuEmail);
            console.log('Senha: ' + senha);
            console.log('Por favor, anote estas credenciais em um local seguro!');
        } catch (error) {
            console.log('Usuário administrador já existe ou erro ao criar:', error);
        }
        
        console.log('Configuração concluída!');
    } catch (error) {
        console.error('Erro na configuração:', error);
    }
}

// Executa a configuração quando o botão for clicado
document.getElementById('setupButton').addEventListener('click', setupDatabase);
