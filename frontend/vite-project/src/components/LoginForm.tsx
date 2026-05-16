import React from 'react';
import styled from 'styled-components';

const FormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 356px;
  background: #ffffff;
  border: 1px solid #fecaca;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
  position: relative;
  font-family: Arial, sans-serif;

  @media (max-width: 420px) {
    max-width: calc(100vw - 2rem);
  }
`;

const LogoPanel = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 96px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
`;

const Logo = styled.img`
  display: block;
  width: 128px;
  height: auto;
`;

const Form = styled.form`
  padding: 40px;

  @media (max-width: 420px) {
    padding: 34px 28px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.15rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
`;

const InputShell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 40px;
  padding: 0 0.75rem;
  border: 1px solid #c89d9d;
  border-radius: 0.25rem;
  background: #ffffff;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;

  &:focus-within {
    border-color: #e30613;
    box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.12);
  }
`;

const FieldIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  color: #4b5563;
`;

const PasswordToggle = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
  transition: color 0.18s ease, background 0.18s ease;

  &:hover {
    color: #e30613;
    background: #fff1f2;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(227, 6, 19, 0.18);
  }
`;

const Input = styled.input`
  width: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  color: #4b5563;
  font-family: inherit;
  font-size: 0.92rem;
  line-height: 1.25;

  &::placeholder {
    color: #6b7280;
    opacity: 1;
  }

  &:focus {
    outline: none;
  }
`;

const Button = styled.button`
  width: 100%;
  min-height: 46px;
  margin-top: 0.35rem;
  border: 0;
  border-radius: 0.25rem;
  background: #e30613;
  color: #ffffff;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.86rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow: 0 8px 14px rgba(227, 6, 19, 0.22);
  transition: background 0.18s ease, opacity 0.18s ease;

  &:hover {
    background: #c9000b;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.2), 0 8px 14px rgba(227, 6, 19, 0.22);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

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
    <FormWrapper>
      <LogoPanel>
        <Logo src="/logo-central-cacambas.webp" alt="Central Caçambas" />
      </LogoPanel>

      <Form onSubmit={onSubmit}>
        <FormGroup>
          <Label htmlFor="username">Usuário</Label>
          <InputShell>
            <FieldIcon>
              <UserIcon />
            </FieldIcon>
            <Input
              type="text"
              id="username"
              placeholder="Seu nome de usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </InputShell>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="password">Senha</Label>
          <InputShell>
            <FieldIcon>
              <LockIcon />
            </FieldIcon>
            <Input
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder="************"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <PasswordToggle
              type="button"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </PasswordToggle>
          </InputShell>
        </FormGroup>

        <Button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </Form>
    </FormWrapper>
  );
};

export default LoginForm;
