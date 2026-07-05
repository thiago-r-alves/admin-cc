import React, { useEffect, useState, type FormEvent } from 'react';
import type { IDriver } from '../interfaces';
import { cn } from '../utils/cn';

const inputClass =
  'box-border min-h-[43px] w-full rounded-ui-sm border border-gray-300 bg-white px-[0.8rem] py-[0.65rem] text-[0.9rem] text-gray-700 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand-focus';

interface CreateDriverModalProps {
  onClose: () => void;
  onDriverCreated: () => void;
  editingDriver: IDriver | null;
}

const CreateDriverModal: React.FC<CreateDriverModalProps> = ({ onClose, onDriverCreated, editingDriver }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (editingDriver) {
      setUsername(editingDriver.username);
      setPassword('');
      return;
    }

    setUsername('');
    setPassword('');
  }, [editingDriver]);

  const authenticatedFetch = async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    };

    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 || response.status === 403) {
      setFeedback({ tone: 'error', message: 'Acesso negado ou sessão inválida. Faça login novamente.' });
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      localStorage.removeItem('token_expires_at');
      window.location.href = '/';
      throw new Error('Authentication failed');
    }

    return response;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (editingDriver) {
      const updates: { username: string; password?: string } = { username };
      if (password) updates.password = password;

      try {
        const response = await authenticatedFetch(`${apiUrl}/drivers/${editingDriver._id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
        const data = await response.json();

        if (response.ok) {
          setFeedback({ tone: 'success', message: 'Motorista atualizado com sucesso.' });
          onDriverCreated();
          setTimeout(() => onClose(), 250);
        } else {
          setFeedback({ tone: 'error', message: data.message || 'Erro ao atualizar motorista.' });
        }
      } catch (err) {
        console.error(err);
        setFeedback({ tone: 'error', message: 'Erro ao atualizar motorista.' });
      }
      return;
    }

    try {
      const response = await authenticatedFetch(`${apiUrl}/drivers`, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (response.ok) {
        setFeedback({ tone: 'success', message: 'Motorista cadastrado com sucesso.' });
        onDriverCreated();
        setTimeout(() => onClose(), 250);
      } else {
        setFeedback({ tone: 'error', message: data.message || 'Erro ao cadastrar motorista.' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ tone: 'error', message: 'Erro ao cadastrar motorista.' });
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(17,24,39,0.62)] p-[max(16px,env(safe-area-inset-top))_max(16px,env(safe-area-inset-right))_max(16px,env(safe-area-inset-bottom))_max(16px,env(safe-area-inset-left))] max-[768px]:items-stretch max-[768px]:p-0">
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[min(90dvh,720px)] w-[min(560px,94vw)] flex-col overflow-hidden rounded-ui-lg border border-red-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.28)] max-[768px]:h-[100dvh] max-[768px]:max-h-[100dvh] max-[768px]:w-screen max-[768px]:rounded-none">
        <div className="flex flex-none items-center justify-between gap-4 border-b border-red-200 bg-white px-6 py-[1.15rem]">
          <h2 className="m-0 text-xl font-black text-gray-800">{editingDriver ? 'Editar Motorista' : 'Adicionar Motorista'}</h2>
          <button type="button" aria-label="Fechar modal" onClick={onClose} className="h-[34px] w-[34px] cursor-pointer rounded-ui-lg border-0 bg-transparent text-[1.55rem] leading-none text-gray-500 transition-colors duration-[180ms] hover:bg-brand-soft hover:text-brand">
            ×
          </button>
        </div>
        {feedback && (
          <div className={cn('mx-6 rounded-ui-lg border px-3 py-[0.65rem] text-[0.85rem] font-extrabold', feedback.tone === 'success' ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-200 bg-brand-soft text-red-700')}>
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-auto flex-col">
          <div className="flex-auto overflow-y-auto p-6 [-webkit-overflow-scrolling:touch]">

            <div className="grid grid-cols-1 gap-4">
              <div className="min-w-0">
                <label htmlFor="driver-username" className="mb-[0.4rem] block text-[0.72rem] font-black tracking-[0.02em] text-gray-600">Usuário</label>
                <input
                  id="driver-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nome de usuário"
                  required
                  className={inputClass}
                />
              </div>

              <div className="min-w-0">
                <label htmlFor="driver-password" className="mb-[0.4rem] block text-[0.72rem] font-black tracking-[0.02em] text-gray-600">Senha</label>
                <input
                  id="driver-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingDriver ? 'Deixe vazio para manter a senha atual' : 'Senha de acesso'}
                  required={!editingDriver}
                  className={inputClass}
                />
                {editingDriver && <p className="m-0 mt-[0.4rem] text-xs text-gray-500">Deixe vazio para não alterar a senha.</p>}
              </div>
            </div>
          </div>

          <div className="flex flex-none justify-end gap-3 border-t border-red-200 bg-white px-6 py-4 max-[560px]:flex-col-reverse">
            <button type="button" onClick={onClose} className="min-h-[42px] min-w-[150px] cursor-pointer rounded-ui-sm border border-brand-border bg-white px-4 py-3 text-[0.82rem] font-black uppercase tracking-[0.04em] text-[#6b1f1f] transition-colors duration-[180ms] hover:border-brand hover:bg-brand-soft hover:text-brand max-[560px]:w-full">
              Cancelar
            </button>
            <button type="submit" className="min-h-[42px] min-w-[150px] cursor-pointer rounded-ui-sm border border-brand bg-brand px-4 py-3 text-[0.82rem] font-black uppercase tracking-[0.04em] text-white transition-colors duration-[180ms] hover:border-brand hover:bg-brand-hover max-[560px]:w-full">
              {editingDriver ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDriverModal;
