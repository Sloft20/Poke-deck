import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, AlertCircle, LayoutGrid, List, Plus, Minus, Trash2, PawPrint, Backpack, Zap, Star, Search, X, PlusCircle, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../db';
// IMPORTAMOS AS FUNÇÕES DE BUSCA DA API AQUI TAMBÉM:
import { cardImageUrl, searchCards, getCardDetail, slimCard } from '../pokeApi';

export default function VerDeck() {
  const { id } = useParams();
  const deck = useLiveQuery(() => db.decks.get(Number(id)), [id]);
  
  const [modoVisao, setModoVisao] = useState('grade');
  
  // ESTADOS DA BUSCA RÁPIDA
  const [mostrarBusca, setMostrarBusca] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [buscando, setBuscando] = useState(false);

  // NOVO: Estados do modal de Renomear Deck
  const [modalRenomearAberto, setModalRenomearAberto] = useState(false);
  const [novoNomeDeck, setNovoNomeDeck] = useState('');

  // Funções para Renomear o Deck
  const abrirModalRenomear = () => {
    setNovoNomeDeck(deck.nome); // Já preenche o input com o nome atual
    setModalRenomearAberto(true);
  };

  const confirmarRenomearDeck = async () => {
    if (!novoNomeDeck.trim()) {
      toast.error("O nome do deck não pode ficar vazio!");
      return;
    }
    try {
      await db.decks.update(Number(id), { nome: novoNomeDeck });
      toast.success("Nome atualizado com sucesso!");
      setModalRenomearAberto(false);
    } catch (erro) {
      toast.error("Erro ao renomear o deck.");
    }
  };

  // Lógica da Busca Rápida
  const realizarBuscaRapida = async (e) => {
    e.preventDefault();
    if (!termoBusca.trim()) return;

    setBuscando(true);
    try {
      const resultado = await searchCards(termoBusca);
      setResultadosBusca(resultado.data || []);
      if(resultado.data?.length === 0) toast('Nenhuma carta encontrada.', { icon: '🔍' });
    } catch (erro) {
      toast.error("Erro na busca.");
    } finally {
      setBuscando(false);
    }
  };

  // Lógica de adicionar carta nova direto na tela do Deck
  const adicionarNovaCarta = async (carta) => {
    if (!deck) return;
    if (deck.cartas.length >= 60) {
      toast.error("Este deck já possui o limite de 60 cartas!");
      return;
    }

    const toastId = toast.loading(`Adicionando ${carta.name}...`);
    try {
      const detalhesCompletos = await getCardDetail(carta.id);
      const novaCarta = slimCard(detalhesCompletos); 
      
      const categoriaApi = String(detalhesCompletos.category || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      let categoriaDefinitiva = 'Desconhecido';
      if (categoriaApi.includes('pokemon')) categoriaDefinitiva = 'Pokemon';
      else if (categoriaApi.includes('trainer') || categoriaApi.includes('treinador')) categoriaDefinitiva = 'Trainer';
      else if (categoriaApi.includes('energy') || categoriaApi.includes('energia')) categoriaDefinitiva = 'Energy';
      
      novaCarta.category = categoriaDefinitiva;

      await db.decks.update(Number(id), {
        cartas: [...deck.cartas, novaCarta]
      });

      toast.success(`${carta.name} adicionado ao deck!`, { id: toastId });
    } catch (erro) {
      toast.error("Erro ao adicionar carta.", { id: toastId });
    }
  };

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
      if (novasCartas.length >= 60) {
        toast.error("O deck já tem 60 cartas!");
        return;
      }
      if (cartaReferencia) novasCartas.push({ ...cartaReferencia });
    } 
    else if (acao === 'remover') {
      const index = novasCartas.findIndex(c => c.id === cartaId);
      if (index !== -1) novasCartas.splice(index, 1);
    }
    else if (acao === 'deletar-todas') {
      const cartasFiltradas = novasCartas.filter(c => c.id !== cartaId);
      novasCartas.length = 0;
      novasCartas.push(...cartasFiltradas);
      toast.success(`${cartaReferencia?.name} removidas.`);
    }

    try {
      await db.decks.update(Number(id), { cartas: novasCartas });
    } catch (erro) {
      toast.error("Erro ao atualizar deck.");
    }
  };

  const alternarDestaque = async (cartaId) => {
    if (!deck) return;
    const idsDestaqueAtuais = new Set(deck.cartas.filter(c => c.destaque).map(c => c.id));
    const jaEhDestaque = idsDestaqueAtuais.has(cartaId);
    
    if (!jaEhDestaque && idsDestaqueAtuais.size >= 3) {
      toast.error("Você só pode escolher até 3 cartas para a capa do deck!");
      return;
    }

    const novasCartas = deck.cartas.map(c => c.id === cartaId ? { ...c, destaque: !jaEhDestaque } : c);
    await db.decks.update(Number(id), { cartas: novasCartas });
    if (!jaEhDestaque) toast.success("Adicionada à capa!", {icon: '⭐'});
  };

  if (deck === undefined) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;
  if (deck === null) return <div className="text-center p-12 text-slate-500 font-bold text-xl">Deck não encontrado!</div>;

  return (
    <div className="animate-in fade-in duration-300 pb-12">
      
      {/* BARRA SUPERIOR E CONTROLES */}
      <div className="mb-6 flex justify-between items-center">
        <Link to="/decks" className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium transition-colors">
          <ArrowLeft size={20} className="mr-1" />
          Voltar
        </Link>
        
        <div className="flex gap-3">
          {/* BOTÃO DA BUSCA RÁPIDA */}
          <button 
            onClick={() => setMostrarBusca(!mostrarBusca)} 
            className={`flex items-center px-4 py-2 rounded-lg font-bold transition-all shadow-md ${mostrarBusca ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
          >
            {mostrarBusca ? <X size={18} className="mr-2" /> : <Search size={18} className="mr-2" />}
            <span className="hidden sm:inline">{mostrarBusca ? 'Fechar Busca' : 'Adicionar Cartas'}</span>
          </button>

          <div className="flex bg-slate-900 rounded-lg border border-slate-800 p-1 shadow-sm">
            <button onClick={() => setModoVisao('grade')} className={`p-2 rounded-md transition-colors ${modoVisao === 'grade' ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}>
              <LayoutGrid size={20} />
            </button>
            <button onClick={() => setModoVisao('lista')} className={`p-2 rounded-md transition-colors ${modoVisao === 'lista' ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}>
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* PAINEL DE BUSCA RÁPIDA (EXPANSÍVEL) */}
      {mostrarBusca && (
        <div className="mb-8 bg-slate-900 p-5 rounded-2xl shadow-xl border border-blue-900/50 animate-in slide-in-from-top-4 duration-300">
          <form onSubmit={realizarBuscaRapida} className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={termoBusca} 
              onChange={(e) => setTermoBusca(e.target.value)} 
              placeholder="Digite o nome da carta para adicionar..."
              className="flex-1 h-12 px-4 bg-slate-950 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-200"
              autoFocus
            />
            <button type="submit" disabled={buscando} className="h-12 bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-lg font-bold disabled:opacity-50">
              {buscando ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {/* LISTA HORIZONTAL DE RESULTADOS */}
          {resultadosBusca.length > 0 && (
            <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar">
              {resultadosBusca.map((carta) => (
                <div key={carta.id} className="min-w-[140px] max-w-[140px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col group relative shrink-0">
                  <button 
                    onClick={() => adicionarNovaCarta(carta)}
                    className="absolute top-2 right-2 bg-emerald-500 hover:bg-emerald-400 text-white p-2 rounded-full shadow-lg z-10 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                  >
                    <PlusCircle size={20} />
                  </button>
                  <div className="h-32 bg-slate-900 flex justify-center items-center p-2 relative">
                     {carta.image ? <img src={cardImageUrl(carta.image)} alt={carta.name} className="max-h-full rounded shadow-sm group-hover:scale-105 transition-transform" /> : <AlertCircle className="text-slate-600" />}
                  </div>
                  <div className="p-2 border-t border-slate-800 text-center flex-grow">
                    <p className="font-bold text-slate-300 text-xs truncate" title={carta.name}>{carta.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase mt-1">{carta.id}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CABEÇALHO DO DECK */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 mb-8 border-l-4 border-l-emerald-500 relative">
        <div className="hidden md:flex items-center text-xs font-bold text-amber-500/80 bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20 mb-4 w-fit">
          <Star size={14} className="mr-1.5"/> Dica: Clique na estrela de até 3 cartas abaixo para defini-las como capa do deck.
        </div>
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            {/* NOVO: Div flex para colocar o lápis ao lado do nome */}
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-slate-100 uppercase">{deck.nome}</h2>
              <button 
                onClick={abrirModalRenomear}
                className="text-slate-500 hover:text-emerald-400 bg-slate-800/50 hover:bg-slate-800 p-1.5 rounded-md transition-colors"
                title="Renomear Deck"
              >
                <Edit2 size={20} />
              </button>
            </div>
            
            <p className="text-slate-400 mt-1 font-medium">Cartas no deck: <span className={deck.cartas.length === 60 ? 'text-emerald-400 font-bold' : 'text-slate-200'}>{deck.cartas.length}/60</span></p>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0 items-center">
            
            {/* BOTÃO DE PLAYTEST */}
            <Link to={`/playtest/${deck.id}`} className="flex items-center bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-purple-900/30 transition-all active:scale-95 md:mr-2">
              <Zap size={18} className="mr-2" /> Playtest
            </Link>

            <div className="flex items-center bg-blue-900/30 text-blue-400 border border-blue-900/50 px-3 py-1.5 rounded-lg text-sm font-bold"><PawPrint size={16} className="mr-1.5" /> Pokémon: {stats.pokemon}</div>
            <div className="flex items-center bg-orange-900/30 text-orange-400 border border-orange-900/50 px-3 py-1.5 rounded-lg text-sm font-bold"><Backpack size={16} className="mr-1.5" /> Treinador: {stats.treinador}</div>
            <div className="flex items-center bg-yellow-900/30 text-yellow-400 border border-yellow-900/50 px-3 py-1.5 rounded-lg text-sm font-bold"><Zap size={16} className="mr-1.5" /> Energia: {stats.energia}</div>
          </div>
        </div>
      </div>

      {/* LISTA DE CARTAS DO DECK */}
      {deck.cartas.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900 rounded-2xl shadow-lg border border-slate-800">
          <AlertCircle className="mx-auto h-16 w-16 text-slate-600 mb-4" />
          <h3 className="text-xl font-medium text-slate-300 mb-2">Deck Vazio</h3>
          <p className="text-slate-500">Clique em "Adicionar Cartas" ali no topo para começar.</p>
        </div>
      ) : (
        <>
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
        </>
      )}
      {/* MODAL DE RENOMEAR DECK */}
      {modalRenomearAberto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-100 flex items-center"><Edit2 className="mr-2 text-emerald-500"/> Renomear Deck</h3>
              <button onClick={() => setModalRenomearAberto(false)} className="text-slate-500 hover:text-slate-300 transition-colors"><X size={24}/></button>
            </div>
            
            <label className="block text-sm font-semibold text-slate-400 mb-2">Novo Nome</label>
            <input
              autoFocus
              type="text"
              value={novoNomeDeck}
              onChange={(e) => setNovoNomeDeck(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmarRenomearDeck()}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none mb-8 placeholder-slate-600"
            />
            
            <div className="flex justify-end gap-3">
              <button onClick={() => setModalRenomearAberto(false)} className="px-5 py-2.5 rounded-lg font-medium text-slate-400 hover:bg-slate-800 transition-colors">Cancelar</button>
              <button onClick={confirmarRenomearDeck} className="px-5 py-2.5 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-900/20">Salvar Nome</button>
            </div>
          </div>
        </div>
      )}

      {/* Mini estilo para esconder a scrollbar feia do navegador na lista horizontal */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}} />
    </div>
  );
}