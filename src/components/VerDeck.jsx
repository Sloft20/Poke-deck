import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, AlertCircle, LayoutGrid, List, Plus, Minus, Trash2, PawPrint, Backpack, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../db';
import { cardImageUrl } from '../pokeApi';

export default function VerDeck() {
  const { id } = useParams();
  const deck = useLiveQuery(() => db.decks.get(Number(id)), [id]);
  const [modoVisao, setModoVisao] = useState('grade');

  const stats = useMemo(() => {
    let pokemon = 0;
    let treinador = 0;
    let energia = 0;

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
      toast.success(`${cartaReferencia?.name} removidas do deck.`);
    }

    try {
      await db.decks.update(Number(id), { cartas: novasCartas });
    } catch (erro) {
      console.error("Erro ao atualizar o deck:", erro);
      toast.error("Erro ao atualizar deck.");
    }
  };

  if (deck === undefined) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (deck === null) return <div className="text-center p-12 text-slate-500 font-bold text-xl">Deck não encontrado!</div>;

  return (
    <div className="animate-in fade-in duration-300">
      
      <div className="mb-6 flex justify-between items-center">
        <Link to="/decks" className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium transition-colors">
          <ArrowLeft size={20} className="mr-1" />
          Voltar
        </Link>
        
        <div className="flex bg-slate-900 rounded-lg border border-slate-800 p-1 shadow-sm">
          <button onClick={() => setModoVisao('grade')} className={`p-2 rounded-md transition-colors ${modoVisao === 'grade' ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}>
            <LayoutGrid size={20} />
          </button>
          <button onClick={() => setModoVisao('lista')} className={`p-2 rounded-md transition-colors ${modoVisao === 'lista' ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}>
            <List size={20} />
          </button>
        </div>
      </div>

      <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 mb-8 border-l-4 border-l-emerald-500">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-100 uppercase">{deck.nome}</h2>
            <p className="text-slate-400 mt-1 font-medium">
              Cartas no deck: <span className={deck.cartas.length === 60 ? 'text-emerald-400 font-bold' : 'text-slate-200'}>{deck.cartas.length}/60</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            <div className="flex items-center bg-blue-900/30 text-blue-400 border border-blue-900/50 px-3 py-1.5 rounded-lg text-sm font-bold">
              <PawPrint size={16} className="mr-1.5" /> Pokémon: {stats.pokemon}
            </div>
            <div className="flex items-center bg-orange-900/30 text-orange-400 border border-orange-900/50 px-3 py-1.5 rounded-lg text-sm font-bold">
              <Backpack size={16} className="mr-1.5" /> Treinador: {stats.treinador}
            </div>
            <div className="flex items-center bg-yellow-900/30 text-yellow-400 border border-yellow-900/50 px-3 py-1.5 rounded-lg text-sm font-bold">
              <Zap size={16} className="mr-1.5" /> Energia: {stats.energia}
            </div>
          </div>
        </div>
      </div>

      {deck.cartas.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900 rounded-2xl shadow-lg border border-slate-800">
          <AlertCircle className="mx-auto h-16 w-16 text-slate-600 mb-4" />
          <h3 className="text-xl font-medium text-slate-300 mb-2">Deck Vazio</h3>
          <p className="text-slate-500">Volte à tela de Busca para adicionar cartas.</p>
        </div>
      ) : (
        <>
          {modoVisao === 'grade' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {cartasAgrupadas.map((carta) => (
                <div key={carta.id} className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden flex flex-col">
                  <div className="absolute z-10 m-2 px-3 py-1 bg-slate-950/80 text-slate-200 rounded-full font-bold text-sm shadow-md backdrop-blur-sm border border-slate-800">
                    {carta.quantidade}x
                  </div>
                  <div className="p-3 bg-slate-950 flex justify-center items-center h-56 relative">
                    {carta.image ? (
                      <img src={cardImageUrl(carta.image)} alt={carta.name} className="max-h-full rounded-md drop-shadow-md" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-600"><AlertCircle size={32} className="mb-2 opacity-50" /></div>
                    )}
                  </div>
                  <div className="p-2 border-t border-slate-800 flex items-center justify-between bg-slate-900">
                    <button onClick={() => alterarQuantidade(carta.id, 'remover')} className="p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white rounded-md transition-colors disabled:opacity-30">
                      <Minus size={18} />
                    </button>
                    <div className="flex-1 text-center px-1">
                      <p className="font-bold text-slate-200 text-xs truncate" title={carta.name}>{carta.name}</p>
                    </div>
                    <button onClick={() => alterarQuantidade(carta.id, 'adicionar')} disabled={deck.cartas.length >= 60 || carta.quantidade >= 4 && carta.category !== 'Energy'} className="p-1.5 text-blue-400 hover:bg-slate-800 hover:text-blue-300 rounded-md transition-colors disabled:opacity-30">
                      <Plus size={18} />
                    </button>
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
                    <th className="p-4 font-semibold">Nome da Carta</th>
                    <th className="p-4 font-semibold hidden sm:table-cell">Edição / ID</th>
                    <th className="p-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {cartasAgrupadas.map((carta) => (
                    <tr key={carta.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4"><span className="font-bold text-slate-200 text-lg">{carta.quantidade}x</span></td>
                      <td className="p-4 font-medium text-slate-300">{carta.name}</td>
                      <td className="p-4 text-slate-500 text-sm uppercase hidden sm:table-cell">{carta.id}</td>
                      <td className="p-4 flex justify-end gap-2">
                        <button onClick={() => alterarQuantidade(carta.id, 'remover')} className="p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded-md"><Minus size={16} /></button>
                        <button onClick={() => alterarQuantidade(carta.id, 'adicionar')} disabled={deck.cartas.length >= 60 || carta.quantidade >= 4 && carta.category !== 'Energy'} className="p-2 text-slate-400 hover:bg-slate-800 hover:text-blue-400 rounded-md"><Plus size={16} /></button>
                        <button onClick={() => alterarQuantidade(carta.id, 'deletar-todas')} className="p-2 text-slate-500 hover:bg-red-950/50 hover:text-red-400 rounded-md ml-2" title="Remover todas as cópias"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}