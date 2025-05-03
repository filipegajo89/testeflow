// js/appwrite-config.js

// Importar o Appwrite corretamente
const { Client, Databases, Account, Storage, ID } = Appwrite;

// Criar o cliente Appwrite
const client = new Client();

// Configure sua instância do Appwrite
client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('68161a6100001e126778'); // Substitua pelo ID do seu projeto

// Inicializar os serviços do Appwrite
const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

// Configuração de banco de dados
const DATABASE_ID = 'flowbnb-database';
const USERS_COLLECTION_ID = 'users';
const PROPERTIES_COLLECTION_ID = 'properties';
const TRANSACTIONS_COLLECTION_ID = 'transactions';
