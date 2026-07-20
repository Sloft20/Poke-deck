import Dexie from 'dexie';

// Cria o banco de dados chamado "PokemonDeckDB"
export const db = new Dexie('PokemonDeckDB');

// Define as tabelas (stores). 
// O '++id' significa que o ID do deck será gerado automaticamente.
db.version(1).stores({
  decks: '++id, nome, dataCriacao' // O Dexie salva as cartas dentro do objeto do deck automaticamente
});