// js/setup.js
async function setupDatabase() {
    try {
        console.log('Iniciando configuração do banco de dados...');
        
        // Criar banco de dados (se não existir)
        try {
            await databases.create(
                ID.unique(),
                DATABASE_ID,
                'FlowBnb Database'
            );
            console.log('Banco de dados criado com sucesso!');
        } catch (error) {
            console.log('Banco de dados já existe ou erro ao criar:', error);
        }
        
        // Criar coleção de usuários
        try {
            await databases.createCollection(
                DATABASE_ID,
                ID.unique(),
                USERS_COLLECTION_ID,
                'Usuários'
            );
            console.log('Coleção de usuários criada com sucesso!');
            
            // Criar atributos da coleção de usuários
            await databases.createStringAttribute(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                'userId',
                255,
                true,
                null,
                true
            );
            
            await databases.createStringAttribute(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                'email',
                255,
                true,
                null,
                true
            );
            
            await databases.createStringAttribute(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                'name',
                255,
                true
            );
            
            await databases.createStringAttribute(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                'role',
                20,
                true,
                'user'
            );
            
            await databases.createStringAttribute(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                'propertyAccess',
                255,
                false,
                null,
                false,
                false,
                true
            );
            
            console.log('Atributos da coleção de usuários criados com sucesso!');
        } catch (error) {
            console.log('Coleção de usuários já existe ou erro ao criar:', error);
        }
        
        // Criar coleção de propriedades
        try {
            await databases.createCollection(
                DATABASE_ID,
                ID.unique(),
                PROPERTIES_COLLECTION_ID,
                'Propriedades'
            );
            console.log('Coleção de propriedades criada com sucesso!');
            
            // Criar atributos da coleção de propriedades
            await databases.createStringAttribute(
                DATABASE_ID,
                PROPERTIES_COLLECTION_ID,
                'name',
                255,
                true
            );
            
            await databases.createStringAttribute(
                DATABASE_ID,
                PROPERTIES_COLLECTION_ID,
                'address',
                500,
                false
            );
            
            console.log('Atributos da coleção de propriedades criados com sucesso!');
        } catch (error) {
            console.log('Coleção de propriedades já existe ou erro ao criar:', error);
        }
        
        // Criar coleção de transações
        try {
            await databases.createCollection(
                DATABASE_ID,
                ID.unique(),
                TRANSACTIONS_COLLECTION_ID,
                'Transações'
            );
            console.log('Coleção de transações criada com sucesso!');
            
            // Criar atributos da coleção de transações
            await databases.createStringAttribute(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                'propertyId',
                255,
                true
            );
            
            await databases.createStringAttribute(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                'period',
                10,
                true
            );
            
            await databases.createFloatAttribute(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                'airbnb',
                false,
                0
            );
            
            await databases.createFloatAttribute(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                'booking',
                false,
                0
            );
            
            await databases.createFloatAttribute(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                'direct',
                false,
                0
            );
            
            await databases.createFloatAttribute(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                'totalIncome',
                false,
                0
            );
            
            await databases.createFloatAttribute(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                'condominium',
                false,
                0
            );
            
            await databases.createFloatAttribute(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                'iptu',
                false,
                0
            );
            
            await databases.createFloatAttribute(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                'electricity',
                false,
                0
            );
            
            await databases.createFloatAttribute(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                'internet',
                false,
                0
            );
            
            await databases.createFloatAttribute(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                'platforms',
                false,
                0
            );
            
            await databases.createFloatAttribute(
                DATABASE_ID,
                TRANSACTIONS_COLLECTION_ID,
                'totalExpenses',
                false,
                0
            );
            
            console.log('Atributos da coleção de transações criados com sucesso!');
        } catch (error) {
            console.log('Coleção de transações já existe ou erro ao criar:', error);
        }
        
        // Criar usuário administrador padrão
        try {
            // Cria usuário na autenticação do Appwrite
            const user = await account.create(
                ID.unique(),
                'admin@flowbnb.com',
                'admin123',
                'Administrador'
            );
            
            // Adiciona detalhes do usuário no banco de dados
            await databases.createDocument(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                ID.unique(),
                {
                    userId: user.$id,
                    email: 'admin@flowbnb.com',
                    name: 'Administrador',
                    role: 'admin'
                }
            );
            
            console.log('Usuário administrador criado com sucesso!');
        } catch (error) {
            console.log('Usuário administrador já existe ou erro ao criar:', error);
        }
        
        console.log('Configuração do banco de dados concluída!');
    } catch (error) {
        console.error('Erro na configuração do banco de dados:', error);
    }
}

// Executa a configuração quando o botão for clicado
document.getElementById('setupButton').addEventListener('click', setupDatabase);
