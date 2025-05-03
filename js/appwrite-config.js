// appwrite-config.js
const client = new Appwrite.Client();

// Configure sua instância do Appwrite Cloud
client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('68161a6100001e126778'); // Substitua pelo ID do seu projeto

// Cria os serviços
const account = new Appwrite.Account(client);
const databases = new Appwrite.Databases(client);
const storage = new Appwrite.Storage(client);

// Configuração de banco de dados
const DATABASE_ID = 'flowbnb-database';
const USERS_COLLECTION_ID = 'users';
const PROPERTIES_COLLECTION_ID = 'properties';
const TRANSACTIONS_COLLECTION_ID = 'transactions';
