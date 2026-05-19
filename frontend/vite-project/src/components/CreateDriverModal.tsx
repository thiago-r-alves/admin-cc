import React, { useEffect, useState, type FormEvent } from 'react';
import styled from 'styled-components';
import type { IDriver } from '../interfaces';

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  background: rgba(17, 24, 39, 0.62);

  @media (max-width: 768px) {
    align-items: stretch;
    padding: 0;
  }
`;

const ModalContent = styled.div`
  width: min(560px, 94vw);
  max-height: min(90dvh, 720px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);

  @media (max-width: 768px) {
    width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex: 0 0 auto;
  padding: 1.15rem 1.5rem;
  border-bottom: 1px solid #fecaca;
  background: #ffffff;
`;

const Title = styled.h2`
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 900;
`;

const CloseButton = styled.button`
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font-size: 1.55rem;
  line-height: 1;
  transition: background 0.18s ease, color 0.18s ease;

  &:hover {
    background: #fff1f2;
    color: #e30613;
  }
`;

const Form = styled.form`
  min-height: 0;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
`;

const ModalBody = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 1.5rem;
  -webkit-overflow-scrolling: touch;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
`;

const Field = styled.div`
  min-width: 0;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.4rem;
  color: #4b5563;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.02em;
`;

const Input = styled.input`
  width: 100%;
  min-height: 43px;
  box-sizing: border-box;
  padding: 0.65rem 0.8rem;
  border: 1px solid #d1d5db;
  border-radius: 2px;
  background: #ffffff;
  color: #374151;
  font-size: 0.9rem;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #e30613;
    box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.12);
  }
`;

const FieldHint = styled.p`
  margin: 0.4rem 0 0;
  color: #6b7280;
  font-size: 0.75rem;
`;

const Feedback = styled.div<{ $tone: 'success' | 'error' }>`
  margin: 0 1.5rem;
  padding: 0.65rem 0.75rem;
  border-radius: 6px;
  border: 1px solid ${({ $tone }) => ($tone === 'success' ? '#86efac' : '#fecaca')};
  background: ${({ $tone }) => ($tone === 'success' ? '#f0fdf4' : '#fff1f2')};
  color: ${({ $tone }) => ($tone === 'success' ? '#166534' : '#b91c1c')};
  font-size: 0.85rem;
  font-weight: 800;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex: 0 0 auto;
  padding: 1rem 1.5rem;
  border-top: 1px solid #fecaca;
  background: #ffffff;

  @media (max-width: 560px) {
    flex-direction: column-reverse;
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  min-width: 150px;
  min-height: 42px;
  padding: 0.75rem 1rem;
  border: 1px solid ${({ $variant }) => ($variant === 'primary' ? '#e30613' : '#d8b4b4')};
  border-radius: 2px;
  background: ${({ $variant }) => ($variant === 'primary' ? '#e30613' : '#ffffff')};
  color: ${({ $variant }) => ($variant === 'primary' ? '#ffffff' : '#6b1f1f')};
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;

  &:hover {
    background: ${({ $variant }) => ($variant === 'primary' ? '#c9000b' : '#fff1f2')};
    border-color: #e30613;
    color: ${({ $variant }) => ($variant === 'primary' ? '#ffffff' : '#e30613')};
  }

  @media (max-width: 560px) {
    width: 100%;
  }
`;

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
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <Title>{editingDriver ? 'Editar Motorista' : 'Adicionar Motorista'}</Title>
          <CloseButton type="button" aria-label="Fechar modal" onClick={onClose}>
            ×
          </CloseButton>
        </ModalHeader>
        {feedback && <Feedback $tone={feedback.tone}>{feedback.message}</Feedback>}

        <Form onSubmit={handleSubmit}>
          <ModalBody>

            <FieldGrid>
              <Field>
                <Label htmlFor="driver-username">Usuário</Label>
                <Input
                  id="driver-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nome de usuário"
                  required
                />
              </Field>

              <Field>
                <Label htmlFor="driver-password">Senha</Label>
                <Input
                  id="driver-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingDriver ? 'Deixe vazio para manter a senha atual' : 'Senha de acesso'}
                  required={!editingDriver}
                />
                {editingDriver && <FieldHint>Deixe vazio para não alterar a senha.</FieldHint>}
              </Field>
            </FieldGrid>
          </ModalBody>

          <ModalFooter>
            <Button type="button" $variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" $variant="primary">
              {editingDriver ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CreateDriverModal;
