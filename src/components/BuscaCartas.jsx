import { useState, useCallback, useRef } from 'react';
import { Search, Loader2, Sparkles, SlidersHorizontal, ChevronDown, Heart, Zap, ChevronLeft, ChevronRight, X, Layers, BookOpen, BookmarkPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../db';
import { searchCards, getCardDetail, slimCard, cardImageUrl } from '../pokeApi';

// Recebe tanto deckFixoId (da tela VerDeck) quanto colecaoFixaId (da tela VerColecao)
export default function BuscaCartas({ deckFixoId, colecaoFixaId }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroSubtipo, setFiltroSubtipo] = useState('');
  const [filtroHP, setFiltroHP] = useState('');
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const loadingCardsRef = useRef(new Set());

  // === PAGINAÇÃO ===
  const [paginaAtual, setPaginaAtual] = useState(1);
  const CARTAS_POR_PAGINA = 21; // Mudei para 21 porque grids maiores precisam de mais cartas por página para fechar as linhas!

  // === MODAL UNIVERSAL (DECKS E COLEÇÕES) ===
  const [modalAberto, setModalAberto] = useState(false);
  const [cartaParaSalvar, setCartaParaSalvar] = useState(null);
  const [abaModal, setAbaModal] = useState('decks');
  const [listaDecks, setListaDecks] = useState([]);
  const [listaColecoes, setListaColecoes] = useState([]);

  const subtiposPokemon = [
    { valor: '', label: 'Qualquer Versão' },
    { valor: 'Basic', label: 'Básico (Comum)' },
    { valor: 'Stage 1', label: 'Estágio 1' },
    { valor: 'Stage 2', label: 'Estágio 2' },
    { valor: 'ex', label: 'Pokémon ex (S&V)' },
    { valor: 'EX', label: 'Pokémon EX (Antigos)' },
    { valor: 'V', label: 'Pokémon V' },
    { valor: 'VMAX', label: 'Pokémon VMAX' },
    { valor: 'VSTAR', label: 'Pokémon V-ASTRO' },
    { valor: 'GX', label: 'Pokémon GX' },
    { valor: 'TAG TEAM', label: 'ALIADOS (Tag Team)' },
    { valor: 'Radiant', label: 'Radiante' },
  ];

  const subtiposTreinador = [
    { valor: 'Supporter', label: 'Apoiador' },
    { valor: 'Item', label: 'Item' },
    { valor: 'Stadium', label: 'Estádio' },
    { valor: 'Pokémon Tool', label: 'Ferramenta' },
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim() && !filtroSubtipo && !filtroHP) {
      toast.error('Digite um nome ou escolha um filtro para buscar!');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const nomeLimpo = searchTerm.trim();
      const filtros = { nome: nomeLimpo, hp: filtroHP, subtipo: filtroSubtipo };
      
      const res = await searchCards(filtros);
      
      if (res.data) {
        const cartasOrdenadas = res.data.sort((a, b) => {
          if (a.image && !b.image) return -1;
          if (!a.image && b.image) return 1;
          return 0;
        });

        setResults(cartasOrdenadas);
        setPaginaAtual(1);
      } else {
        setResults([]);
      }
      
      if(res.data?.length === 0) toast('Nenhuma carta encontrada com esses filtros.', { icon: '🔍' });

    } catch (err) {
      console.error("❌ ERRO NA BUSCA:", err);
      toast.error('Erro na conexão com a base de dados!');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClick = async (cartaResumo) => {
    if (deckFixoId) return efetivarSalvamento(cartaResumo, deckFixoId, 'deck');
    if (colecaoFixaId) return efetivarSalvamento(cartaResumo, colecaoFixaId, 'colecao');

    const decksNoBanco = await db.decks.toArray();
    const colecoesNoBanco = await db.colecoes.toArray();
    
    setListaDecks(decksNoBanco);
    setListaColecoes(colecoesNoBanco);
    setCartaParaSalvar(cartaResumo);
    
    if (decksNoBanco.length === 0 && colecoesNoBanco.length > 0) setAbaModal('colecoes');
    else setAbaModal('decks');
    
    setModalAberto(true);
  };

  const efetivarSalvamento = async (cartaResumo, destinoId, tipo = 'deck') => {
    setModalAberto(false);
    if (loadingCardsRef.current.has(cartaResumo.id)) return;
    
    loadingCardsRef.current.add(cartaResumo.id);
    const toastId = toast.loading(`Salvando ${cartaResumo.name}...`);
    
    try {
      const detalhes = await getCardDetail(cartaResumo.id);
      const cartaCompleta = slimCard(detalhes);
      
      const categoryApi = String(detalhes.category || '').toLowerCase();
      cartaCompleta.category = categoryApi.includes('pokemon') ? 'Pokemon' : categoryApi.includes('trainer') || categoryApi.includes('treinador') ? 'Trainer' : 'Energy';

      if (tipo === 'deck') {
        if (destinoId === 'novo') {
          await db.decks.add({ nome: 'Meu Primeiro Deck', cartas: [cartaCompleta] });
          toast.success(`${cartaCompleta.name} salvo no novo deck!`, { id: toastId });
        } else {
          const deckAtual = await db.decks.get(destinoId);
          if (deckAtual.cartas.length >= 60) {
            toast.error(`O deck "${deckAtual.nome}" já tem 60 cartas!`, { id: toastId });
          } else {
            await db.decks.update(destinoId, { cartas: [...deckAtual.cartas, cartaCompleta] });
            toast.success(`${cartaCompleta.name} adicionado ao deck!`, { id: toastId });
          }
        }
      } 
      else if (tipo === 'colecao') {
        if (destinoId === 'novo') {
          await db.colecoes.add({ nome: 'Minha Primeira Coleção', cartas: [cartaCompleta] });
          toast.success(`${cartaCompleta.name} salvo na nova coleção!`, { id: toastId });
        } else {
          const colAtual = await db.colecoes.get(destinoId);
          await db.colecoes.update(destinoId, { cartas: [...colAtual.cartas, cartaCompleta] });
          toast.success(`${cartaCompleta.name} adicionado à coleção!`, { id: toastId });
        }
      }
    } catch (err) {
      toast.error(`Falha ao salvar a carta.`, { id: toastId });
    } finally {
      loadingCardsRef.current.delete(cartaResumo.id);
    }
  };

  const indexUltimaCarta = paginaAtual * CARTAS_POR_PAGINA;
  const indexPrimeiraCarta = indexUltimaCarta - CARTAS_POR_PAGINA;
  const cartasAtuais = results.slice(indexPrimeiraCarta, indexUltimaCarta);
  const totalPaginas = Math.ceil(results.length / CARTAS_POR_PAGINA);

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 relative">
      
      {!deckFixoId && !colecaoFixaId && (
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-full mb-4 border border-blue-500/20">
            <Search size={28} className="text-blue-500" />
          </div>
          <h1 className="text-4xl font-black text-slate-100 tracking-tight drop-shadow-md">
            Banco de Cartas
          </h1>
          <p className="text-slate-400 mt-2 font-medium">
            Busque por nome, tipo de mecânica ou pontos de vida.
          </p>
        </div>
      )}

      {/* 1. MUDANÇA: Barra de busca e filtros mais largar no PC */}
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 mb-10">
        <form onSubmit={handleSearch} className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-blue-900/10 hover:border-slate-700 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 max-w-4xl mx-auto">
          
          <div className="relative flex items-center">
            <div className="absolute left-6 text-slate-400 pointer-events-none">
              <Search size={22} />
            </div>
            
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ex: Ralts, Charizard, Professor..."
              className="w-full h-16 pl-14 pr-4 bg-transparent outline-none text-slate-100 text-lg placeholder-slate-500 font-medium"
              autoFocus={!deckFixoId && !colecaoFixaId}
            />
            
            <button 
              type="button"
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={`mr-2 flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-colors ${mostrarFiltros ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              title="Filtros Avançados"
            >
              <SlidersHorizontal size={18} className="mr-2" />
              <span className="hidden sm:inline">Filtros</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="h-16 px-8 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg transition-colors flex items-center disabled:opacity-50"
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : 'Buscar'}
            </button>
          </div>

          {mostrarFiltros && (
            <div className="bg-slate-950 p-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-300">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                  <Zap size={14} className="mr-1.5 text-yellow-400" /> Versão / Mecânica
                </label>
                <div className="relative">
                  <select 
                    value={filtroSubtipo}
                    onChange={(e) => setFiltroSubtipo(e.target.value)}
                    className="w-full h-12 px-4 bg-slate-900 border border-slate-700 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-blue-500 text-slate-200 font-medium cursor-pointer"
                  >
                    <optgroup label="Geral">
                      {subtiposPokemon.slice(0, 4).map(sub => (
                        <option key={sub.valor} value={sub.valor}>{sub.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Mecânicas Especiais (Pokémon)">
                      {subtiposPokemon.slice(4).map(sub => (
                        <option key={sub.valor} value={sub.valor}>{sub.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Cartas de Treinador">
                      {subtiposTreinador.map(sub => (
                        <option key={sub.valor} value={sub.valor}>{sub.label}</option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                  <Heart size={14} className="mr-1.5 text-red-400" /> Pontos de Vida (HP exato)
                </label>
                <input 
                  type="number"
                  placeholder="Ex: 70"
                  value={filtroHP}
                  onChange={(e) => setFiltroHP(e.target.value)}
                  step="10"
                  min="30"
                  max="340"
                  className="w-full h-12 px-4 bg-slate-900 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-200 font-medium placeholder-slate-600"
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button 
                  type="button" 
                  onClick={() => { setFiltroSubtipo(''); setFiltroHP(''); }}
                  className="text-sm font-bold text-slate-500 hover:text-red-400 transition-colors"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {results.length > 0 ? (
        // 2. MUDANÇA: Grid das Cartas se espalha muito mais!
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 mb-12">
          <div className="flex justify-between items-end mb-4 px-2 border-b border-slate-800 pb-2">
             <p className="text-slate-400 font-medium text-sm">
                Encontradas <span className="text-white font-bold">{results.length}</span> cartas
             </p>
          </div>

          {/* GRID NOVO: Até 7 colunas em telas gigantes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6">
            {cartasAtuais.map((card) => (
              <div key={card.id} className="group relative bg-slate-900 rounded-2xl border border-slate-800 p-3 flex flex-col justify-between hover:border-blue-500/50 hover:shadow-xl hover:-translate-y-1 hover:shadow-blue-900/20 transition-all duration-300 overflow-hidden">
                
                <div className="aspect-[63/88] w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center relative shadow-inner mb-3">
                  {card.image ? (
                    <img src={cardImageUrl(card.image)} alt={card.name} className="w-full h-full object-contain p-1 transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="text-slate-600 font-medium text-xs text-center px-2">Sem Imagem</div>
                  )}
                  
                  <div className="absolute inset-x-0 bottom-0 p-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-slate-950 via-slate-900/90 to-transparent">
                    <button onClick={() => handleSaveClick(card)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg active:scale-95 transition-all flex items-center justify-center">
                      <Sparkles size={16} className="mr-2" /> Salvar
                    </button>
                  </div>
                </div>

                <div className="text-center px-1">
                  <h3 className="font-bold text-slate-200 text-sm truncate" title={card.name}>{card.name}</h3>
                  <div className="flex items-center justify-center space-x-2 mt-1">
                    <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md uppercase tracking-wider">{card.id}</span>
                    {card.hp && (
                       <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md flex items-center">
                          <Heart size={10} className="mr-1" /> {card.hp}
                       </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-center space-x-4 mt-12 bg-slate-900 p-3 rounded-2xl border border-slate-800 w-max mx-auto shadow-lg">
              <button 
                onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} 
                disabled={paginaAtual === 1}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-blue-600 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-800 disabled:hover:text-slate-300 transition-all"
              >
                <ChevronLeft size={24} />
              </button>
              
              <span className="text-sm font-bold text-slate-400 min-w-[100px] text-center">
                Página <span className="text-white">{paginaAtual}</span> de {totalPaginas}
              </span>
              
              <button 
                onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} 
                disabled={paginaAtual === totalPaginas}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-blue-600 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-800 disabled:hover:text-slate-300 transition-all"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}

        </div>
      ) : (
        hasSearched && !loading && (
          <div className="text-center py-20 animate-in fade-in">
            <div className="bg-slate-900 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-800">
              <Search size={40} className="text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-300 mb-2">Nada encontrado</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Verifique a grafia do nome ou veja se os filtros aplicados combinam.
            </p>
          </div>
        )
      )}

      {/* === MODAL DUPLO DE SALVAMENTO === */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-white flex items-center">
                <BookmarkPlus className="mr-2 text-blue-500" /> Salvar Carta
              </h3>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-slate-400 text-sm mb-4">Onde você deseja salvar a carta <strong className="text-slate-200">{cartaParaSalvar?.name}</strong>?</p>
            
            {/* ABAS */}
            <div className="flex gap-2 mb-4 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button 
                onClick={() => setAbaModal('decks')} 
                className={`flex-1 py-2 rounded-lg font-bold transition-all text-sm flex items-center justify-center ${abaModal === 'decks' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
              >
                <Layers size={16} className="mr-2" /> Decks
              </button>
              <button 
                onClick={() => setAbaModal('colecoes')} 
                className={`flex-1 py-2 rounded-lg font-bold transition-all text-sm flex items-center justify-center ${abaModal === 'colecoes' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
              >
                <BookOpen size={16} className="mr-2" /> Coleções
              </button>
            </div>

            {/* LISTAGENS */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              
              {/* ABA: DECKS */}
              {abaModal === 'decks' && (
                <>
                  {listaDecks.map(deck => (
                    <button 
                      key={deck.id} 
                      onClick={() => efetivarSalvamento(cartaParaSalvar, deck.id, 'deck')} 
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-blue-500 transition-all text-left group"
                    >
                      <span className="font-bold text-slate-200 group-hover:text-blue-400">{deck.nome}</span>
                      <span className={`text-xs font-mono px-2 py-1 rounded-md ${deck.cartas.length >= 60 ? 'bg-red-500/20 text-red-400' : 'bg-slate-950 text-slate-400'}`}>
                        {deck.cartas.length}/60
                      </span>
                    </button>
                  ))}
                  <div className="my-4 border-t border-slate-800"></div>
                  <button onClick={() => efetivarSalvamento(cartaParaSalvar, 'novo', 'deck')} className="w-full flex items-center justify-center p-4 rounded-xl border border-dashed border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white font-bold transition-all">
                    + Criar um Deck Novo
                  </button>
                </>
              )}

              {/* ABA: COLEÇÕES */}
              {abaModal === 'colecoes' && (
                <>
                  {listaColecoes.map(col => (
                    <button 
                      key={col.id} 
                      onClick={() => efetivarSalvamento(cartaParaSalvar, col.id, 'colecao')} 
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-emerald-500 transition-all text-left group"
                    >
                      <span className="font-bold text-slate-200 group-hover:text-emerald-400">{col.nome}</span>
                      <span className="text-xs font-mono px-2 py-1 rounded-md bg-slate-950 text-emerald-500">
                        {col.cartas.length} cartas
                      </span>
                    </button>
                  ))}
                  <div className="my-4 border-t border-slate-800"></div>
                  <button onClick={() => efetivarSalvamento(cartaParaSalvar, 'novo', 'colecao')} className="w-full flex items-center justify-center p-4 rounded-xl border border-dashed border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white font-bold transition-all">
                    + Criar Coleção Nova
                  </button>
                </>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}