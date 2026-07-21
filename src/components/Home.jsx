import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Search, Layers, Swords, ArrowRight, Sparkles, Trophy, Inbox, Edit2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cardImageUrl } from '../pokeApi'; // Importando o carregador de imagens

export default function Home() {
  const navigate = useNavigate();
  const decks = useLiveQuery(() => db.decks.toArray());

  if (decks === undefined) {
    return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
  }

  const temDecks = decks.length > 0;
  const totalCartasSalvas = decks.reduce((total, deck) => total + (deck.cartas?.length || 0), 0);
  
  // Pega os 3 decks mais recentes criados
  const decksRecentes = [...decks].reverse().slice(0, 3);

  // A mesma inteligência da capa que criamos na tela de Decks
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
    <div className="animate-in fade-in zoom-in-95 duration-500">
      
      {/* CENÁRIO 1: O DASHBOARD (Usuário Ativo) */}
      {temDecks ? (
        <div className="max-w-5xl mx-auto mt-4">
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Trophy className="text-amber-400 mr-3" size={32} />
              <h1 className="text-4xl font-extrabold text-slate-100 tracking-tight">Bem-vindo de volta!</h1>
            </div>
            {/* O botão "Procurar Novas Cartas" agora fica menor e no topo, como uma ação rápida */}
            <button 
              onClick={() => navigate('/busca')} 
              className="hidden md:flex items-center bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-6 py-3 font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
              <Search size={20} className="mr-2" /> Buscar Cartas
            </button>
          </div>

          {/* ESTATÍSTICAS RÁPIDAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Decks Construídos</p>
                <h3 className="text-4xl font-black text-emerald-400">{decks.length}</h3>
              </div>
              <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                <Layers size={28} className="text-emerald-500" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Total de Cartas Salvas</p>
                <h3 className="text-4xl font-black text-blue-400">{totalCartasSalvas}</h3>
              </div>
              <div className="h-16 w-16 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                <Search size={28} className="text-blue-500" />
              </div>
            </div>
            
            {/* Botão extra para mobile */}
            <button onClick={() => navigate('/busca')} className="md:hidden flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 py-4 font-bold transition-all shadow-lg">
              <Search size={20} className="mr-2" /> Buscar Novas Cartas
            </button>
          </div>

          {/* DECKS RECENTES (AGORA COM OS CARDS BONITOS) */}
          <div className="mb-6 flex justify-between items-end border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-bold text-slate-200">Decks Recentes</h2>
            <Link to="/decks" className="text-sm font-bold text-blue-500 hover:text-blue-400 transition-colors flex items-center">
              Ver todos <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {decksRecentes.map((deck) => {
              const cartasCapa = obterCartasCapa(deck.cartas);
              
              return (
                <div key={deck.id} className="bg-slate-900 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-slate-800 overflow-hidden flex flex-col group relative">
                  
                  {/* VITRINE DE CARTAS (CAPA DO DECK) */}
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
                  
                  {/* INFORMAÇÕES DO DECK */}
                  <div className="p-5 flex-grow bg-slate-900">
                    <h3 className="text-xl font-bold text-slate-100 mb-2 uppercase truncate" title={deck.nome}>
                      {deck.nome}
                    </h3>
                    <div className="flex items-center text-emerald-400 mb-1 bg-emerald-950/30 w-max px-3 py-1 rounded-full border border-emerald-900/50">
                      <Layers size={14} className="mr-2" />
                      <span className="text-xs font-bold tracking-wide">CARTAS: {deck.cartas?.length || 0}/60</span>
                    </div>
                  </div>
                  
                  {/* BOTÃO DE AÇÃO */}
                  <div className="p-3 bg-slate-950">
                    <Link 
                      to={`/deck/${deck.id}`}
                      className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-blue-600/10 border border-blue-600/30 rounded-lg text-blue-400 hover:bg-blue-600 hover:text-white transition-all text-sm font-bold"
                    >
                      <Edit2 size={16} />
                      <span>Editar Deck</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (

      /* CENÁRIO 2: A LANDING PAGE (Usuário Novo) */
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="bg-slate-900/50 p-5 rounded-full shadow-2xl border border-slate-800 mb-6 backdrop-blur-sm relative">
            <Sparkles className="absolute -top-1 -right-1 text-blue-400" size={20} />
            <Layers className="w-16 h-16 text-blue-500" strokeWidth={1.5} />
          </div>
          
          <h1 className="text-5xl font-black text-slate-100 mb-6 tracking-tight drop-shadow-lg">
            Domine o <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Pokémon TCG</span>
          </h1>
          <p className="text-slate-400 max-w-xl mb-10 text-lg font-medium leading-relaxed">
            A ferramenta definitiva para pesquisar cartas, gerenciar suas coleções offline e testar suas estratégias antes da batalha real.
          </p>

          <button 
            onClick={() => navigate('/busca')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl font-black text-lg transition-all shadow-xl shadow-blue-900/30 flex items-center hover:scale-105 active:scale-95 mb-16"
          >
            <Search className="mr-3" size={24} /> Começar a Buscar
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full text-left">
            <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
              <div className="bg-blue-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-blue-500/30">
                <Search className="text-blue-400" size={24} />
              </div>
              <h4 className="text-slate-100 font-bold mb-2 text-lg">1. Pesquise Cartas</h4>
              <p className="text-slate-500 text-sm leading-relaxed">Acesse o banco de dados completo. Busque por Pokémon, cartas de Treinador ou Energias instantaneamente.</p>
            </div>
            <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
              <div className="bg-emerald-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/30">
                <Layers className="text-emerald-400" size={24} />
              </div>
              <h4 className="text-slate-100 font-bold mb-2 text-lg">2. Monte Decks</h4>
              <p className="text-slate-500 text-sm leading-relaxed">Agrupe suas cartas e veja estatísticas automáticas de tipos. Tudo fica salvo de forma segura e offline no seu navegador.</p>
            </div>
            <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
              <div className="bg-purple-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-purple-500/30">
                <Swords className="text-purple-400" size={24} />
              </div>
              <h4 className="text-slate-100 font-bold mb-2 text-lg">3. Playtest</h4>
              <p className="text-slate-500 text-sm leading-relaxed">Embaralhe seu deck usando algoritmos reais e compre uma mão de 7 cartas para simular o início de uma partida.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}