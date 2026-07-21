import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, RefreshCw, Hand, Undo2 ,Plus } from 'lucide-react';
import { db } from '../db';
import { cardImageUrl } from '../pokeApi';

// Algoritmo clássico de Fisher-Yates para embaralhar Arrays perfeitamente
const embaralharArray = (array) => {
  let arrayEmbaralhado = [...array];
  for (let i = arrayEmbaralhado.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrayEmbaralhado[i], arrayEmbaralhado[j]] = [arrayEmbaralhado[j], arrayEmbaralhado[i]];
  }
  return arrayEmbaralhado;
};

export default function Playtest() {
  const { id } = useParams();
  const deck = useLiveQuery(() => db.decks.get(Number(id)), [id]);
  
  // Estado local para segurar o jogo sem alterar o banco de dados
  const [deckEmbaralhado, setDeckEmbaralhado] = useState([]);
  const [mao, setMao] = useState([]);
  const [comprando, setComprando] = useState(false);

  // Assim que a tela carregar, embaralha o deck original e guarda no estado
  useEffect(() => {
    if (deck?.cartas && deck.cartas.length > 0) {
      prepararNovoJogo();
    }
  }, [deck]);

  const prepararNovoJogo = () => {
    setComprando(true);
    // Dá um tempo falso só para a animação ficar bonita
    setTimeout(() => {
      const misturado = embaralharArray(deck.cartas);
      setDeckEmbaralhado(misturado);
      setMao([]); // Esvazia a mão
      setComprando(false);
    }, 400);
  };

  const comprarMaoInicial = () => {
    if (deckEmbaralhado.length < 7) {
      alert("Você precisa de pelo menos 7 cartas no deck para comprar uma mão inicial!");
      return;
    }
    
    // Tira as 7 primeiras cartas do monte e joga pra mão
    const novaMao = deckEmbaralhado.slice(0, 7);
    const deckRestante = deckEmbaralhado.slice(7);
    
    setMao(novaMao);
    setDeckEmbaralhado(deckRestante);
  };

  const comprarUmaCarta = () => {
    if (deckEmbaralhado.length === 0) return;
    
    const cartaPuxada = deckEmbaralhado[0];
    const deckRestante = deckEmbaralhado.slice(1);
    
    setMao([...mao, cartaPuxada]);
    setDeckEmbaralhado(deckRestante);
  };

  if (deck === undefined) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;
  }

  if (deck === null) return <div className="text-center p-12 text-slate-500">Deck não encontrado!</div>;

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* Barra Superior */}
      <div className="mb-6 flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
        <Link to={`/deck/${id}`} className="inline-flex items-center text-slate-400 hover:text-white font-medium transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Voltar ao Deck
        </Link>
        <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wider">{deck.nome} <span className="text-emerald-500">- Playtest</span></h2>
      </div>

      {/* Painel de Controle (A Mesa) */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="flex items-center gap-4">
          <div className="bg-slate-950 border border-slate-700 h-32 w-24 rounded-lg flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
             {/* Efeito visual simulando um monte de cartas viradas */}
             <div className="absolute inset-0 bg-blue-900/20 striped-bg opacity-50"></div>
             <span className="text-3xl font-black text-slate-300 z-10">{deckEmbaralhado.length}</span>
             <span className="text-xs text-slate-500 font-bold uppercase z-10">Restantes</span>
          </div>
          
          <div className="flex flex-col gap-2">
            <button 
              onClick={comprarMaoInicial} 
              disabled={mao.length > 0 || deckEmbaralhado.length < 7}
              className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all disabled:opacity-30 disabled:hover:bg-emerald-600 shadow-md"
            >
              <Hand size={18} className="mr-2" />
              Comprar 7 Cartas
            </button>
            <button 
              onClick={comprarUmaCarta} 
              disabled={deckEmbaralhado.length === 0}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all disabled:opacity-30 disabled:hover:bg-blue-600 shadow-md"
            >
              <Plus size={18} className="mr-2" />
              Comprar +1 Carta
            </button>
          </div>
        </div>

        <button 
          onClick={prepararNovoJogo} 
          className="flex items-center px-4 py-3 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-bold transition-all w-full md:w-auto justify-center"
        >
          <RefreshCw size={18} className={`mr-2 ${comprando ? 'animate-spin' : ''}`} />
          Embaralhar Tudo
        </button>
      </div>

      {/* A MÃO DO JOGADOR */}
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 min-h-[400px]">
        <h3 className="text-slate-400 font-bold uppercase tracking-wider mb-6 flex items-center">
          <Hand size={18} className="mr-2"/> Sua Mão ({mao.length})
        </h3>

        {mao.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 opacity-30">
            <Hand size={48} className="mb-4 text-slate-500" />
            <p className="text-slate-400 font-medium text-lg">Mão Vazia. Clique em "Comprar 7 Cartas".</p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 lg:-space-x-12 hover:space-x-2 transition-all duration-300 px-4">
            {mao.map((carta, index) => (
              <div 
                key={`${carta.id}-${index}`} 
                className="w-24 sm:w-32 md:w-40 lg:w-48 transform transition-all hover:-translate-y-6 hover:scale-110 hover:z-50 cursor-pointer drop-shadow-2xl"
                style={{ zIndex: index }}
              >
                <img 
                  src={cardImageUrl(carta.image)} 
                  alt={carta.name} 
                  className="w-full h-auto rounded-md shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-slate-700/50"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Estilo CSS rapidinho para o fundo do "Monte" de cartas */}
      <style dangerouslySetInnerHTML={{__html: `
        .striped-bg {
          background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.2) 5px, rgba(0,0,0,0.2) 10px);
        }
      `}} />
    </div>
  );
}