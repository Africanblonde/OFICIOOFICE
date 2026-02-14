import React, { useState } from 'react';
import { Role } from '../types';
import createUserWithEdge from '../services/userService';
import { LOCATIONS } from '../constants';

const UserManagement: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.WORKER);
  const [locationId, setLocationId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Enviando...');

    const payload = {
      name,
      email,
      password,
      role: String(role),
      locationId: locationId || undefined,
      jobTitle: jobTitle || undefined
    };

    try {
      const res = await createUserWithEdge(payload as any);
      if (!res.success) {
        setStatus(`Erro: ${res.error}`);
        console.error('create-user error', res);
      } else {
        setStatus('Usuário criado com sucesso! ' + (res.data?.userId || ''));
        // clear form
        setName(''); setEmail(''); setPassword(''); setRole(Role.WORKER);
      }
    } catch (err: any) {
      setStatus(`Exception: ${err?.message || String(err)}`);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Gestão de Utilizadores (Debug)</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="um-name" className="block text-sm font-medium">Nome</label>
          <input id="um-name" placeholder="Nome completo" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border rounded p-2" />
        </div>
        <div>
          <label htmlFor="um-email" className="block text-sm font-medium">Email</label>
          <input id="um-email" placeholder="email@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full border rounded p-2" />
        </div>
        <div>
          <label htmlFor="um-password" className="block text-sm font-medium">Senha</label>
          <input id="um-password" type="password" placeholder="Senha (mín. 8 caracteres)" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full border rounded p-2" />
        </div>
        <div>
          <label htmlFor="um-role" className="block text-sm font-medium">Role</label>
          <select id="um-role" aria-label="Role do usuário" value={role} onChange={e => setRole(e.target.value as Role)} className="mt-1 block w-full border rounded p-2">
            <option value={Role.ADMIN}>ADMIN</option>
            <option value={Role.GENERAL_MANAGER}>GENERAL_MANAGER</option>
            <option value={Role.MANAGER}>MANAGER</option>
            <option value={Role.WORKER}>WORKER</option>
          </select>
        </div>

        <div>
          <label htmlFor="um-job" className="block text-sm font-medium">Cargo</label>
          <input id="um-job" placeholder="Cargo (ex.: Motosserrista)" value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="mt-1 block w-full border rounded p-2" />
        </div>

        <div>
          <label htmlFor="um-location" className="block text-sm font-medium">Local</label>
          <select id="um-location" value={locationId} onChange={e => setLocationId(e.target.value)} className="mt-1 block w-full border rounded p-2">
            <option value="">-- Selecionar --</option>
            {LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded">Criar Utilizador</button>
        </div>
      </form>

      {status && (
        <div className="mt-4 p-3 border rounded bg-gray-50">{status}</div>
      )}
    </div>
  );
};

export default UserManagement;
