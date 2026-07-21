import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Search, Layers, Home as HomeIcon } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import BuscaCartas from './components/BuscaCartas';
import MeusDecks from './components/MeusDecks';
import VerDeck from './components/VerDeck'; 
import Home from './components/Home'; // NOSSA NOVA PÁGINA INICIAL!

function NavBar() {
  const location = useLocation();
  
  // Função para saber se a rota está ativa e mudar a cor do botão
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    // A ILHA FLUTUANTE (Pílula Glassmorphism)
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] sm:w-[450px] animate-in slide-in-from-top-4 duration-500">
      <nav className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-full shadow-2xl shadow-black/50 p-1.5 flex justify-between items-center text-sm font-bold">
        
        <Link 
          to="/" 
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-full transition-all duration-300 ${isActive('/') ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
          <HomeIcon size={18} />
          <span className="hidden sm:inline">Início</span>
        </Link>
        
        <Link 
          to="/busca" 
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-full transition-all duration-300 ${isActive('/busca') ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
          <Search size={18} />
          <span className="hidden sm:inline">Buscar</span>
        </Link>
        
        <Link 
          to="/decks" 
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-full transition-all duration-300 ${isActive('/deck') ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
          <Layers size={18} />
          <span className="hidden sm:inline">Decks</span>
        </Link>

      </nav>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500 selection:text-white">
        <NavBar />
        
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', fontWeight: '500' },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } }
          }}
        />
        
        {/* pt-28 (padding-top) garante que o conteúdo não fique escondido atrás da barra flutuante */}
        <main className="max-w-6xl mx-auto px-4 pt-28 pb-12">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/busca" element={<BuscaCartas />} />
            <Route path="/decks" element={<MeusDecks />} />
            <Route path="/deck/:id" element={<VerDeck />} />
            {/* Se você já tem a rota do playtest, deixe ela aqui também! */}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;