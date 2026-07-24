import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Search, Layers, Home as HomeIcon, User, LogOut, BookOpen } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { supabase } from './supabaseClient'; // Nosso cliente do banco
import { db } from './db'; // Adicione isso junto com os outros imports!

// Importações dos componentes
import BuscaCartas from './components/BuscaCartas';
import MeusDecks from './components/MeusDecks';
import VerDeck from './components/VerDeck'; 
import Home from './components/Home';
import Login from './components/Login'; 
import Colecoes from './components/Colecoes';
import VerColecao from './components/VerColecao';
import Perfil from './components/Perfil';

function NavBar({ session }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] sm:w-[480px] lg:w-[500px] animate-in slide-in-from-top-4 duration-500">
      <nav className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-full shadow-2xl p-1.5 flex justify-between items-center text-sm font-bold">
        
        <Link to="/" className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 rounded-full transition-all duration-300 ${isActive('/') ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
          <HomeIcon size={18} /><span className="hidden sm:inline">Início</span>
        </Link>
        
        <Link to="/busca" className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 rounded-full transition-all duration-300 ${isActive('/busca') ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
          <Search size={18} /><span className="hidden sm:inline">Buscar</span>
        </Link>
        
        <Link to="/decks" className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 rounded-full transition-all duration-300 ${isActive('/deck') || isActive('/decks') ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
          <Layers size={18} /><span className="hidden sm:inline">Decks</span>
        </Link>

        <Link to="/colecoes" className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 rounded-full transition-all duration-300 ${isActive('/colecoes') || isActive('/colecao') ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
          <BookOpen size={18} /><span className="hidden sm:inline">Coleções</span>
        </Link>

        {/* DIVISÓRIA E ÁREA DO USUÁRIO */}
        <div className="w-px h-6 bg-slate-700/50 mx-1"></div>

        {/* ÍCONE DE PERFIL REDONDO */}
        <Link 
          to="/perfil" 
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 shrink-0 mx-1
            ${isActive('/perfil') 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-500/50 ring-offset-2 ring-offset-slate-900' 
              : session 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30' 
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 relative overflow-hidden group'
            }`}
          title={session ? "Meu Perfil" : "Fazer Login"}
        >
          {/* Efeito sutil para convidar ao login se não estiver logado */}
          {!session && !isActive('/perfil') && (
            <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          )}
          <User size={18} className="relative z-10" />
        </Link>

      </nav>
    </div>
  );
}

export default function App() {
  // Estado global para guardar se o usuário está logado ou não
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Função mágica que faz o upload dos decks antigos
    const sincronizarDecksAntigos = async (user) => {
      if (!user) return;
      
      try {
        // Puxa tudo do banco local (Dexie)
        const decksLocais = await db.decks.toArray();
        if (decksLocais.length === 0) return; // Se não tiver nada, sai da função
        
        toast.loading('Sincronizando seus decks com a nuvem...', { id: 'sync' });
        
        // Molda os dados para o formato que o Supabase espera
        const decksNuvem = decksLocais.map(deck => ({
          user_id: user.id,
          nome: deck.nome,
          cartas: deck.cartas
        }));

        // Insere tudo no Supabase de uma vez só!
        const { error } = await supabase.from('decks').insert(decksNuvem);
        
        if (error) throw error;

        // Se o upload deu certo, apagamos os locais para não duplicar no futuro
        await db.decks.clear();
        toast.success('Decks sincronizados com sucesso!', { id: 'sync' });

      } catch (erro) {
        console.error(erro);
        toast.error('Erro ao sincronizar decks antigos.', { id: 'sync' });
      }
    };

    // Verifica a sessão quando o app abre
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) sincronizarDecksAntigos(session.user);
    });

    // Escuta as mudanças de login/logout em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) sincronizarDecksAntigos(session.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500 selection:text-white">
        {/* Passamos a sessão para a Navbar saber qual botão renderizar */}
        <NavBar session={session} />
        
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', fontWeight: '500' }, success: { iconTheme: { primary: '#10b981', secondary: '#fff' } } }} />
        
        <main className="max-w-6xl mx-auto px-4 pt-28 pb-12">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/busca" element={<BuscaCartas />} />
            <Route path="/decks" element={<MeusDecks />} />
            <Route path="/deck/:id" element={<VerDeck />} />
            <Route path="/colecoes" element={<Colecoes />} />
            <Route path="/colecao/:id" element={<VerColecao />} />  
            <Route path="/login" element={<Login />} />
            <Route path="/perfil" element={<Perfil />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}