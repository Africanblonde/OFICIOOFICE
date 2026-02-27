import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2, Check, AlertCircle } from 'lucide-react';

interface SetupPageProps {
    onSetupComplete: () => void;
}

interface TestUser {
    email: string;
    password: string;
    role: string;
}

const TEST_USERS: TestUser[] = [
    { email: 'admin@example.com', password: 'admin123', role: 'ADMIN' },
    { email: 'manager@example.com', password: 'manager123', role: 'GENERAL_MANAGER' },
    { email: 'worker@example.com', password: 'worker123', role: 'WORKER' },
];

export const SetupPage: React.FC<SetupPageProps> = ({ onSetupComplete }) => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Array<{ email: string; success: boolean; message: string }>>([]);
    const [setupComplete, setSetupComplete] = useState(false);

    const handleSetupTestUsers = async () => {
        setLoading(true);
        setResults([]);

        const createdUsers = [];

        for (const user of TEST_USERS) {
            try {
                console.log(`⏳ Criando ${user.email}...`);

                const { data, error } = await supabase.auth.signUp({
                    email: user.email,
                    password: user.password,
                    options: {
                        data: {
                            name: user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1),
                            role: user.role
                        },
                        emailRedirectTo: window.location.origin
                    }
                });

                if (error) {
                    createdUsers.push({
                        email: user.email,
                        success: false,
                        message: error.message
                    });
                } else {
                    createdUsers.push({
                        email: user.email,
                        success: true,
                        message: `Usuário criado com ID: ${data.user?.id}`
                    });
                }
            } catch (err: any) {
                createdUsers.push({
                    email: user.email,
                    success: false,
                    message: err.message
                });
            }
        }

        setResults(createdUsers);
        const allSuccess = createdUsers.every(u => u.success);
        setSetupComplete(allSuccess);
        setLoading(false);

        if (allSuccess) {
            // Dar tempo para visualizar antes de redirecionar
            setTimeout(() => onSetupComplete(), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-4">
                        <span className="text-3xl">⚙️</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Configuração Inicial</h1>
                    <p className="text-gray-600 mt-2">OFICE - Sistema de Gestão Operacional</p>
                </div>

                {/* Setup Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {!setupComplete ? (
                        <>
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h2 className="font-semibold text-blue-900 mb-2">👥 Usuários de Teste</h2>
                                <p className="text-sm text-blue-800 mb-3">
                                    Será criada uma conta de teste para cada role disponível no sistema:
                                </p>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    {TEST_USERS.map(u => (
                                        <li key={u.email}>
                                            <span className="font-mono bg-blue-100 px-2 py-1 rounded">{u.email}</span>
                                            <span className="ml-2 text-blue-700">→ {u.role}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                onClick={handleSetupTestUsers}
                                disabled={loading}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Criando usuários...
                                    </>
                                ) : (
                                    '🚀 Criar Usuários de Teste'
                                )}
                            </button>

                            {results.length > 0 && (
                                <div className="mt-6 space-y-2">
                                    <h3 className="font-semibold text-gray-700 mb-3">📋 Resultados:</h3>
                                    {results.map((result, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            {result.success ? (
                                                <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                                            )}
                                            <div className="flex-1">
                                                <p className="font-mono text-sm text-gray-700">{result.email}</p>
                                                <p className={`text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                                                    {result.message}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                <Check size={32} className="text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">✨ Configuração Concluída!</h2>
                            <p className="text-gray-600 mb-6">Todos os usuários de teste foram criados com sucesso.</p>
                            <p className="text-sm text-gray-500">Redirecionando para o login...</p>
                        </div>
                    )}
                </div>

                {/* Info Footer */}
                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>OFICE - Sistema de Gestão Operacional Florestal</p>
                    <p className="mt-1">© 2025 - Todos os direitos reservados</p>
                </div>
            </div>
        </div>
    );
};
