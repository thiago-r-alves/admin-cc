import React from 'react';

const UserIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const LockIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 15v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const EyeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M10.6 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.8 18.8 0 0 1-2.1 3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.4 6.4C3.6 8.3 2 12 2 12s3.5 7 10 7c1.6 0 3-.4 4.2-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.9 9.9A3 3 0 0 0 14.1 14.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export interface LoginFormProps {
  username: string;
  password: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  loading?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({
  username,
  password,
  setUsername,
  setPassword,
  onSubmit,
  loading = false,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="relative flex w-full max-w-[356px] flex-col overflow-hidden rounded-ui-lg border border-red-200 bg-white font-sans shadow-[0_18px_45px_rgba(15,23,42,0.12)] max-[420px]:max-w-[calc(100vw-2rem)]">
      <div className="flex min-h-24 items-center justify-center border-b border-gray-200 bg-gray-100">
        <img src="/logo-central-cacambas.webp" alt="Central Caçambas" className="block h-auto w-32" />
      </div>

      <form onSubmit={onSubmit} className="p-10 max-[420px]:px-7 max-[420px]:py-[34px]">
        <div className="mb-[1.15rem]">
          <label htmlFor="username" className="mb-2 block text-[0.72rem] font-black uppercase text-gray-700">
            Usuário
          </label>
          <div className="flex min-h-10 items-center gap-[0.55rem] rounded border border-[#c89d9d] bg-white px-3 transition-[border-color,box-shadow] duration-[180ms] focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand-focus">
            <span className="inline-flex flex-none items-center justify-center text-gray-600">
              <UserIcon />
            </span>
            <input
              type="text"
              id="username"
              placeholder="Seu nome de usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full min-w-0 border-0 bg-transparent text-[0.92rem] leading-tight text-gray-600 placeholder:text-gray-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mb-[1.15rem]">
          <label htmlFor="password" className="mb-2 block text-[0.72rem] font-black uppercase text-gray-700">
            Senha
          </label>
          <div className="flex min-h-10 items-center gap-[0.55rem] rounded border border-[#c89d9d] bg-white px-3 transition-[border-color,box-shadow] duration-[180ms] focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand-focus">
            <span className="inline-flex flex-none items-center justify-center text-gray-600">
              <LockIcon />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder="************"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full min-w-0 border-0 bg-transparent text-[0.92rem] leading-tight text-gray-600 placeholder:text-gray-500 focus:outline-none"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((current) => !current)}
              className="inline-flex h-7 w-7 flex-none cursor-pointer items-center justify-center rounded-ui-md border-0 bg-transparent p-0 text-gray-600 transition-colors duration-[180ms] hover:bg-brand-soft hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand-focus-strong"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-[0.35rem] min-h-[46px] w-full cursor-pointer rounded border-0 bg-brand text-[0.86rem] font-black uppercase tracking-[0.08em] text-white shadow-[0_8px_14px_rgba(227,6,19,0.22)] transition-[background,opacity] duration-[180ms] hover:bg-brand-hover focus:outline-none focus:ring-[3px] focus:ring-brand-focus-strong disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
