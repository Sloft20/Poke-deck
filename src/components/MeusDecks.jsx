import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Plus, Trash2, Edit2, Inbox, Layers, X, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cardImageUrl } from '../pokeApi';

export default function MeusDecks() {
  const decks = useLiveQuery(() => db.decks.toArray());

  // ESTADOS DOS MODAIS
  const [modalCriar, setModalCriar] = useState(false);
  const [nomeNovoDeck, setNomeNovoDeck] = useState('');
  
  const [modalApagar, setModalApagar] = useState({ aberto: false, id: null, nome: '' });

  // FUNÇÕES DE CRIAR DECK
  const abrirModalCriar = () => {
    setNomeNovoDeck('');
    setModalCriar(true);
  };

  const confirmarCriacaoDeck = async () => {
    if (!nomeNovoDeck.trim()) {
      toast.error("O nome do deck não pode estar vazio!");
      return;
    }

    try {
      await db.decks.add({
        nome: nomeNovoDeck,
        dataCriacao: new Date().toLocaleDateString('pt-BR'),
        cartas: [] 
      });
      toast.success(`Deck "${nomeNovoDeck}" criado com sucesso!`);
      setModalCriar(false); // Fecha o modal
    } catch (erro) {
      console.error("Erro ao criar deck:", erro);
      toast.error("Erro ao salvar o deck localmente.");
    }
  };

  // FUNÇÕES DE APAGAR DECK
  const confirmarDeletarDeck = async () => {
    if (!modalApagar.id) return;
    
    await db.decks.delete(modalApagar.id);
    toast.success(`Deck "${modalApagar.nome}" apagado.`);
    setModalApagar({ aberto: false, id: null, nome: '' }); // Fecha o modal
  };

  const obterCartasCapa = (cartas) => {
    if (!cartas || cartas.length === 0) return [];
    
    let unicas = [];
    let idsVistos = new Set();
    
    for (let c of cartas) {
      if (c.destaque && !idsVistos.has(c.id)) {
        unicas.push(c);
        idsVistos.add(c.id);
      }
      if (unicas.length === 3) return unicas;
    }
    
    for (let c of cartas) {
      if (c.category === 'Pokemon' && !idsVistos.has(c.id)) {
        unicas.push(c);
        idsVistos.add(c.id);
      }
      if (unicas.length === 3) return unicas;
    }
    
    for (let c of cartas) {
      if (!idsVistos.has(c.id)) {
        unicas.push(c);
        idsVistos.add(c.id);
      }
      if (unicas.length === 3) return unicas;
    }
    
    return unicas;
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-slate-100 tracking-tight">Meus Decks</h2>
        
        <button 
          onClick={abrirModalCriar}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg shadow-emerald-900/20 w-full sm:w-auto justify-center active:scale-95"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>Criar Novo Deck</span>
        </button>
      </div>

      {decks === undefined && (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      )}

      {decks !== undefined && decks.length === 0 && (
        <div className="text-center py-16 px-4 bg-slate-900/50 rounded-2xl shadow-lg border border-slate-800 backdrop-blur-sm">
          <Inbox className="mx-auto h-16 w-16 text-slate-700 mb-4" />
          <h3 className="text-xl font-bold text-slate-300 mb-2">Nenhum deck encontrado</h3>
          <p className="text-slate-500">
            Você ainda não criou nenhum deck. Clique no botão acima para começar!
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {decks?.map((deck) => {
          const cartasCapa = obterCartasCapa(deck.cartas);
          
          return (
            <div key={deck.id} className="bg-slate-900 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-slate-800 overflow-hidden flex flex-col group relative">
              <div className="h-36 bg-slate-950 flex justify-center items-center overflow-hidden border-b border-slate-800/50 relative">
                {cartasCapa.length > 0 ? (
                  <div className="flex justify-center items-center mt-4">
                    {cartasCapa.map((carta, index) => (
                      <img 
                        key={carta.id + index}
                        src={cardImageUrl(carta.image)} 
                        alt={carta.name}
                        className={`w-20 object-contain rounded-md shadow-2xl border border-slate-700/50 transition-all duration-500 group-hover:-translate-y-3
                          ${index === 0 ? '-rotate-12 translate-y-2 translate-x-6 z-0 opacity-80 group-hover:rotate-[-16deg] group-hover:opacity-100' : ''}
                          ${index === 1 ? 'scale-110 z-10 shadow-black/50' : ''}
                          ${index === 2 ? 'rotate-12 translate-y-2 -translate-x-6 z-0 opacity-80 group-hover:rotate-[16deg] group-hover:opacity-100' : ''}
                          ${cartasCapa.length === 1 ? 'translate-x-0 rotate-0 opacity-100 scale-110' : ''}
                          ${cartasCapa.length === 2 && index === 0 ? '-rotate-6 translate-x-3 translate-y-0 opacity-100' : ''}
                          ${cartasCapa.length === 2 && index === 1 ? 'rotate-6 -translate-x-3 translate-y-0 opacity-100 scale-100' : ''}
                        `}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-700 flex flex-col items-center">
                    <Inbox size={28} className="mb-2 opacity-50" />
                    <span className="text-xs font-bold uppercase tracking-widest opacity-50">Deck Vazio</span>
                  </div>
                )}
              </div>
              
              <div className="p-5 flex-grow bg-slate-900">
                <h3 className="text-xl font-bold text-slate-100 mb-2 uppercase truncate" title={deck.nome}>{deck.nome}</h3>
                <div className="flex items-center text-emerald-400 mb-1 bg-emerald-950/30 w-max px-3 py-1 rounded-full border border-emerald-900/50">
                  <Layers size={14} className="mr-2" />
                  <span className="text-xs font-bold tracking-wide">CARTAS: {deck.cartas?.length || 0}/60</span>
                </div>
                <div className="text-xs text-slate-600 mt-4 font-medium">Criado em: {deck.dataCriacao}</div>
              </div>
              
              <div className="p-3 bg-slate-950 flex gap-3">
                <Link to={`/deck/${deck.id}`} className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 bg-blue-600/10 border border-blue-600/30 rounded-lg text-blue-400 hover:bg-blue-600 hover:text-white transition-all text-sm font-bold">
                  <Edit2 size={16} />
                  <span>Ver Cartas</span>
                </Link>
                <button 
                  onClick={() => setModalApagar({ aberto: true, id: deck.id, nome: deck.nome })} 
                  className="flex items-center justify-center py-2.5 px-4 bg-red-950/20 text-red-500 border border-red-900/30 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                  title="Apagar Deck"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= MODAIS ================= */}

      {/* MODAL DE CRIAR DECK */}
      {modalCriar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-100 flex items-center"><Layers className="mr-2 text-emerald-500"/> Criar Novo Deck</h3>
              <button onClick={() => setModalCriar(false)} className="text-slate-500 hover:text-slate-300 transition-colors"><X size={24}/></button>
            </div>
            
            <label className="block text-sm font-semibold text-slate-400 mb-2">Nome do Deck</label>
            <input
              autoFocus
              type="text"
              placeholder="Ex: Charizard ex, Deck de Fogo..."
              value={nomeNovoDeck}
              onChange={(e) => setNomeNovoDeck(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmarCriacaoDeck()} // Permite apertar Enter para criar
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none mb-8 placeholder-slate-600"
            />
            
            <div className="flex justify-end gap-3">
              <button onClick={() => setModalCriar(false)} className="px-5 py-2.5 rounded-lg font-medium text-slate-400 hover:bg-slate-800 transition-colors">Cancelar</button>
              <button onClick={confirmarCriacaoDeck} className="px-5 py-2.5 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">Salvar Deck</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE APAGAR DECK */}
      {modalApagar.aberto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center text-red-500">
                <AlertTriangle size={28} className="mr-3" />
                <h3 className="text-xl font-bold text-slate-100">Apagar Deck</h3>
              </div>
              <button onClick={() => setModalApagar({ aberto: false, id: null, nome: '' })} className="text-slate-500 hover:text-slate-300 transition-colors"><X size={24}/></button>
            </div>
            
            <p className="text-slate-400 mb-8 mt-2">
              Tem certeza que deseja apagar o deck <span className="text-slate-200 font-bold">"{modalApagar.nome}"</span>? Esta ação não pode ser desfeita e todas as cartas serão removidas.
            </p>
            
            <div className="flex justify-end gap-3">
              <button onClick={() => setModalApagar({ aberto: false, id: null, nome: '' })} className="px-5 py-2.5 rounded-lg font-medium text-slate-400 hover:bg-slate-800 transition-colors">Cancelar</button>
              <button onClick={confirmarDeletarDeck} className="px-5 py-2.5 rounded-lg font-bold bg-red-600 hover:bg-red-500 text-white transition-colors shadow-lg shadow-red-900/20">Sim, Apagar Deck</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}