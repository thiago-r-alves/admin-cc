import React from 'react';
import styled from 'styled-components';
import type { ICacamba } from '../interfaces';

// Styled Components
const EmptyState = styled.div`
  color: #6b7280;
  text-align: center;
  padding: 1rem 0;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Title = styled.h3`
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CacambaCard = styled.div`
  background-color: #f9fafb;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
`;

const CardContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
`;

const InfoSection = styled.div`
  flex: 1;
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CacambaNumber = styled.span`
  font-weight: 500;
  color: #1f2937;
`;

const TypeBadge = styled.span<{ tipo: 'entrega' | 'retirada' }>`
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 9999px;
  background-color: ${props => props.tipo === 'entrega' ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.tipo === 'entrega' ? '#166534' : '#991b1b'};
`;

const DateInfo = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
`;

const ImageContainer = styled.div`
  margin-left: 0.75rem;
`;

const CacambaImage = styled.img`
  width: 4rem;
  height: 4rem;
  object-fit: cover;
  border-radius: 0.25rem;
  border: 1px solid #d1d5db;
`;

// Adicione estilos para os botões de ação
const ActionButton = styled.button<{ color?: string }>`
  background-color: ${({ color }) => color || '#3b82f6'};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.4rem 0.9rem;
  margin-right: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);

  &:hover {
    background-color: ${({ color }) => color === '#ef4444' ? '#b91c1c' : '#2563eb'};
  }
`;

const LocalInfo = styled.span`
  display: block;
  font-size: 0.85rem;
  color: #3730a3;
  margin-top: 0.2rem;
  margin-left: 0.1rem;
`;

interface CacambaListProps {
  cacambas: ICacamba[];
  onImageClick?: (url: string) => void;
  onEdit?: (cacamba: ICacamba) => void;
  onDelete?: (cacambaId: string) => void;
}

const CacambaList: React.FC<CacambaListProps> = ({ cacambas, onImageClick, onEdit, onDelete }) => {
  if (cacambas.length === 0) {
    return (
      <EmptyState>
        Nenhuma caçamba registrada ainda
      </EmptyState>
    );
  }
  const apiUrl = import.meta.env.VITE_API_URL;

  const buildImageUrl = (url?: string, w = 480, q = 70) => {
    if (!url) return '';
    const absolute = url.startsWith('http');
    const base = absolute ? url : `${apiUrl}${url}`;
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}w=${w}&q=${q}&f=webp`;
  };

  return (
    <Container>
      <Title>Caçambas Registradas:</Title>
      {cacambas.map((cacamba) => (
        <CacambaCard key={cacamba._id}>
          <CardContent>
            <InfoSection>
              <HeaderInfo>
                <CacambaNumber>
                  #{cacamba.numero}
                </CacambaNumber>
                <TypeBadge tipo={cacamba.tipo}>
                  {cacamba.tipo === 'entrega' ? 'Entrega' : 'Retirada'}
                </TypeBadge>
              </HeaderInfo>
              <DateInfo>
                Registrada em: {cacamba.createdAt 
                  ? new Date(cacamba.createdAt).toLocaleString('pt-BR')
                  : 'Data não disponível'
                }
              </DateInfo>

              {cacamba.local && (
                <LocalInfo>
                  <strong>Local:</strong>{' '}
                  {cacamba.local === 'via_publica'
                    ? 'Via pública'
                    : cacamba.local === 'canteiro_obra'
                      ? 'Canteiro de obra'
                      : cacamba.local}
                </LocalInfo>
              )}
              { cacamba.horaServicoDigitos && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#4b5563' }}>
                  <strong>Ordem de serviço:</strong> {
                    cacamba.horaServicoDigitos
                  }
                </div>
              )}
            </InfoSection>
            <ImageContainer>
              <CacambaImage
                src={buildImageUrl(cacamba.imageUrl, 480, 70)}
                alt="Foto da caçamba"
                onClick={() => onImageClick && cacamba.imageUrl && onImageClick(buildImageUrl(cacamba.imageUrl, 1200, 80))}
              />
            </ImageContainer>
          </CardContent>
          <div>
            {onEdit && (
              <ActionButton onClick={() => onEdit(cacamba)}>
                Editar
              </ActionButton>
            )}
            {onDelete && (
              <ActionButton color="#ef4444" onClick={() => onDelete(cacamba._id)}>
                Excluir
              </ActionButton>
            )}
          </div>
        </CacambaCard>
      ))}
    </Container>
  );
};

export default CacambaList;
