import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, PlusCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast'; // Importação das notificações!
import { searchCards, cardImageUrl, getCardDetail, slimCard } from '../pokeApi';
import { db } from '../db';

export default function BuscaCartas() {
  const [busca, setBusca] = useState('');
  const [cartas, setCartas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  
  const decks = useLiveQuery(() => db.decks.toArray());
  const [deckSelecionado, setDeckSelecionado] = useState('');

  const pesquisarCartas = async (e) => {
    e.preventDefault();
    if (!busca.trim()) return;

    setCarregando(true);
    setCartas([]);

    try {
      const resultado = await searchCards(busca);
      setCartas(resultado.data || []);
      
      if(resultado.data?.length === 0) {
        toast('Nenhuma carta encontrada.', { icon: '🔍' });
      }
    } catch (erro) {
      console.error("Erro ao buscar as cartas:", erro);
      toast.error("Erro ao buscar as cartas. Verifique sua conexão.");
    } finally {
      setCarregando(false);
    }
  };

  const adicionarAoDeck = async (carta) => {
    if (!deckSelecionado) {
      toast.error("Selecione um deck no topo da página primeiro!");
      return;
    }

    try {
      const deckAtual = await db.decks.get(Number(deckSelecionado));
      
      if (deckAtual.cartas.length >= 60) {
        toast.error("Este deck já possui o limite de 60 cartas!");
        return;
      }

      // Adicionamos a notificação de carregamento enquanto a API puxa os detalhes
      const toastId = toast.loading(`Buscando detalhes de ${carta.name}...`);

      const detalhesCompletos = await getCardDetail(carta.id);
      const novaCarta = slimCard(detalhesCompletos); 
      
      const categoriaApi = String(detalhesCompletos.category || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      let categoriaDefinitiva = 'Desconhecido';

      if (categoriaApi.includes('pokemon')) {
        categoriaDefinitiva = 'Pokemon';
      } else if (categoriaApi.includes('trainer') || categoriaApi.includes('treinador')) {
        categoriaDefinitiva = 'Trainer';
      } else if (categoriaApi.includes('energy') || categoriaApi.includes('energia')) {
        categoriaDefinitiva = 'Energy';
      }
      
      novaCarta.category = categoriaDefinitiva;

      await db.decks.update(Number(deckSelecionado), {
        cartas: [...deckAtual.cartas, novaCarta]
      });

      // Remove o toast de carregamento e mostra o de sucesso
      toast.success(`${carta.name} adicionado ao deck!`, { id: toastId });

    } catch (erro) {
      console.error("Erro ao adicionar carta:", erro);
      toast.error("Não foi possível salvar a carta no deck.");
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* Painel Escuro e Elegante */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 mb-8">
        <h2 className="text-2xl font-bold text-slate-100 mb-4">Buscar Cartas Pokémon</h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={pesquisarCartas} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                type="text" 
                value={busca} 
                onChange={(e) => setBusca(e.target.value)} 
                placeholder="Ex: Pikachu, Charizard, Boss's Orders..."
                // Inputs com visual dark
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-200 placeholder-slate-500"
              />
            </div>
            <button 
              type="submit" 
              disabled={carregando}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md disabled:opacity-50"
            >
              {carregando ? 'Buscando...' : 'Pesquisar'}
            </button>
          </form>

          {/* Seletor de Deck Dark */}
          <div className="md:w-64 md:border-l md:border-slate-800 md:pl-4">
            <label className="block text-sm font-medium text-slate-400 mb-1">Salvar cartas no deck:</label>
            <select 
              value={deckSelecionado} 
              onChange={(e) => setDeckSelecionado(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Selecione um deck --</option>
              {decks?.map(deck => (
                <option key={deck.id} value={deck.id}>
                  {deck.nome} ({deck.cartas?.length || 0}/60)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {cartas.map((carta) => (
          // Efeito hover:-translate-y-1 faz a carta flutuar suavemente
          <div key={carta.id} className="bg-slate-900 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-slate-800 overflow-hidden flex flex-col group relative">
            
            <button 
              onClick={() => adicionarAoDeck(carta)}
              className="absolute top-2 right-2 bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-full shadow-lg transition-opacity z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100"
              title="Adicionar ao Deck"
            >
              <PlusCircle size={24} />
            </button>

            <div className="p-3 bg-slate-950 flex justify-center items-center h-64 relative">
              {carta.image ? (
                <img 
                  src={cardImageUrl(carta.image)} 
                  alt={carta.name} 
                  className="max-h-full rounded-md drop-shadow-md group-hover:scale-105 transition-transform duration-300" 
                />
              ) : (
                <div className="flex flex-col items-center text-slate-600">
                  <AlertCircle size={32} className="mb-2 opacity-50" />
                  <span className="text-sm font-medium">Sem Imagem</span>
                </div>
              )}
            </div>
            
            <div className="p-3 border-t border-slate-800 text-center flex-grow">
              <p className="font-bold text-slate-200 text-sm truncate" title={carta.name}>{carta.name}</p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{carta.id}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}