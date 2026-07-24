import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, AlertCircle, LayoutGrid, List, Plus, Minus, Trash2, PawPrint, Backpack, Zap, Star, Search, X, Edit2, PieChart, Activity, Download, Copy, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../db';
import { cardImageUrl, searchCards, getCardDetail, slimCard } from '../pokeApi';

// 1. IMPORTAMOS O NOSSO NOVO COMPONENTE SUPER PODEROSO
import BuscaCartas from './BuscaCartas'; 

export default function VerDeck() {
  const { id } = useParams();
  const deck = useLiveQuery(() => db.decks.get(Number(id)), [id]);
  
  const [modoVisao, setModoVisao] = useState('grade');
  
  // O único estado de busca que sobreviveu foi o botão de "Mostrar/Esconder"
  const [mostrarBusca, setMostrarBusca] = useState(false);

  const [modalRenomearAberto, setModalRenomearAberto] = useState(false);
  const [novoNomeDeck, setNovoNomeDeck] = useState('');

  // ESTADOS DE IMPORTAÇÃO E EXPORTAÇÃO
  const [modalImportarAberto, setModalImportarAberto] = useState(false);
  const [textoImportacao, setTextoImportacao] = useState('');
  const [processandoImportacao, setProcessandoImportacao] = useState(false);
  const [progressoImportacao, setProgressoImportacao] = useState({ atual: 0, total: 0 });


  // ================= LÓGICAS DO DECK (Estatísticas, Quantidades, Renomear) =================
  const stats = useMemo(() => {
    let pokemon = 0; let treinador = 0; let energia = 0;
    if (deck?.cartas) {
      deck.cartas.forEach(c => {
        if (c.category === 'Pokemon') pokemon++;
        else if (c.category === 'Trainer') treinador++;
        else if (c.category === 'Energy') energia++;
      });
    }
    return { pokemon, treinador, energia };
  }, [deck?.cartas]);

  const cartasAgrupadas = useMemo(() => {
    if (!deck?.cartas) return [];
    const mapa = {};
    deck.cartas.forEach(carta => {
      if (mapa[carta.id]) {
        mapa[carta.id].quantidade += 1;
        if (carta.destaque) mapa[carta.id].destaque = true;
      } else {
        mapa[carta.id] = { ...carta, quantidade: 1 };
      }
    });
    return Object.values(mapa);
  }, [deck?.cartas]);

  const alterarQuantidade = async (cartaId, acao) => {
    if (!deck) return;
    const novasCartas = [...deck.cartas];
    const cartaReferencia = novasCartas.find(c => c.id === cartaId);

    if (acao === 'adicionar') {
      if (novasCartas.length >= 60) { toast.error("Limite de 60 cartas!"); return; }
      if (cartaReferencia) novasCartas.push({ ...cartaReferencia });
    } else if (acao === 'remover') {
      const index = novasCartas.findIndex(c => c.id === cartaId);
      if (index !== -1) novasCartas.splice(index, 1);
    } else if (acao === 'deletar-todas') {
      const filtradas = novasCartas.filter(c => c.id !== cartaId);
      novasCartas.length = 0;
      novasCartas.push(...filtradas);
      toast.success(`${cartaReferencia?.name} removidas.`);
    }
    try { await db.decks.update(Number(id), { cartas: novasCartas }); } catch (e) { toast.error("Erro."); }
  };

  const alternarDestaque = async (cartaId) => {
    if (!deck) return;
    const idsDestaqueAtuais = new Set(deck.cartas.filter(c => c.destaque).map(c => c.id));
    const jaEhDestaque = idsDestaqueAtuais.has(cartaId);
    if (!jaEhDestaque && idsDestaqueAtuais.size >= 3) { toast.error("Máximo de 3 cartas na capa!"); return; }
    const novasCartas = deck.cartas.map(c => c.id === cartaId ? { ...c, destaque: !jaEhDestaque } : c);
    await db.decks.update(Number(id), { cartas: novasCartas });
    if (!jaEhDestaque) toast.success("Adicionada à capa!", {icon: '⭐'});
  };

  const abrirModalRenomear = () => { setNovoNomeDeck(deck.nome); setModalRenomearAberto(true); };
  const confirmarRenomearDeck = async () => {
    if (!novoNomeDeck.trim()) { toast.error("Nome vazio!"); return; }
    await db.decks.update(Number(id), { nome: novoNomeDeck });
    toast.success("Nome atualizado!"); setModalRenomearAberto(false);
  };

  // ================= LÓGICAS DE IMPORT / EXPORT =================
  const exportarDeck = () => {
    if (!deck || deck.cartas.length === 0) { toast.error("O deck está vazio!"); return; }
    
    let texto = `Deck: ${deck.nome}\n\n`;
    const addCategoria = (catNome, catStr) => {
      const cartas = cartasAgrupadas.filter(c => c.category === catStr);
      if (cartas.length > 0) {
        texto += `${catNome}:\n`;
        cartas.forEach(c => texto += `${c.quantidade} ${c.name}\n`);
        texto += `\n`;
      }
    };
    
    addCategoria('Pokémon', 'Pokemon');
    addCategoria('Treinador', 'Trainer');
    addCategoria('Energia', 'Energy');
    
    navigator.clipboard.writeText(texto.trim());
    toast.success("Lista copiada para a área de transferência!", { icon: '📋' });
  };

  const confirmarImportacao = async () => {
    if (!textoImportacao.trim()) return;
    
    const linhas = textoImportacao.split('\n').filter(l => l.trim().match(/^\d+\s+/));
    if(linhas.length === 0) {
       toast.error("Nenhuma carta válida encontrada no texto.");
       return;
    }

    setProcessandoImportacao(true);
    setProgressoImportacao({ atual: 0, total: linhas.length });
    
    const novasCartas = [...deck.cartas];
    let falhas = 0;
    let processadas = 0;

    for (let linha of linhas) {
      linha = linha.trim();
      const match = linha.match(/^(\d+)\s+(.+)$/); 
      
      if (match) {
        const qtd = parseInt(match[1]);
        const resto = match[2];
        let termoBusca = resto;
        const partes = resto.split(' ');
        
        if (partes.length >= 3) {
           const ultimos2 = partes.slice(-2);
           if (ultimos2[1].match(/^\d+/) || ultimos2[0].match(/^[A-Z0-9]{2,5}$/)) {
              termoBusca = partes.slice(0, -2).join(' ');
           }
        }

        try {
           const termoLimpo = termoBusca.replace(/[^a-zA-Z0-9 '\-]/g, '').trim();
           const res = await searchCards(termoLimpo);
           
           if (res.data && res.data.length > 0) {
              const cartaApi = res.data[0];
              const detalhes = await getCardDetail(cartaApi.id);
              const nova = slimCard(detalhes);

              const catApi = String(detalhes.category || '').toLowerCase();
              nova.category = catApi.includes('pokemon') ? 'Pokemon' : catApi.includes('trainer') || catApi.includes('treinador') ? 'Trainer' : 'Energy';

              for(let i=0; i<qtd && novasCartas.length < 60; i++){
                 novasCartas.push({...nova});
              }
           } else { falhas++; }
        } catch(e) { falhas++; }
      }
      processadas++;
      setProgressoImportacao({ atual: processadas, total: linhas.length });
    }

    try {
      await db.decks.update(Number(id), { cartas: novasCartas });
      if (falhas > 0) {
        toast(`Importação concluída. ${falhas} carta(s) não foram encontradas.`, { icon: '⚠️' });
      } else {
        toast.success("Deck importado com sucesso!");
      }
    } catch(err) {
       toast.error("Erro ao salvar o deck importado.");
    }

    setProcessandoImportacao(false);
    setModalImportarAberto(false);
    setTextoImportacao('');
  };


  if (deck === undefined) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;
  if (deck === null) return <div className="text-center p-12 text-slate-500 font-bold text-xl">Deck não encontrado!</div>;

  return (
    <div className="animate-in fade-in duration-300 pb-12">
      
      <div className="mb-6 flex justify-between items-center">
        <Link to="/decks" className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium transition-colors">
          <ArrowLeft size={20} className="mr-1" /> Voltar
        </Link>
        
        <div className="flex gap-3">
          <button onClick={() => setMostrarBusca(!mostrarBusca)} className={`flex items-center px-4 py-2 rounded-lg font-bold transition-all shadow-md ${mostrarBusca ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
            {mostrarBusca ? <X size={18} className="mr-2" /> : <Search size={18} className="mr-2" />}
            <span className="hidden sm:inline">{mostrarBusca ? 'Fechar Busca' : 'Adicionar Cartas'}</span>
          </button>

          <div className="flex bg-slate-900 rounded-lg border border-slate-800 p-1 shadow-sm">
            <button onClick={() => setModoVisao('grade')} title="Ver Grade" className={`p-2 rounded-md transition-colors ${modoVisao === 'grade' ? 'bg-slate-800 text-slate-200 shadow' : 'text-slate-500 hover:text-slate-300'}`}><LayoutGrid size={20} /></button>
            <button onClick={() => setModoVisao('lista')} title="Ver Lista" className={`p-2 rounded-md transition-colors ${modoVisao === 'lista' ? 'bg-slate-800 text-slate-200 shadow' : 'text-slate-500 hover:text-slate-300'}`}><List size={20} /></button>
            <button onClick={() => setModoVisao('estatisticas')} title="Estatísticas e Matemática" className={`p-2 rounded-md transition-colors ${modoVisao === 'estatisticas' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}><PieChart size={20} /></button>
          </div>
        </div>
      </div>

      {/* 2. AQUI ENTRA O NOSSO NOVO COMPONENTE DE BUSCA INJETADO! */}
      {mostrarBusca && (
        <div className="mb-8 bg-slate-900/50 p-6 rounded-3xl border border-blue-900/50 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          {/* Passamos o ID como número para que a busca salve diretamente neste deck */}
          <BuscaCartas deckFixoId={Number(id)} />
        </div>
      )}

      {/* CABEÇALHO DO DECK */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 mb-8 border-l-4 border-l-emerald-500 relative mt-4">
        <div className="hidden md:flex items-center text-xs font-bold text-amber-500/80 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20 mb-4 w-fit">
          <Star size={14} className="mr-1.5"/> Dica: Na visão de grade/lista, clique na estrela de até 3 cartas para serem a capa do deck.
        </div>
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-slate-100 uppercase">{deck.nome}</h2>
              <button onClick={abrirModalRenomear} className="text-slate-500 hover:text-emerald-400 bg-slate-800/50 hover:bg-slate-800 p-1.5 rounded-md transition-colors" title="Renomear Deck"><Edit2 size={20} /></button>
            </div>
            <p className="text-slate-400 mt-1 font-medium">Cartas no deck: <span className={deck.cartas.length === 60 ? 'text-emerald-400 font-bold' : 'text-slate-200'}>{deck.cartas.length}/60</span></p>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0 items-center">
            <div className="flex items-center gap-2 mr-2">
              <Link to={`/playtest/${deck.id}`} className="flex items-center bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-purple-900/30 transition-all active:scale-95">
                <Zap size={18} className="md:mr-2" /> <span className="hidden md:inline">Playtest</span>
              </Link>
              
              <button onClick={exportarDeck} title="Copiar Decklist" className="flex items-center bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg font-bold transition-all border border-slate-700 active:scale-95">
                <Copy size={18} />
              </button>
              
              <button onClick={() => setModalImportarAberto(true)} title="Importar Cartas por Texto" className="flex items-center bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg font-bold transition-all border border-slate-700 active:scale-95">
                <Download size={18} />
              </button>
            </div>

            <div className="hidden lg:flex items-center bg-blue-900/30 text-blue-400 border border-blue-900/50 px-3 py-1.5 rounded-lg text-sm font-bold"><PawPrint size={16} className="mr-1.5" /> {stats.pokemon}</div>
            <div className="hidden lg:flex items-center bg-orange-900/30 text-orange-400 border border-orange-900/50 px-3 py-1.5 rounded-lg text-sm font-bold"><Backpack size={16} className="mr-1.5" /> {stats.treinador}</div>
            <div className="hidden lg:flex items-center bg-yellow-900/30 text-yellow-400 border border-yellow-900/50 px-3 py-1.5 rounded-lg text-sm font-bold"><Zap size={16} className="mr-1.5" /> {stats.energia}</div>
          </div>
        </div>
      </div>

      {deck.cartas.length === 0 && modoVisao !== 'estatisticas' ? (
        <div className="text-center py-16 px-4 bg-slate-900 rounded-2xl shadow-lg border border-slate-800">
          <AlertCircle className="mx-auto h-16 w-16 text-slate-600 mb-4" />
          <h3 className="text-xl font-medium text-slate-300 mb-2">Deck Vazio</h3>
          <p className="text-slate-500">Clique em "Adicionar Cartas" acima para buscar na base de dados ☝️</p>
        </div>
      ) : (
        <>
          {/* VISÃO GRADE */}
          {modoVisao === 'grade' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {cartasAgrupadas.map((carta) => (
                <div key={carta.id} className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden flex flex-col group relative">
                  <button onClick={() => alternarDestaque(carta.id)} className={`absolute top-2 right-2 p-2 rounded-full shadow-lg z-10 transition-all ${carta.destaque ? 'bg-amber-500 text-white opacity-100' : 'bg-slate-800/80 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-700 hover:text-amber-400'}`}>
                    <Star size={20} fill={carta.destaque ? "currentColor" : "none"} />
                  </button>
                  <div className="absolute z-10 m-2 px-3 py-1 bg-slate-950/80 text-slate-200 rounded-full font-bold text-sm shadow-md backdrop-blur-sm border border-slate-800">{carta.quantidade}x</div>
                  <div className="p-3 bg-slate-950 flex justify-center items-center h-56 relative">
                    {carta.image ? <img src={cardImageUrl(carta.image)} alt={carta.name} className={`max-h-full rounded-md drop-shadow-md ${carta.destaque ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-950' : ''}`} /> : <AlertCircle className="opacity-50" />}
                  </div>
                  <div className="p-2 border-t border-slate-800 flex items-center justify-between bg-slate-900">
                    <button onClick={() => alterarQuantidade(carta.id, 'remover')} className="p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white rounded-md"><Minus size={18} /></button>
                    <div className="flex-1 text-center px-1"><p className="font-bold text-slate-200 text-xs truncate">{carta.name}</p></div>
                    <button onClick={() => alterarQuantidade(carta.id, 'adicionar')} disabled={deck.cartas.length >= 60 || carta.quantidade >= 4 && carta.category !== 'Energy'} className="p-1.5 text-blue-400 hover:bg-slate-800 hover:text-blue-300 rounded-md"><Plus size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VISÃO LISTA */}
          {modoVisao === 'lista' && (
            <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-sm uppercase">
                    <th className="p-4 font-semibold w-24">Qtd</th>
                    <th className="p-4 font-semibold">Nome</th>
                    <th className="p-4 font-semibold hidden md:table-cell text-slate-500">Numeração</th>
                    <th className="p-4 font-semibold text-center w-24">Capa</th>
                    <th className="p-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {cartasAgrupadas.map((carta) => (
                    <tr key={carta.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4"><span className="font-bold text-slate-200 text-lg">{carta.quantidade}x</span></td>
                      <td className="p-4 font-medium text-slate-300">
                        {carta.name}
                        {carta.destaque && <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wider inline-block sm:hidden">Capa</span>}
                      </td>
                      <td className="p-4 hidden md:table-cell text-slate-500 text-xs font-mono uppercase tracking-wider">{carta.id}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => alternarDestaque(carta.id)} className={`p-2 rounded-full transition-colors ${carta.destaque ? 'text-amber-500 bg-amber-500/10' : 'text-slate-600 hover:text-amber-500 hover:bg-slate-800'}`}>
                          <Star size={18} fill={carta.destaque ? "currentColor" : "none"} />
                        </button>
                      </td>
                      <td className="p-4 flex justify-end gap-2">
                        <button onClick={() => alterarQuantidade(carta.id, 'remover')} className="p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded-md"><Minus size={16} /></button>
                        <button onClick={() => alterarQuantidade(carta.id, 'adicionar')} disabled={deck.cartas.length >= 60 || carta.quantidade >= 4 && carta.category !== 'Energy'} className="p-2 text-slate-400 hover:bg-slate-800 hover:text-blue-400 rounded-md"><Plus size={16} /></button>
                        <button onClick={() => alterarQuantidade(carta.id, 'deletar-todas')} className="p-2 text-slate-500 hover:bg-red-950/50 hover:text-red-400 rounded-md ml-2" title="Remover todas"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* VISÃO DE ESTATÍSTICAS AVANÇADAS */}
          {modoVisao === 'estatisticas' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              {(() => {
                const total = deck.cartas.length;
                const pokemon = stats.pokemon;
                
                let chanceZica = 0;
                if (total >= 7) {
                  if (pokemon === 0) chanceZica = 100;
                  else if (total - pokemon < 7) chanceZica = 0;
                  else {
                    let prob = 1; let restantes = total; let naoPokemon = total - pokemon;
                    for(let i=0; i<7; i++) { prob *= (naoPokemon / restantes); naoPokemon--; restantes--; }
                    chanceZica = (prob * 100).toFixed(1);
                  }
                }

                let corAlerta = chanceZica > 35 ? 'text-red-500 border-red-500/30 bg-red-500/10' : chanceZica > 15 ? 'text-amber-500 border-amber-500/30 bg-amber-500/10' : 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
                let textoAlerta = chanceZica > 35 ? 'Risco Crítico! Adicione mais Pokémon.' : chanceZica > 15 ? 'Risco Moderado. Cuidado ao comprar.' : 'Excelente! Baixo risco de Mulligan.';

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-6 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-200 flex items-center mb-1"><Activity className="mr-2 text-purple-400" size={20}/> Chance de Mulligan</h3>
                        <p className="text-xs text-slate-500 font-medium mb-6">Probabilidade de não vir nenhum Pokémon na mão inicial de 7 cartas (Zicar).</p>
                        <div className="flex items-end justify-center mb-6"><span className={`text-6xl font-black ${chanceZica > 35 ? 'text-red-500' : chanceZica > 15 ? 'text-amber-500' : 'text-emerald-500'}`}>{total < 7 ? '--' : chanceZica}%</span></div>
                      </div>
                      <div className={`p-3 rounded-xl border text-center text-sm font-bold ${corAlerta}`}>{total < 7 ? 'Adicione pelo menos 7 cartas' : textoAlerta}</div>
                    </div>

                    <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-6 lg:col-span-2">
                      <h3 className="text-lg font-bold text-slate-200 flex items-center mb-6"><PieChart className="mr-2 text-blue-400" size={20}/> Composição do Deck</h3>
                      <div className="w-full bg-slate-950 rounded-full h-8 flex overflow-hidden border border-slate-800 mb-6 shadow-inner">
                        <div style={{ width: `${total ? (stats.pokemon/total)*100 : 0}%` }} className="bg-blue-600 h-full transition-all duration-1000"></div>
                        <div style={{ width: `${total ? (stats.treinador/total)*100 : 0}%` }} className="bg-orange-600 h-full transition-all duration-1000 border-l border-slate-900/50"></div>
                        <div style={{ width: `${total ? (stats.energia/total)*100 : 0}%` }} className="bg-yellow-500 h-full transition-all duration-1000 border-l border-slate-900/50"></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/50 flex flex-col items-center justify-center">
                          <PawPrint className="text-blue-500 mb-2" size={24}/>
                          <span className="text-2xl font-bold text-slate-200">{stats.pokemon}</span>
                          <span className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Pokémon</span>
                          <span className="text-[10px] text-blue-400 mt-1">{total ? ((stats.pokemon/total)*100).toFixed(0) : 0}%</span>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/50 flex flex-col items-center justify-center">
                          <Backpack className="text-orange-500 mb-2" size={24}/>
                          <span className="text-2xl font-bold text-slate-200">{stats.treinador}</span>
                          <span className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Treinador</span>
                          <span className="text-[10px] text-orange-400 mt-1">{total ? ((stats.treinador/total)*100).toFixed(0) : 0}%</span>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/50 flex flex-col items-center justify-center">
                          <Zap className="text-yellow-500 mb-2" size={24}/>
                          <span className="text-2xl font-bold text-slate-200">{stats.energia}</span>
                          <span className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Energia</span>
                          <span className="text-[10px] text-yellow-500 mt-1">{total ? ((stats.energia/total)*100).toFixed(0) : 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* ================= MODAIS ================= */}

      {/* MODAL DE RENOMEAR */}
      {modalRenomearAberto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-100 flex items-center"><Edit2 className="mr-2 text-emerald-500"/> Renomear Deck</h3>
              <button onClick={() => setModalRenomearAberto(false)} className="text-slate-500 hover:text-slate-300 transition-colors"><X size={24}/></button>
            </div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Novo Nome</label>
            <input autoFocus type="text" value={novoNomeDeck} onChange={(e) => setNovoNomeDeck(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmarRenomearDeck()} className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none mb-8" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setModalRenomearAberto(false)} className="px-5 py-2.5 rounded-lg font-medium text-slate-400 hover:bg-slate-800 transition-colors">Cancelar</button>
              <button onClick={confirmarRenomearDeck} className="px-5 py-2.5 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE IMPORTAR DECK */}
      {modalImportarAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl p-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-xl font-bold text-slate-100 flex items-center"><Download className="mr-2 text-blue-500"/> Importar Decklist</h3>
              {!processandoImportacao && (
                <button onClick={() => setModalImportarAberto(false)} className="text-slate-500 hover:text-slate-300 transition-colors"><X size={24}/></button>
              )}
            </div>
            
            <p className="text-slate-400 text-sm mb-4 shrink-0">
              Cole sua decklist. O sistema filtrará os nomes e tentará baixar as cartas automaticamente (ex: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400">4 Charizard ex OBF 125</code>).
            </p>
            
            <textarea
              disabled={processandoImportacao}
              value={textoImportacao}
              onChange={(e) => setTextoImportacao(e.target.value)}
              placeholder="Pokémon: 3&#10;4 Charizard ex OBF 125&#10;...&#10;&#10;Treinador: 1&#10;4 Professor's Research..."
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none mb-6 placeholder-slate-700 flex-1 min-h-[200px] resize-none custom-scrollbar"
            />
            
            {processandoImportacao ? (
              <div className="shrink-0 bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                <p className="text-slate-300 font-bold mb-1">Processando Importação...</p>
                <p className="text-emerald-400 font-medium text-sm">Buscando cartas: {progressoImportacao.atual} de {progressoImportacao.total}</p>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-300" 
                    style={{ width: `${(progressoImportacao.atual / Math.max(progressoImportacao.total, 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="flex justify-end gap-3 shrink-0">
                <button onClick={() => setModalImportarAberto(false)} className="px-5 py-2.5 rounded-lg font-medium text-slate-400 hover:bg-slate-800 transition-colors">Cancelar</button>
                <button onClick={confirmarImportacao} className="px-5 py-2.5 rounded-lg font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg shadow-blue-900/20 flex items-center">
                  <CheckCircle2 size={18} className="mr-2" /> Iniciar Importação
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Esconder barra de rolagem na visualização em lista horizontal */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}} />
    </div>
  );
}