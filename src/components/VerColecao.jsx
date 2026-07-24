import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, AlertCircle, Plus, Minus, Trash2, Edit2, Search, X, BookOpen, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../db';
import { cardImageUrl } from '../pokeApi';
import BuscaCartas from './BuscaCartas';

export default function VerColecao() {
  const { id } = useParams();
  const colecao = useLiveQuery(() => db.colecoes.get(Number(id)), [id]);
  
  const [mostrarBusca, setMostrarBusca] = useState(false);
  const [modalRenomearAberto, setModalRenomearAberto] = useState(false);
  const [novoNome, setNovoNome] = useState('');

  // Agrupa cópias repetidas para o visual da grade ficar limpo
  const cartasAgrupadas = useMemo(() => {
    if (!colecao?.cartas) return [];
    const mapa = {};
    colecao.cartas.forEach(carta => {
      if (mapa[carta.id]) {
        mapa[carta.id].quantidade += 1;
        if (carta.destaque) mapa[carta.id].destaque = true;
      } else {
        mapa[carta.id] = { ...carta, quantidade: 1 };
      }
    });
    return Object.values(mapa);
  }, [colecao?.cartas]);

  const alterarQuantidade = async (cartaId, acao) => {
    if (!colecao) return;
    const novasCartas = [...colecao.cartas];
    const cartaReferencia = novasCartas.find(c => c.id === cartaId);

    if (acao === 'adicionar' && cartaReferencia) {
      novasCartas.push({ ...cartaReferencia });
    } else if (acao === 'remover') {
      const index = novasCartas.findIndex(c => c.id === cartaId);
      if (index !== -1) novasCartas.splice(index, 1);
    } else if (acao === 'deletar-todas') {
      const filtradas = novasCartas.filter(c => c.id !== cartaId);
      novasCartas.length = 0;
      novasCartas.push(...filtradas);
      toast.success(`${cartaReferencia?.name} removidas da coleção.`);
    }
    try { await db.colecoes.update(Number(id), { cartas: novasCartas }); } catch (e) { toast.error("Erro."); }
  };

  const alternarDestaque = async (cartaId) => {
    if (!colecao) return;
    const novasCartas = colecao.cartas.map(c => c.id === cartaId ? { ...c, destaque: !c.destaque } : c);
    await db.colecoes.update(Number(id), { cartas: novasCartas });
  };

  const abrirModalRenomear = () => { setNovoNome(colecao.nome); setModalRenomearAberto(true); };
  
  const confirmarRenomear = async () => {
    if (!novoNome.trim()) { toast.error("Nome vazio!"); return; }
    await db.colecoes.update(Number(id), { nome: novoNome });
    toast.success("Nome atualizado!"); setModalRenomearAberto(false);
  };

  if (colecao === undefined) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;
  if (colecao === null) return <div className="text-center p-12 text-slate-500 font-bold text-xl">Coleção não encontrada!</div>;

  return (
    <div className="animate-in fade-in duration-300 pb-12">
      
      {/* HEADER DE NAVEGAÇÃO */}
      <div className="mb-6 flex justify-between items-center">
        <Link to="/colecoes" className="inline-flex items-center text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
          <ArrowLeft size={20} className="mr-1" /> Voltar
        </Link>
        
        <button onClick={() => setMostrarBusca(!mostrarBusca)} className={`flex items-center px-4 py-2 rounded-lg font-bold transition-all shadow-md ${mostrarBusca ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
          {mostrarBusca ? <X size={18} className="mr-2" /> : <Search size={18} className="mr-2" />}
          <span className="hidden sm:inline">{mostrarBusca ? 'Fechar Busca' : 'Adicionar Cartas'}</span>
        </button>
      </div>

      {/* COMPONENTE DE BUSCA INJETADO */}
      {mostrarBusca && (
        <div className="mb-8 bg-slate-900/50 p-6 rounded-3xl border border-emerald-900/50 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <BuscaCartas colecaoFixaId={Number(id)} />
        </div>
      )}

      {/* CABEÇALHO DA COLEÇÃO */}
      <div className="bg-slate-900 p-8 rounded-3xl shadow-lg border border-slate-800 mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-l-4 border-l-emerald-500">
        <div>
          <div className="flex items-center gap-3">
            <BookOpen className="text-emerald-500" size={28} />
            <h2 className="text-3xl font-black text-slate-100 uppercase">{colecao.nome}</h2>
            <button onClick={abrirModalRenomear} className="text-slate-500 hover:text-emerald-400 bg-slate-800/50 hover:bg-slate-800 p-2 rounded-md transition-colors" title="Renomear Coleção"><Edit2 size={18} /></button>
          </div>
        </div>
        <div className="bg-slate-950 px-6 py-3 rounded-2xl border border-slate-800 shadow-inner">
           <p className="text-slate-400 font-medium text-sm">Total no Fichário</p>
           <p className="text-3xl font-black text-emerald-400">{colecao.cartas.length} <span className="text-lg text-slate-500 font-bold">cartas</span></p>
        </div>
      </div>

      {/* GRADE DO FICHÁRIO */}
      {colecao.cartas.length === 0 ? (
        <div className="text-center py-20 px-4 bg-slate-900 rounded-3xl shadow-lg border border-slate-800 border-dashed">
          <BookOpen className="mx-auto h-20 w-20 text-slate-700 mb-6" />
          <h3 className="text-2xl font-bold text-slate-300 mb-2">Seu Fichário está Vazio</h3>
          <p className="text-slate-500 max-w-md mx-auto">Comece a caçar! Clique em "Adicionar Cartas" acima para buscar na base de dados e montar sua coleção.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {cartasAgrupadas.map((carta) => (
            <div key={carta.id} className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden flex flex-col group relative hover:border-emerald-500/50 hover:-translate-y-1 transition-all duration-300">
              <button onClick={() => alternarDestaque(carta.id)} className={`absolute top-2 right-2 p-2 rounded-full shadow-lg z-10 transition-all ${carta.destaque ? 'bg-amber-500 text-white opacity-100' : 'bg-slate-800/80 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-700 hover:text-amber-400'}`}>
                <Star size={16} fill={carta.destaque ? "currentColor" : "none"} />
              </button>
              
              <div className="absolute z-10 m-2 px-3 py-1 bg-emerald-950/90 text-emerald-400 rounded-full font-black text-sm shadow-md backdrop-blur-sm border border-emerald-900/50">
                {carta.quantidade}x
              </div>
              
              <div className="p-3 bg-slate-950 flex justify-center items-center h-48 sm:h-64 relative">
                {carta.image ? <img src={cardImageUrl(carta.image)} alt={carta.name} className={`max-h-full rounded-lg drop-shadow-lg transition-transform duration-500 group-hover:scale-105 ${carta.destaque ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-950' : ''}`} /> : <AlertCircle className="opacity-50 text-slate-600" />}
              </div>
              
              <div className="p-2 border-t border-slate-800 flex items-center justify-between bg-slate-900">
                <button onClick={() => alterarQuantidade(carta.id, 'remover')} className="p-2 text-slate-500 hover:bg-slate-800 hover:text-red-400 rounded-lg active:scale-95"><Minus size={18} /></button>
                <div className="flex-1 text-center px-1"><p className="font-bold text-slate-200 text-xs truncate">{carta.name}</p></div>
                <button onClick={() => alterarQuantidade(carta.id, 'adicionar')} className="p-2 text-emerald-500 hover:bg-slate-800 hover:text-emerald-400 rounded-lg active:scale-95"><Plus size={18} /></button>
              </div>
              
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                 <button onClick={() => alterarQuantidade(carta.id, 'deletar-todas')} className="p-2 bg-red-500/90 hover:bg-red-500 text-white rounded-full shadow-lg" title="Remover da coleção"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE RENOMEAR COLEÇÃO */}
      {modalRenomearAberto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-100 flex items-center"><Edit2 className="mr-2 text-emerald-500"/> Renomear Coleção</h3>
              <button onClick={() => setModalRenomearAberto(false)} className="text-slate-500 hover:text-slate-300 transition-colors bg-slate-800 p-2 rounded-full"><X size={18}/></button>
            </div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Novo Nome</label>
            <input autoFocus type="text" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmarRenomear()} className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-4 focus:ring-2 focus:ring-emerald-500 outline-none mb-8" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setModalRenomearAberto(false)} className="px-5 py-3 rounded-xl font-medium text-slate-400 hover:bg-slate-800 transition-colors">Cancelar</button>
              <button onClick={confirmarRenomear} className="px-5 py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}