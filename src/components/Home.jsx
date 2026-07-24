import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Search, Layers, Swords, ArrowRight, Sparkles, Trophy, Inbox, Edit2, BookOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cardImageUrl } from '../pokeApi';

export default function Home() {
  const navigate = useNavigate();
  
  const decks = useLiveQuery(() => db.decks.toArray());
  const colecoes = useLiveQuery(() => db.colecoes.toArray());

  if (decks === undefined || colecoes === undefined) {
    return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
  }

  const temConteudo = decks.length > 0 || colecoes.length > 0;
  
  const totalCartasDecks = decks.reduce((total, deck) => total + (deck.cartas?.length || 0), 0);
  const totalCartasColecoes = colecoes.reduce((total, col) => total + (col.cartas?.length || 0), 0);
  const totalGeral = totalCartasDecks + totalCartasColecoes;
  
  // AUMENTADO PARA 4: Como a tela esticou, agora cabem 4 recentes!
  const decksRecentes = [...decks].reverse().slice(0, 4);
  const colecoesRecentes = [...colecoes].reverse().slice(0, 4);

  const obterCartasCapa = (cartas, limite) => {
    if (!cartas || cartas.length === 0) return [];
    
    let unicas = [];
    let idsVistos = new Set();
    
    for (let c of cartas) {
      if (c.destaque && !idsVistos.has(c.id)) {
        unicas.push(c);
        idsVistos.add(c.id);
      }
      if (unicas.length === limite) return unicas;
    }
    
    for (let c of cartas) {
      if (c.category === 'Pokemon' && !idsVistos.has(c.id)) {
        unicas.push(c);
        idsVistos.add(c.id);
      }
      if (unicas.length === limite) return unicas;
    }
    
    for (let c of cartas) {
      if (!idsVistos.has(c.id)) {
        unicas.push(c);
        idsVistos.add(c.id);
      }
      if (unicas.length === limite) return unicas;
    }
    
    return unicas;
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500">
      
      {/* CENÁRIO 1: O DASHBOARD (Usuário Ativo) */}
      {temConteudo ? (
        // === MÁGICA AQUI === 
        // max-w-5xl virou max-w-[1400px] (muito mais largo) com padding inteligente nas laterais.
        <div className="w-full max-w-[1400px] mx-auto mt-4 px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center">
              <Trophy className="text-amber-400 mr-3" size={32} />
              <h1 className="text-4xl font-extrabold text-slate-100 tracking-tight">Bem-vindo de volta!</h1>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => navigate('/colecoes')} className="hidden md:flex items-center bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg px-4 py-3 font-bold transition-all active:scale-95">
                <BookOpen size={20} className="mr-2" /> Coleções
              </button>
              <button onClick={() => navigate('/busca')} className="hidden md:flex items-center bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-6 py-3 font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95">
                <Search size={20} className="mr-2" /> Buscar Cartas
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Link to="/decks" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 flex items-center justify-between shadow-lg hover:border-blue-500/50 transition-colors group">
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-xs lg:text-sm mb-1 group-hover:text-blue-400 transition-colors">Decks Construídos</p>
                <h3 className="text-4xl lg:text-5xl font-black text-slate-200">{decks.length}</h3>
              </div>
              <div className="h-16 w-16 lg:h-20 lg:w-20 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                <Layers className="text-blue-500 w-7 h-7 lg:w-9 lg:h-9" />
              </div>
            </Link>

            <Link to="/colecoes" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 flex items-center justify-between shadow-lg hover:border-emerald-500/50 transition-colors group">
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-xs lg:text-sm mb-1 group-hover:text-emerald-400 transition-colors">Coleções (Fichários)</p>
                <h3 className="text-4xl lg:text-5xl font-black text-slate-200">{colecoes.length}</h3>
              </div>
              <div className="h-16 w-16 lg:h-20 lg:w-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                <BookOpen className="text-emerald-500 w-7 h-7 lg:w-9 lg:h-9" />
              </div>
            </Link>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-xs lg:text-sm mb-1">Total de Cartas Salvas</p>
                <h3 className="text-4xl lg:text-5xl font-black text-purple-400">{totalGeral}</h3>
              </div>
              <div className="h-16 w-16 lg:h-20 lg:w-20 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20">
                <Search className="text-purple-500 w-7 h-7 lg:w-9 lg:h-9" />
              </div>
            </div>
            
            <button onClick={() => navigate('/busca')} className="md:hidden flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 py-4 font-bold transition-all shadow-lg">
              <Search size={20} className="mr-2" /> Buscar Novas Cartas
            </button>
          </div>

          {/* ==================================================== */}
          {/* DECKS RECENTES */}
          {/* ==================================================== */}
          {decksRecentes.length > 0 && (
            <div className="mb-14">
              <div className="mb-6 flex justify-between items-end border-b border-slate-800 pb-4">
                <h2 className="text-2xl lg:text-3xl font-bold text-slate-200">Decks Recentes</h2>
                <Link to="/decks" className="text-sm font-bold text-blue-500 hover:text-blue-400 transition-colors flex items-center">
                  Ver todos <ArrowRight size={16} className="ml-1" />
                </Link>
              </div>

              {/* GRID ATUALIZADO: Agora suporta 4 colunas em telas xl */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {decksRecentes.map((deck) => {
                  const cartasCapa = obterCartasCapa(deck.cartas, 3);
                  
                  return (
                    <div key={deck.id} className="bg-slate-900 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-slate-800 overflow-hidden flex flex-col group relative">
                      <div className="h-40 bg-slate-950 flex justify-center items-center overflow-hidden border-b border-slate-800/50 relative">
                        {cartasCapa.length > 0 ? (
                          <div className="flex justify-center items-center mt-4">
                            {cartasCapa.map((carta, index) => (
                              <img 
                                key={carta.id + index}
                                src={cardImageUrl(carta.image)} 
                                alt={carta.name}
                                className={`w-24 object-contain rounded-md shadow-2xl border border-slate-700/50 transition-all duration-500 group-hover:-translate-y-3
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
                        <h3 className="text-xl font-bold text-slate-100 mb-2 uppercase truncate" title={deck.nome}>
                          {deck.nome}
                        </h3>
                        <div className="flex items-center text-blue-400 mb-1 bg-blue-950/30 w-max px-3 py-1 rounded-full border border-blue-900/50">
                          <Layers size={14} className="mr-2" />
                          <span className="text-xs font-bold tracking-wide">CARTAS: {deck.cartas?.length || 0}/60</span>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-slate-950">
                        <Link to={`/deck/${deck.id}`} className="w-full flex items-center justify-center space-x-2 py-3 px-3 bg-blue-600/10 border border-blue-600/30 rounded-lg text-blue-400 hover:bg-blue-600 hover:text-white transition-all text-sm font-bold">
                          <Edit2 size={16} />
                          <span>Editar Deck</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {/* ========================================================== */}
          {/* COLEÇÕES RECENTES */}
          {/* ========================================================== */}
          {colecoesRecentes.length > 0 && (
            <div className="mb-10">
              <div className="mb-6 flex justify-between items-end border-b border-slate-800 pb-4">
                <h2 className="text-2xl lg:text-3xl font-bold text-slate-200">Coleções Recentes</h2>
                <Link to="/colecoes" className="text-sm font-bold text-emerald-500 hover:text-emerald-400 transition-colors flex items-center">
                  Ver todas <ArrowRight size={16} className="ml-1" />
                </Link>
              </div>

              {/* GRID ATUALIZADO: Agora suporta 4 colunas em telas xl */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {colecoesRecentes.map((col) => {
                  const cartasCapa = obterCartasCapa(col.cartas, 4);
                  
                  return (
                    <div key={col.id} className="bg-slate-900 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-slate-800 overflow-hidden flex flex-col group relative">
                      
                      <div className="h-40 bg-slate-950 flex justify-center items-center overflow-hidden border-b border-slate-800/50 relative">
                        {cartasCapa.length > 0 ? (
                          <div className="relative w-full h-full flex justify-center items-center mt-2">
                             {cartasCapa.map((carta, index) => {
                                let positionClasses = '';
                                
                                if (cartasCapa.length === 4) {
                                   if (index === 0) positionClasses = '-rotate-[15deg] -translate-x-12 translate-y-3 z-0 opacity-70 group-hover:-translate-x-16 group-hover:rotate-[-20deg] group-hover:opacity-100';
                                   if (index === 1) positionClasses = '-rotate-[5deg] -translate-x-4 z-10 scale-105 shadow-black/80 group-hover:-translate-x-6 group-hover:rotate-[-10deg]';
                                   if (index === 2) positionClasses = 'rotate-[5deg] translate-x-4 z-20 scale-105 shadow-black/80 group-hover:translate-x-6 group-hover:rotate-[10deg]';
                                   if (index === 3) positionClasses = 'rotate-[15deg] translate-x-12 translate-y-3 z-30 opacity-70 group-hover:translate-x-16 group-hover:rotate-[20deg] group-hover:opacity-100';
                                } 
                                else if (cartasCapa.length === 3) {
                                   if (index === 0) positionClasses = '-rotate-12 -translate-x-10 translate-y-2 z-0 opacity-80 group-hover:-translate-x-12 group-hover:rotate-[-16deg] group-hover:opacity-100';
                                   if (index === 1) positionClasses = 'z-10 scale-110 shadow-black/80 group-hover:scale-[1.15]';
                                   if (index === 2) positionClasses = 'rotate-12 translate-x-10 translate-y-2 z-0 opacity-80 group-hover:translate-x-12 group-hover:rotate-[16deg] group-hover:opacity-100';
                                } 
                                else if (cartasCapa.length === 2) {
                                   if (index === 0) positionClasses = '-rotate-6 -translate-x-4 z-0 group-hover:-translate-x-6 group-hover:rotate-[-10deg]';
                                   if (index === 1) positionClasses = 'rotate-6 translate-x-4 z-10 scale-105 group-hover:translate-x-6 group-hover:rotate-[10deg]';
                                } 
                                else if (cartasCapa.length === 1) {
                                   positionClasses = 'scale-110 z-10 group-hover:scale-[1.15]';
                                }

                                return (
                                  <img 
                                    key={carta.id + index}
                                    src={cardImageUrl(carta.image)} 
                                    alt={carta.name}
                                    className={`absolute w-20 object-contain rounded-md shadow-xl border border-slate-700/50 transition-all duration-500 group-hover:-translate-y-2 ${positionClasses}`}
                                  />
                                );
                             })}
                          </div>
                        ) : (
                          <div className="text-slate-700 flex flex-col items-center">
                            <BookOpen size={28} className="mb-2 opacity-50" />
                            <span className="text-xs font-bold uppercase tracking-widest opacity-50">Fichário Vazio</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-5 flex-grow bg-slate-900">
                        <h3 className="text-xl font-bold text-slate-100 mb-2 uppercase truncate" title={col.nome}>
                          {col.nome}
                        </h3>
                        <div className="flex items-center text-emerald-400 mb-1 bg-emerald-950/30 w-max px-3 py-1 rounded-full border border-emerald-900/50">
                          <BookOpen size={14} className="mr-2" />
                          <span className="text-xs font-bold tracking-wide">CARTAS: {col.cartas?.length || 0}</span>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-slate-950">
                        <Link 
                          to={`/colecao/${col.id}`}
                          className="flex-1 flex items-center justify-center space-x-2 py-3 px-3 bg-emerald-600/10 border border-emerald-600/30 rounded-lg text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all text-sm font-bold"
                        >
                          <Edit2 size={16} />
                          <span>Ver Fichário</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
          <p className="text-slate-400 max-w-xl mx-auto mb-10 text-lg font-medium leading-relaxed">
            A ferramenta definitiva para pesquisar cartas, gerenciar suas coleções offline e testar suas estratégias antes da batalha real.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full mx-auto mb-16">
            <Link to="/decks" className="group bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl hover:border-blue-500 hover:shadow-blue-900/20 transition-all flex flex-col items-center text-center">
              <div className="bg-blue-500/10 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <Layers size={40} className="text-blue-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-100 mb-2">Meus Decks</h2>
              <p className="text-slate-400 font-medium text-sm">Construa, teste e exporte decks competitivos com até 60 cartas.</p>
            </Link>

            <Link to="/colecoes" className="group bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl hover:border-emerald-500 hover:shadow-emerald-900/20 transition-all flex flex-col items-center text-center">
              <div className="bg-emerald-500/10 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <BookOpen size={40} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-100 mb-2">Minhas Coleções</h2>
              <p className="text-slate-400 font-medium text-sm">Fichários digitais livres. Organize suas cartas favoritas sem limites.</p>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mx-auto text-left">
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