import styled from 'styled-components';

export const DriverContainer = styled.div`
  min-height: 100vh;
  background: #f5f6f8;
  color: #111827;
  font-family: Arial, sans-serif;
  padding: 1.5rem;

  @media (max-width: 640px) {
    padding: 1rem;
  }
`;

export const DriverShell = styled.div`
  width: min(1120px, 100%);
  margin: 0 auto;
`;

export const DriverHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.35rem 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);

  @media (max-width: 760px) {
    align-items: stretch;
    flex-direction: column;
    padding: 1.1rem;
  }
`;

export const HeaderText = styled.div`
  min-width: 0;
`;

export const PageTitle = styled.h1`
  margin: 0;
  color: #1f2937;
  font-size: clamp(1.45rem, 2.2vw, 2rem);
  font-weight: 900;
`;

export const PageSubtitle = styled.p`
  margin: 0.35rem 0 0;
  color: #6b7280;
  font-size: 0.9rem;
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: flex-end;

  @media (max-width: 760px) {
    justify-content: stretch;
  }
`;

export const HeaderButton = styled.button<{ $variant?: 'primary' | 'danger' | 'success' | 'quiet' }>`
  min-height: 40px;
  padding: 0.65rem 0.95rem;
  border: 1px solid ${({ $variant }) => {
    if ($variant === 'danger') return '#e30613';
    if ($variant === 'success') return '#e30613';
    return '#d8b4b4';
  }};
  border-radius: 4px;
  background: ${({ $variant }) => {
    if ($variant === 'danger') return '#e30613';
    if ($variant === 'success') return '#e30613';
    if ($variant === 'primary') return '#e30613';
    return '#ffffff';
  }};
  color: ${({ $variant }) => ($variant === 'danger' || $variant === 'success' || $variant === 'primary' ? '#ffffff' : '#6b1f1f')};
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    background: ${({ $variant }) => {
      if ($variant === 'success') return '#c9000b';
      if ($variant === 'quiet') return '#fff1f2';
      return '#c9000b';
    }};
    border-color: #e30613;
    color: ${({ $variant }) => ($variant === 'quiet' ? '#e30613' : '#ffffff')};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: 560px) {
    width: 100%;
  }
`;

export const NotificationStatus = styled.span`
  color: #15803d;
  font-size: 0.82rem;
  font-weight: 800;
`;

export const NotificationError = styled.div`
  width: 100%;
  color: #dc2626;
  font-size: 0.8rem;
  font-weight: 700;
`;

export const OrdersSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const OrdersSectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 900;

  &::before {
    content: '';
    width: 4px;
    height: 26px;
    border-radius: 999px;
    background: #e30613;
  }
`;

export const OrdersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
`;

export const EmptyState = styled.div`
  padding: 1.25rem;
  border: 1px dashed #fecaca;
  border-radius: 6px;
  background: #ffffff;
  color: #6b7280;
  font-size: 0.95rem;
`;

export const OrderCard = styled.article`
  overflow: hidden;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.04);
`;

export const OrderCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #fee2e2;
  background: #f8fafc;

  @media (max-width: 640px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.75rem;
  }
`;

export const OrderIdentifier = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  color: #e30613;
  font-size: 1.05rem;
  font-weight: 900;
`;

export const OrderNumber = styled.span`
  white-space: nowrap;
`;

export const OrderTypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0.4rem 0.65rem;
  border-radius: 4px;
  background: #23324a;
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.03em;
  text-transform: uppercase;
`;

export const OrderCardBody = styled.div`
  padding: 1.25rem;

  @media (max-width: 560px) {
    padding: 1rem;
  }
`;

export const ClientName = styled.h3`
  margin: 0 0 1rem;
  color: #111827;
  font-size: clamp(1.05rem, 2vw, 1.28rem);
  font-weight: 900;
  line-height: 1.25;
`;

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 0.95rem;
  margin-bottom: 1rem;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

export const InfoBlock = styled.div<{ $span?: number }>`
  min-width: 0;
  grid-column: span ${({ $span }) => $span || 1};
  padding: 0.85rem;
  border: 1px solid #f1d4d4;
  border-radius: 4px;
  background: #fffafa;

  @media (max-width: 860px) {
    grid-column: span 1;
  }
`;

export const InfoLabel = styled.div`
  margin-bottom: 0.35rem;
  color: #9ca3af;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

export const InfoValue = styled.div`
  color: #374151;
  font-size: 0.92rem;
  line-height: 1.45;
  word-break: break-word;
`;

export const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 1rem 0 0;

  @media (max-width: 560px) {
    flex-direction: column;
  }
`;

export const CacambaButton = styled(HeaderButton)``;

export const CacambaSection = styled.div`
  margin-top: 1.15rem;
  padding-top: 1.15rem;
  border-top: 1px solid #fee2e2;
`;

export const CacambaHeader = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;

  @media (max-width: 640px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

