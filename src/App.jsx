import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Search, Layers } from 'lucide-react';
import { Toaster } from 'react-hot-toast'; // Importação das notificações
import BuscaCartas from './components/BuscaCartas';
import MeusDecks from './components/MeusDecks';
import VerDeck from './components/VerDeck'; 

function NavBar() {
  const location = useLocation();

  return (
    // NavBar Escura e Premium
    <nav className="bg-slate-900 text-white shadow-xl border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex space-x-6">
          <Link 
            to="/" 
            className={`flex items-center space-x-2 py-4 px-3 border-b-4 transition-colors ${
              location.pathname === '/' ? 'border-blue-500 text-blue-400' : 'border-transparent hover:text-blue-400'
            }`}
          >
            <Search size={20} />
            <span className="font-semibold hidden sm:inline">Buscar Cartas</span>
          </Link>
          
          <Link 
            to="/decks" 
            className={`flex items-center space-x-2 py-4 px-3 border-b-4 transition-colors ${
              location.pathname === '/decks' || location.pathname.startsWith('/deck/') ? 'border-emerald-500 text-emerald-400' : 'border-transparent hover:text-emerald-400'
            }`}
          >
            <Layers size={20} />
            <span className="font-semibold hidden sm:inline">Meus Decks</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      {/* O fundo de todo o site agora é um azul-marinho muito escuro e elegante (slate-950) */}
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500 selection:text-white">
        <NavBar />
        
        {/* Aqui configuramos o visual das nossas notificações pop-up */}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1e293b', // Fundo escuro (slate-800)
              color: '#f8fafc',      // Texto claro
              border: '1px solid #334155', // Borda sutil
              fontWeight: '500'
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' }, // Verde Emerald
            }
          }}
        />
        
        <main className="max-w-6xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<BuscaCartas />} />
            <Route path="/decks" element={<MeusDecks />} />
            <Route path="/deck/:id" element={<VerDeck />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;