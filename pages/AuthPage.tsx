import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { LogIn, UserPlus, Loader2, Copy, Check, ArrowRight, Building2, User as UserIcon, MapPin, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthPageProps {
    onAuthSuccess: () => void;
}

type OnboardingStep = 'auth' | 'profile' | 'company' | 'confirm';

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [step, setStep] = useState<OnboardingStep>('auth');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Auth Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Profile State
    const [name, setName] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [role, setRole] = useState<'ADMIN' | 'GENERAL_MANAGER' | 'WORKER'>('WORKER');

    // Company/Sede State
    const [companyName, setCompanyName] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            if (data.user) {
                console.log('✅ Login bem-sucedido para:', data.user.email);
                // Check if user has a profile/location
                const { data: profile, error: profileError } = await supabase
                    .from('users')
                    .select('location_id')
                    .eq('id', data.user.id)
                    .single();

                if (profileError && profileError.code !== 'PGRST116') {
                    console.error('Erro ao buscar perfil:', profileError);
                }

                if (profile?.location_id) {
                    console.log('✅ Usuário já tem location_id, indo para dashboard');
                    onAuthSuccess();
                } else {
                    console.log('ℹ️ Usuário sem location_id, começando onboarding');
                    setStep('profile');
                }
            }
        } catch (err: any) {
            console.error('❌ Erro no login:', err);
            setError(err.message || 'Erro ao entrar');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic client-side validation before collecting profile
        if (!email?.trim()) {
            setError('Por favor, preencha um email válido');
            return;
        }
        if (!password || password.length < 6) {
            setError('A senha precisa ter ao menos 6 caracteres');
            return;
        }

        console.log('ℹ️ Validado email/senha — avançando para coleta de perfil');
        setStep('profile');
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate profile fields
        if (!name?.trim()) {
            setError('Por favor, preencha seu nome');
            return;
        }
        if (!jobTitle?.trim()) {
            setError('Por favor, preencha seu cargo');
            return;
        }
        if (!role) {
            setError('Por favor, selecione seu cargo/função');
            return;
        }

        setError(null);
        console.log('✅ Perfil validado, indo para próximo passo');
        setStep('company');
    };

    const handleOnboardingComplete = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validate form inputs
            if (!companyName?.trim()) {
                throw new Error('Por favor, preencha o nome da empresa');
            }
            if (!companyAddress?.trim()) {
                throw new Error('Por favor, preencha a localização/endereço');
            }
            if (!name?.trim()) {
                throw new Error('Por favor, preencha seu nome');
            }
            if (!jobTitle?.trim()) {
                throw new Error('Por favor, preencha seu cargo');
            }

            console.log('🔍 Iniciando processo de registo nativo...', { email, name, role });

            const { data, error: signupError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        jobTitle,
                        role,
                        company: {
                            name: companyName,
                            address: companyAddress
                        }
                    }
                }
            });

            if (signupError) throw signupError;

            setMessage('Registro realizado com sucesso! Verifique seu e-mail para confirmar a conta e ativar o seu acesso.');
            setStep('confirm');
        } catch (err: any) {
            console.error('❌ Erro no onboarding:', err);
            setError(err.message || 'Erro desconhecido ao finalizar onboarding');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen animated-bg flex items-center justify-center p-4 overflow-hidden relative font-sans">
            {/* Decorative background elements - subtler for light theme */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />

            <div className="w-full max-w-xl relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 glass rounded-3xl mb-6 shadow-xl">
                        <span className="text-4xl text-slate-900">🌲</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-950 tracking-tight mb-2">OFICE</h1>
                    <p className="text-slate-700 font-bold text-lg">Gestão Operacional de Próxima Geração</p>
                </motion.div>

                <AnimatePresence mode="wait">
                    {step === 'auth' && (
                        <motion.div
                            key="auth"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="glass rounded-[2rem] shadow-2xl p-10 border border-slate-200"
                        >
                            <div className="flex gap-4 mb-8 bg-slate-200/50 p-1.5 rounded-2xl">
                                <button
                                    onClick={() => setIsLogin(true)}
                                    className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all duration-300 ${isLogin ? 'bg-white text-emerald-700 shadow-md transform scale-[1.02]' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    Entrar
                                </button>
                                <button
                                    onClick={() => setIsLogin(false)}
                                    className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all duration-300 ${!isLogin ? 'bg-white text-emerald-700 shadow-md transform scale-[1.02]' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    Novo Registro
                                </button>
                            </div>

                            {error && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-100 border border-red-200 text-red-900 rounded-2xl text-sm font-bold">
                                    {error}
                                </motion.div>
                            )}

                            <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-900 ml-2">Email Profissional</label>
                                    <div className="relative">
                                        <input
                                            id="auth-email"
                                            name="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-6 py-4 bg-white/50 border border-slate-300 rounded-2xl text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all font-medium"
                                            placeholder="exemplo@empresa.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-900 ml-2">Sua Senha</label>
                                    <input
                                        id="auth-password"
                                        name="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-6 py-4 bg-white/50 border border-slate-300 rounded-2xl text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all font-medium"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-emerald-600 text-black py-5 rounded-2xl font-black text-lg hover:bg-emerald-700 hover:text-white active:scale-[0.98] transition-all shadow-xl shadow-emerald-900/10 flex items-center justify-center gap-3"
                                >
                                    {loading ? <Loader2 size={24} className="animate-spin text-black" /> : isLogin ? 'Acessar Painel' : 'Iniciar Jornada'}
                                    {!loading && <ArrowRight size={20} className="text-black" />}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {step === 'profile' && (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass rounded-[2rem] shadow-2xl p-10 border border-slate-200"
                        >
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                                    <UserIcon size={32} className="text-emerald-700" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-950">Sobre Você</h2>
                                <p className="text-slate-600 font-bold">Vamos personalizar sua experiência</p>
                            </div>

                            <form onSubmit={handleProfileSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-900 ml-2">Como devemos te chamar?</label>
                                    <input
                                        id="profile-name"
                                        name="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-6 py-4 bg-white/50 border border-slate-300 rounded-2xl text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all font-medium"
                                        placeholder="Seu Nome Completo"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-900 ml-2">Qual seu cargo/função?</label>
                                    <select
                                        id="profile-role"
                                        name="role"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as 'ADMIN' | 'GENERAL_MANAGER' | 'WORKER')}
                                        className="w-full px-6 py-4 bg-white/50 border border-slate-300 rounded-2xl text-slate-950 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all font-medium"
                                        required
                                    >
                                        <option value="WORKER">Colaborador (Worker)</option>
                                        <option value="GENERAL_MANAGER">Gerente Geral (Manager)</option>
                                        <option value="ADMIN">Administrador (Admin)</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-900 ml-2">Descrição do seu cargo (opcional)</label>
                                    <input
                                        id="profile-jobtitle"
                                        name="jobTitle"
                                        type="text"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        className="w-full px-6 py-4 bg-white/50 border border-slate-300 rounded-2xl text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all font-medium"
                                        placeholder="Ex: Gestor de Operações, Técnico, etc."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-emerald-600 text-black py-5 rounded-2xl font-black text-lg hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-3"
                                >
                                    Próximo Passo
                                    <ArrowRight size={20} className="text-black" />
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {step === 'company' && (
                        <motion.div
                            key="company"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass rounded-[2rem] shadow-2xl p-10 border border-slate-200"
                        >
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                                    <Building2 size={32} className="text-emerald-700" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-950">Sede da Empresa</h2>
                                <p className="text-slate-600 font-bold">Onde as decisões acontecem</p>
                            </div>

                            <form onSubmit={handleOnboardingComplete} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-900 ml-2">Nome da Unidade/Empresa</label>
                                    <div className="relative">
                                        <Building2 size={18} className="absolute left-6 top-5 text-slate-400" />
                                        <input
                                            id="company-name"
                                            name="companyName"
                                            type="text"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            className="w-full pl-14 pr-6 py-4 bg-white/50 border border-slate-300 rounded-2xl text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all font-medium"
                                            placeholder="Nome oficial da sede"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-900 ml-2">Localização/Endereço</label>
                                    <div className="relative">
                                        <MapPin size={18} className="absolute left-6 top-5 text-slate-400" />
                                        <input
                                            id="company-address"
                                            name="address"
                                            type="text"
                                            value={companyAddress}
                                            onChange={(e) => setCompanyAddress(e.target.value)}
                                            className="w-full pl-14 pr-6 py-4 bg-white/50 border border-slate-300 rounded-2xl text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 transition-all font-medium"
                                            placeholder="Cidade, Estado ou Morada Completa"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-emerald-500 text-black py-5 rounded-2xl font-black text-lg hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-xl shadow-emerald-900/10 flex items-center justify-center gap-3"
                                >
                                    {loading ? <Loader2 size={24} className="animate-spin text-black" /> : 'Concluir Registro'}
                                    {!loading && <Sparkles size={20} className="text-black" />}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {step === 'confirm' && (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass rounded-[2rem] shadow-2xl p-10 border border-slate-200 text-center"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4 mx-auto">
                                <Check size={28} className="text-emerald-700" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-950 mb-2">Quase lá!</h2>
                            <p className="text-slate-600 mb-6">{message || 'Verifique seu e-mail e confirme seu cadastro para acessar a plataforma.'}</p>

                            <button
                                onClick={() => { setStep('auth'); setIsLogin(true); }}
                                className="w-full bg-emerald-600 text-black py-4 rounded-2xl font-black text-lg hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-xl"
                            >
                                Voltar para Login
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-12 text-center text-slate-500 text-sm font-black tracking-wide"
                >
                    OFICE v2.0 • Sitema Inteligente de Gestão Florestal
                </motion.div>
            </div>
        </div>
    );
};
