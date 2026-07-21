import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, PlusCircle, AlertCircle, Layers, Swords, Sparkles, ChevronDown, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { searchCards, cardImageUrl, getCardDetail, slimCard } from '../pokeApi';
import { db } from '../db';

export default function BuscaCartas() {
  const [busca, setBusca] = useState('');
  const [cartas, setCartas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [buscaRealizada, setBuscaRealizada] = useState(false);
  
  const decks = useLiveQuery(() => db.decks.toArray());
  const [deckSelecionado, setDeckSelecionado] = useState('');
  
  // NOVO ESTADO: Controla se o nosso menu customizado está aberto ou fechado
  const [dropdownAberto, setDropdownAberto] = useState(false);
  // NOVO: Estados do modal de criar deck
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [nomeNovoDeck, setNomeNovoDeck] = useState('');

  const pesquisarCartas = async (e) => {
    e.preventDefault();
    if (!busca.trim()) return;

    setCarregando(true);
    setCartas([]);
    setBuscaRealizada(true);

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

  // OPÇÃO 2: Criar deck direto pelo Dropdown Customizado
  const lidarComMudancaDeDeck = async (valorEscolhido) => {
    setDropdownAberto(false);
    
    if (valorEscolhido === 'CRIAR_NOVO') {
      // Abre o nosso modal bonito ao invés do prompt feio!
      setNomeNovoDeck('');
      setModalCriarAberto(true);
    } else {
      setDeckSelecionado(valorEscolhido);
    }
  };

  // Função disparada quando clica em "Salvar" dentro do modal
  const confirmarCriacaoDeck = async () => {
    if (!nomeNovoDeck.trim()) {
      toast.error("O nome do deck não pode estar vazio!");
      return;
    }
    try {
      const novoId = await db.decks.add({
        nome: nomeNovoDeck,
        dataCriacao: new Date().toLocaleDateString('pt-BR'),
        cartas: [] 
      });
      setDeckSelecionado(novoId.toString());
      toast.success(`Deck "${nomeNovoDeck}" pronto para uso!`);
      setModalCriarAberto(false); // Fecha o modal
    } catch (erro) {
      toast.error("Erro ao criar o deck localmente.");
    }
  };

  // OPÇÃO 3: Criação Automática (Se o usuário for apressado)
  const adicionarAoDeck = async (carta) => {
    let idDeckAlvo = deckSelecionado;

    // Se ele não escolheu nada e clicou em adicionar, nós criamos pra ele!
    if (!idDeckAlvo) {
      try {
        const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const nomeRapido = `Deck Rápido (${dataHoje})`;
        
        idDeckAlvo = await db.decks.add({
          nome: nomeRapido,
          dataCriacao: new Date().toLocaleDateString('pt-BR'),
          cartas: [] 
        });
        
        // Atualiza a caixinha na tela para o novo deck criado
        setDeckSelecionado(idDeckAlvo.toString());
        toast(`Deck Rápido criado automaticamente!`, { icon: '⚡' });
      } catch (erro) {
        toast.error("Erro ao criar deck rápido.");
        return;
      }
    }

    // Daqui pra baixo é o salvamento normal da carta...
    try {
      const deckAtual = await db.decks.get(Number(idDeckAlvo));
      
      if (deckAtual.cartas.length >= 60) {
        toast.error("Este deck já possui o limite de 60 cartas!");
        return;
      }

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

      await db.decks.update(Number(idDeckAlvo), {
        cartas: [...deckAtual.cartas, novaCarta]
      });

      toast.success(`${carta.name} adicionado ao deck!`, { id: toastId });

    } catch (erro) {
      console.error("Erro ao adicionar carta:", erro);
      toast.error("Não foi possível salvar a carta no deck.");
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      
      <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 mb-8 relative z-20">
        <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center">
          <Sparkles className="mr-2 text-blue-400" size={24}/>
          Central de Cartas
        </h2>
        
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <form onSubmit={pesquisarCartas} className="flex-1 flex gap-3 w-full">
            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-500" />
              </div>
              <input 
                type="text" 
                value={busca} 
                onChange={(e) => setBusca(e.target.value)} 
                placeholder="Ex: Pikachu, Charizard, Boss's Orders..."
                className="w-full h-12 pl-12 pr-4 bg-slate-950 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-200 placeholder-slate-500 text-base shadow-inner"
              />
            </div>
            <button 
              type="submit" 
              disabled={carregando}
              className="h-12 bg-blue-600 hover:bg-blue-500 text-white px-8 rounded-lg font-medium transition-colors shadow-md disabled:opacity-50 flex-shrink-0"
            >
              {carregando ? 'Buscando...' : 'Pesquisar'}
            </button>
          </form>

          <div className="hidden md:block h-12 border-l border-slate-700 mx-2"></div>

          {/* NOSSO SELECT PREMIUM CUSTOMIZADO */}
          <div className="relative w-full md:w-64 flex-shrink-0 z-50">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Deck de Destino</label>
            
            {/* O "Botão" que simula o Select */}
            <div 
              onClick={() => setDropdownAberto(!dropdownAberto)}
              className="w-full h-12 bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 flex items-center justify-between cursor-pointer hover:border-slate-500 hover:bg-slate-900 transition-all shadow-inner"
            >
              <span className="truncate font-medium">
                {deckSelecionado 
                  ? decks?.find(d => d.id.toString() === deckSelecionado)?.nome 
                  : "-- Selecione um deck --"}
              </span>
              <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${dropdownAberto ? 'rotate-180' : ''}`} />
            </div>

            {/* O Menu que "cai" para baixo (Dropdown) */}
            {dropdownAberto && (
              <>
                {/* Tela invisível que cobre tudo. Se clicar fora, fecha o menu. */}
                <div className="fixed inset-0 z-40" onClick={() => setDropdownAberto(false)}></div>
                
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  
                  <div 
                    onClick={() => lidarComMudancaDeDeck('')}
                    className="px-4 py-3 hover:bg-slate-800 text-slate-400 cursor-pointer transition-colors text-sm"
                  >
                    -- Selecione um deck --
                  </div>

                  <div 
                    onClick={() => lidarComMudancaDeDeck('CRIAR_NOVO')}
                    className="px-4 py-3 hover:bg-slate-800 text-emerald-400 font-bold cursor-pointer transition-colors text-sm flex items-center group"
                  >
                    <Sparkles size={16} className="mr-2 opacity-70 group-hover:opacity-100" />
                    Criar Novo Deck...
                  </div>

                  {decks && decks.length > 0 && (
                    <div className="h-px bg-slate-800 my-1 mx-4"></div>
                  )}

                  <div className="max-h-48 overflow-y-auto custom-scrollbar">
                    {decks?.map(deck => (
                      <div 
                        key={deck.id}
                        onClick={() => lidarComMudancaDeDeck(deck.id.toString())}
                        className={`px-4 py-3 hover:bg-slate-800 cursor-pointer transition-colors text-sm flex justify-between items-center group
                          ${deckSelecionado === deck.id.toString() ? 'bg-slate-800/60 text-blue-400 border-l-2 border-blue-400' : 'text-slate-200 border-l-2 border-transparent'}`}
                      >
                        <span className="truncate font-medium">{deck.nome}</span>
                        <span className={`text-xs ml-2 shrink-0 ${deckSelecionado === deck.id.toString() ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
                          ({deck.cartas?.length || 0}/60)
                        </span>
                      </div>
                    ))}
                  </div>

                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* NOVO ESTADO VAZIO DA BUSCA (Bem mais limpo!) */}
      {!buscaRealizada && !carregando && (
        <div className="flex flex-col items-center justify-center py-24 opacity-60">
          <Search size={64} className="text-slate-700 mb-4" />
          <h3 className="text-xl font-bold text-slate-500 mb-2">Pronto para a caçada?</h3>
          <p className="text-slate-600">Digite o nome de uma carta ali em cima para buscar no banco de dados.</p>
        </div>
      )}

      {carregando && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-400 font-medium">Vasculhando o banco de dados...</p>
        </div>
      )}

      {!carregando && cartas.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {cartas.map((carta) => (
            <div key={carta.id} className="bg-slate-900 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-slate-800 overflow-hidden flex flex-col group relative">
              <button 
                onClick={() => adicionarAoDeck(carta)}
                className="absolute top-2 right-2 bg-emerald-500 hover:bg-emerald-400 text-white p-2.5 rounded-full shadow-lg transition-all z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 active:scale-95"
                title="Adicionar ao Deck"
              >
                <PlusCircle size={22} />
              </button>

              <div className="p-3 bg-slate-950/50 flex justify-center items-center h-64 relative">
                {carta.image ? (
                  <img 
                    src={cardImageUrl(carta.image)} 
                    alt={carta.name} 
                    className="max-h-full rounded-md drop-shadow-lg group-hover:scale-105 transition-transform duration-300" 
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-600">
                    <AlertCircle size={32} className="mb-2 opacity-30" />
                    <span className="text-sm font-medium">Sem Imagem</span>
                  </div>
                )}
              </div>
              
              <div className="p-3 border-t border-slate-800 text-center flex-grow bg-slate-900">
                <p className="font-bold text-slate-200 text-sm truncate" title={carta.name}>{carta.name}</p>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-medium">{carta.id}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* MODAL DE CRIAR DECK DA BUSCA */}
      {modalCriarAberto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-100 flex items-center"><Layers className="mr-2 text-emerald-500"/> Criar Novo Deck</h3>
              <button onClick={() => setModalCriarAberto(false)} className="text-slate-500 hover:text-slate-300 transition-colors"><X size={24}/></button>
            </div>
            
            <label className="block text-sm font-semibold text-slate-400 mb-2">Nome do Deck</label>
            <input
              autoFocus
              type="text"
              placeholder="Ex: Charizard ex, Deck de Fogo..."
              value={nomeNovoDeck}
              onChange={(e) => setNomeNovoDeck(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmarCriacaoDeck()}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none mb-8 placeholder-slate-600"
            />
            
            <div className="flex justify-end gap-3">
              <button onClick={() => setModalCriarAberto(false)} className="px-5 py-2.5 rounded-lg font-medium text-slate-400 hover:bg-slate-800 transition-colors">Cancelar</button>
              <button onClick={confirmarCriacaoDeck} className="px-5 py-2.5 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">Salvar Deck</button>
            </div>
          </div>
        </div>
      )}

      {/* Estilo para a barra de rolagem da lista de decks */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}} />
    </div>
  );
}