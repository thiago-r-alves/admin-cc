import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';

interface JwtPayload {
  userId: string;
  role: 'admin' | 'motorista';
  exp?: number;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;

  // Bootstrap da sessão (executa ao abrir / recarregar a página)
  useEffect(() => {
    const token  = localStorage.getItem('token');
    const expStr = localStorage.getItem('token_expires_at');
    if (!token || !expStr) return;

    const expMs = Number(expStr);
    if (Number.isNaN(expMs) || expMs <= Date.now()) {
      // expirado ou inválido
      clearSession();
      return;
    }

    // Token válido: redirecionar automaticamente
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if (decoded.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (decoded.role === 'motorista') {
        navigate('/motorista', { replace: true });
      }
    } catch {
      clearSession();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Logout automático quando expirar (verifica a cada 60s)
  useEffect(() => {
    const id = setInterval(() => {
      const expStr = localStorage.getItem('token_expires_at');
      if (expStr && Number(expStr) <= Date.now()) {
        clearSession();
        // Se o usuário estiver em rota protegida, pode redirecionar para /login
      }
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('token_expires_at');
  };

  // ÚNICA função de login
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const resp = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await resp.json();
      if (!resp.ok || !data.token) {
        setError(data.message || 'Falha no login.');
        setLoading(false);
        return;
      }

      // Persistência 30 dias
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem('token_expires_at', String(expiresAt));

      let decoded: JwtPayload | null = null;
      try {
        decoded = jwtDecode<JwtPayload>(data.token);
      } catch {
        setError('Token inválido.');
        clearSession();
        setLoading(false);
        return;
      }

      if (decoded.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (decoded.role === 'motorista') {
        navigate('/motorista', { replace: true });
      } else {
        setError('Papel inválido.');
        clearSession();
      }

    } catch {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <LoginForm
        username={username}
        password={password}
        setUsername={setUsername}
        setPassword={setPassword}
        onSubmit={handleSubmit}
        loading={loading}
      />
      {error && <p className="mt-4 text-center text-red-500">{error}</p>}
    </div>
  );
};

export default LoginPage;
