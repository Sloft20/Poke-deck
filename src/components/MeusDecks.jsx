import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Plus, Trash2, Edit2, Inbox, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast'; // Adicionamos os Toasts aqui!

export default function MeusDecks() {
  const decks = useLiveQuery(() => db.decks.toArray());

  const criarNovoDeck = async () => {
    const nomeDoDeck = prompt("Qual o nome do seu novo deck?");
    if (!nomeDoDeck) return;

    try {
      await db.decks.add({
        nome: nomeDoDeck,
        dataCriacao: new Date().toLocaleDateString('pt-BR'),
        cartas: [] 
      });
      toast.success(`Deck "${nomeDoDeck}" criado com sucesso!`);
    } catch (erro) {
      console.error("Erro ao criar deck:", erro);
      toast.error("Erro ao salvar o deck localmente.");
    }
  };

  const deletarDeck = async (id, nome) => {
    if (confirm(`Tem certeza que quer apagar o deck "${nome}"?`)) {
      await db.decks.delete(id);
      toast.success("Deck apagado.");
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Meus Decks</h2>
        
        <button 
          onClick={criarNovoDeck}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/20 w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          <span>Criar Novo Deck</span>
        </button>
      </div>

      {decks === undefined && (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      )}

      {decks !== undefined && decks.length === 0 && (
        <div className="text-center py-16 px-4 bg-slate-900 rounded-2xl shadow-lg border border-slate-800">
          <Inbox className="mx-auto h-16 w-16 text-slate-600 mb-4" />
          <h3 className="text-xl font-medium text-slate-300 mb-2">Nenhum deck encontrado</h3>
          <p className="text-slate-500">
            Você ainda não criou nenhum deck. Clique no botão acima para começar!
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {decks?.map((deck) => (
          <div key={deck.id} className="bg-slate-900 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-800 overflow-hidden flex flex-col">
            
            <div className="p-5 flex-grow">
              <h3 className="text-xl font-bold text-slate-100 mb-2 uppercase truncate" title={deck.nome}>
                {deck.nome}
              </h3>
              
              <div className="flex items-center text-slate-400 mb-1">
                <Layers size={16} className="mr-2" />
                <span className="text-sm font-medium">Cartas: {deck.cartas?.length || 0}/60</span>
              </div>
              
              <div className="text-xs text-slate-500 mt-4">
                Criado em: {deck.dataCriacao}
              </div>
            </div>
            
            <div className="border-t border-slate-800 p-3 bg-slate-900/50 flex gap-2">
              <Link 
                to={`/deck/${deck.id}`}
                className="flex-1 flex items-center justify-center space-x-1 py-2 px-3 bg-slate-800 border border-slate-700 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium"
              >
                <Edit2 size={16} />
                <span>Ver Cartas</span>
              </Link>
              
              <button 
                onClick={() => deletarDeck(deck.id, deck.nome)} 
                className="flex-1 flex items-center justify-center space-x-1 py-2 px-3 bg-red-950/30 text-red-400 border border-red-900/50 rounded-md hover:bg-red-600 hover:text-white transition-colors text-sm font-medium"
              >
                <Trash2 size={16} />
                <span>Apagar</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}