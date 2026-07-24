import Dexie from 'dexie';

export const db = new Dexie('PokeDeckDB');

// Mude a versão de 1 para 2 (ou o número seguinte ao que estiver aí)
// E adicione a linha da tabela de colecoes
db.version(2).stores({
  decks: '++id, nome',
  colecoes: '++id, nome' // <-- Nova tabela para os colecionadores!
});