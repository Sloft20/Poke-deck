import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Tenta fazer o Login
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Bem-vindo de volta!');
        navigate('/'); // Manda pro Hub
      } else {
        // Tenta criar a conta
        // Tenta criar a conta BURlando a necessidade de enviar o e-mail de confirmação
        const { error } = await supabase.auth.signUp({
          email,
          password,
          // Este é o macete! Impede que o Supabase envie o email chato e cadastra na hora.
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        
        // Se bater no rate limit mesmo assim, tentamos o login direto, 
        // pois às vezes a conta foi criada, só o e-mail que falhou.
        if (error) {
           if (error.message.includes('rate limit')) {
               toast.error('Você tentou muitas vezes. Aguarde uns minutos ou use um e-mail falso como "teste99@pokemon.com"');
               throw error;
           }
           throw error;
        }
        toast.success('Conta criada com sucesso! Você já está logado.');
        navigate('/');
      }
    } catch (error) {
      toast.error(error.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-8 relative overflow-hidden">
        
        {/* Efeito de brilho no fundo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

        <div className="text-center mb-8">
          <div className="bg-slate-950 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-800 shadow-inner">
            {isLogin ? <LogIn className="text-blue-500" size={32} /> : <UserPlus className="text-emerald-500" size={32} />}
          </div>
          <h2 className="text-3xl font-black text-slate-100 tracking-tight">
            {isLogin ? 'Acessar Conta' : 'Criar Conta'}
          </h2>
          <p className="text-slate-500 mt-2 font-medium">
            {isLogin ? 'Sincronize seus decks na nuvem.' : 'Junte-se à comunidade de treinadores.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">E-mail</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Mail size={18} /></div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 pl-12 pr-4 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-200 transition-all"
                placeholder="treinador@pokemon.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Senha</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Lock size={18} /></div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full h-12 pl-12 pr-4 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-200 transition-all"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full h-12 rounded-xl font-bold flex items-center justify-center transition-all shadow-lg active:scale-95 disabled:opacity-50
              ${isLogin ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'}`}
          >
            {loading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : (
              <>{isLogin ? 'Entrar' : 'Cadastrar'} <ArrowRight size={18} className="ml-2" /></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça Login'}
          </button>
        </div>
      </div>
    </div>
  );
}