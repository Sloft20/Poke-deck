import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, ArrowLeft, Trash2, Search, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cardImageUrl } from '../pokeApi';

export default function Colecoes() {
  const colecoes = useLiveQuery(() => db.colecoes.toArray());
  const navigate = useNavigate();

  const criarNovaColecao = async () => {
    try {
      const id = await db.colecoes.add({ nome: 'Nova Coleção', cartas: [] });
      toast.success('Coleção criada!');
      navigate(`/colecao/${id}`);
    } catch (error) {
      toast.error('Erro ao criar coleção.');
    }
  };

  const deletarColecao = async (id, e) => {
    e.preventDefault(); 
    if (window.confirm('Tem certeza que deseja apagar esta coleção inteira?')) {
      await db.colecoes.delete(id);
      toast.success('Coleção apagada!');
    }
  };

  // Mágica para pegar até 4 cartas de destaque na ordem correta
  const obterCartasCapa = (cartas) => {
    if (!cartas || cartas.length === 0) return [];
    
    let unicas = [];
    let idsVistos = new Set();
    
    // 1. Prioridade máxima: Cartas marcadas com a estrelinha
    for (let c of cartas) {
      if (c.destaque && !idsVistos.has(c.id)) {
        unicas.push(c);
        idsVistos.add(c.id);
      }
      if (unicas.length === 4) return unicas;
    }
    
    // 2. Prioridade média: Pokémon (puxa imagens mais bonitas primeiro)
    for (let c of cartas) {
      if (c.category === 'Pokemon' && !idsVistos.has(c.id)) {
        unicas.push(c);
        idsVistos.add(c.id);
      }
      if (unicas.length === 4) return unicas;
    }
    
    // 3. Completa com qualquer outra carta se faltar
    for (let c of cartas) {
      if (!idsVistos.has(c.id)) {
        unicas.push(c);
        idsVistos.add(c.id);
      }
      if (unicas.length === 4) return unicas;
    }
    
    return unicas;
  };

  if (colecoes === undefined) {
    return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;
  }

  return (
    <div className="animate-in fade-in duration-300 pb-12 max-w-6xl mx-auto">
      
      {/* CABEÇALHO SUPERIOR */}
      <div className="mb-8 flex justify-between items-center px-2">
        <Link to="/" className="inline-flex items-center text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
          <ArrowLeft size={20} className="mr-1" /> Início
        </Link>
        <button onClick={criarNovaColecao} className="flex items-center bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 active:scale-95">
          <Plus size={20} className="mr-2" /> Nova Coleção
        </button>
      </div>

      <div className="flex items-center gap-4 mb-10 px-2">
        <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
          <BookOpen size={32} className="text-emerald-500" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-slate-100 tracking-tight">Minhas Coleções</h1>
          <p className="text-slate-400 font-medium mt-1">Gerencie seus fichários e master sets.</p>
        </div>
      </div>

      {colecoes.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl max-w-2xl mx-auto">
          <BookOpen className="mx-auto h-16 w-16 text-slate-700 mb-4" />
          <h3 className="text-2xl font-bold text-slate-300 mb-2">Nenhuma coleção ainda</h3>
          <p className="text-slate-500 mb-8">Crie uma pasta vazia ou busque cartas para começar a colecionar.</p>
          <button onClick={() => navigate('/busca')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-900/30 inline-flex items-center active:scale-95">
            <Search size={20} className="mr-2" /> Buscar Primeiras Cartas
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {colecoes.map((col) => {
            const cartasCapa = obterCartasCapa(col.cartas);
            
            return (
              <div key={col.id} className="bg-slate-900 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-slate-800 overflow-hidden flex flex-col group relative">
                
                {/* VITRINE COM 4 CARTAS (LEQUE ANIMADO) */}
                <div className="h-40 bg-slate-950 flex justify-center items-center overflow-hidden border-b border-slate-800/50 relative">
                  {cartasCapa.length > 0 ? (
                    <div className="relative w-full h-full flex justify-center items-center">
                       {cartasCapa.map((carta, index) => {
                          
                          // Lógica posicional baseada na quantidade exata de cartas da capa
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
                              className={`absolute w-16 sm:w-20 object-contain rounded-md shadow-xl border border-slate-700/50 transition-all duration-500 group-hover:-translate-y-2 ${positionClasses}`}
                            />
                          );
                       })}
                    </div>
                  ) : (
                    <div className="text-slate-700 flex flex-col items-center">
                      <BookOpen size={32} className="mb-2 opacity-50" />
                      <span className="text-xs font-bold uppercase tracking-widest opacity-50">Fichário Vazio</span>
                    </div>
                  )}
                </div>
                
                {/* INFORMAÇÕES DA COLEÇÃO */}
                <div className="p-5 flex-grow bg-slate-900">
                  <h3 className="text-xl font-bold text-slate-100 mb-2 uppercase truncate" title={col.nome}>
                    {col.nome}
                  </h3>
                  <div className="flex items-center text-emerald-400 mb-1 bg-emerald-950/30 w-max px-3 py-1 rounded-full border border-emerald-900/50">
                    <BookOpen size={14} className="mr-2" />
                    <span className="text-xs font-bold tracking-wide">{col.cartas?.length || 0} CARTAS</span>
                  </div>
                </div>
                
                {/* BOTÕES DE AÇÃO */}
                <div className="p-3 bg-slate-950 flex gap-2">
                  <Link 
                    to={`/colecao/${col.id}`}
                    className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 bg-emerald-600/10 border border-emerald-600/30 rounded-lg text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all text-sm font-bold"
                  >
                    <Edit2 size={16} />
                    <span>Ver Fichário</span>
                  </Link>
                  <button 
                    onClick={(e) => deletarColecao(col.id, e)} 
                    className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all" 
                    title="Apagar Coleção"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}