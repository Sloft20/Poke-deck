import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { User, LogOut, Mail, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

// Importamos a sua tela de Login pronta!
import Login from './Login'; 

export default function Perfil() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica se já existe uma sessão ativa ao carregar a página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Fica escutando mudanças de estado (ex: quando o usuário termina de fazer o login)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Erro ao sair da conta.');
    } else {
      toast.success('Desconectado com sucesso!');
      navigate('/');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
  }

  // === MÁGICA DO ROTEAMENTO ===
  // Se não estiver logado, exibe diretamente o seu componente de Login na rota de Perfil
  if (!session) {
    return <Login />;
  }

  // Se estiver logado, exibe os dados do Perfil
  const user = session.user;

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 max-w-2xl mx-auto mt-4 px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 overflow-hidden relative">
        
        {/* Efeito visual no topo do card */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>

        <div className="relative z-10 flex flex-col items-center text-center mt-6">
          <div className="w-24 h-24 bg-slate-950 border-4 border-slate-800 rounded-full flex items-center justify-center shadow-xl mb-4">
            <User size={40} className="text-blue-500" />
          </div>
          
          <h2 className="text-3xl font-black text-slate-100 tracking-tight mb-2">Meu Perfil</h2>
          <div className="flex items-center text-emerald-400 bg-emerald-950/50 px-4 py-1.5 rounded-full border border-emerald-900/50 mb-8">
            <ShieldCheck size={16} className="mr-2" />
            <span className="text-sm font-bold tracking-wide">Conta Sincronizada</span>
          </div>

          <div className="w-full bg-slate-950 rounded-2xl p-6 border border-slate-800 text-left mb-8 shadow-inner">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">E-mail Cadastrado</p>
            <div className="flex items-center text-slate-200">
              <Mail size={20} className="text-slate-400 mr-3" />
              <span className="text-lg font-medium">{user.email}</span>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 rounded-xl font-bold transition-all active:scale-95"
          >
            <LogOut size={18} className="mr-2" /> Sair da Conta
          </button>
        </div>

      </div>
    </div>
  );
}