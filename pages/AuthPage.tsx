import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';

interface AuthPageProps {
    onAuthSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                setMessage('Login bem-sucedido! Redirecionando...');
                setTimeout(() => onAuthSuccess(), 1000);
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                    },
                },
            });

            if (error) throw error;

            if (data.user) {
                setMessage('Conta criada com sucesso! Verifique seu email para confirmar.');
                // Clear form
                setEmail('');
                setPassword('');
                setName('');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao criar conta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-4">
                        <span className="text-3xl">🌲</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">OFICE</h1>
                    <p className="text-gray-600 mt-2">Sistema de Gestão Operacional</p>
                </div>

                {/* Auth Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {/* Toggle Buttons */}
                    <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => {
                                setIsLogin(true);
                                setError(null);
                                setMessage(null);
                            }}
                            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${isLogin
                                    ? 'bg-white text-emerald-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            <LogIn size={18} className="inline mr-2" />
                            Entrar
                        </button>
                        <button
                            onClick={() => {
                                setIsLogin(false);
                                setError(null);
                                setMessage(null);
                            }}
                            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${!isLogin
                                    ? 'bg-white text-emerald-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            <UserPlus size={18} className="inline mr-2" />
                            Criar Conta
                        </button>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                            {message}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome Completo
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="João Silva"
                                    required={!isLogin}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                placeholder="seu@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Senha
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                            {!isLogin && (
                                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Processando...
                                </>
                            ) : isLogin ? (
                                'Entrar'
                            ) : (
                                'Criar Conta'
                            )}
                        </button>
                    </form>

                    {/* Development Bypass */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <button
                            onClick={() => onAuthSuccess()}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                            title="Bypass authentication for development (only works if Supabase is not configured)"
                        >
                            🔧 Development Mode (Skip Auth)
                        </button>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Only use this for testing the UI while setting up Supabase
                        </p>
                    </div>

                    {/* Footer */}
                    {isLogin && (
                        <div className="mt-4 text-center">
                            <a href="#" className="text-sm text-emerald-600 hover:text-emerald-700">
                                Esqueceu a senha?
                            </a>
                        </div>
                    )}
                </div>

                {/* Info Footer */}
                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>Sistema de Gestão Operacional Florestal</p>
                    <p className="mt-1">© 2025 OFICE - Todos os direitos reservados</p>
                </div>
            </div>
        </div>
    );
};
