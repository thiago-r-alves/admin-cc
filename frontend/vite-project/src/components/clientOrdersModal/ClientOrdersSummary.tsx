import React from 'react';
import styled from 'styled-components';

const ReportSummary = styled.div`
  margin: 0 1.25rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #fffafa;
  color: #111827;
  font-size: 0.92rem;
  font-weight: 800;
`;

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface ClientOrdersSummaryProps {
  clientTotal: number;
  totalOrders: number;
  totalCacambas: number;
  closureMode: boolean;
  selectedCount: number;
}

const ClientOrdersSummary: React.FC<ClientOrdersSummaryProps> = ({
  clientTotal,
  totalOrders,
  totalCacambas,
  closureMode,
  selectedCount,
}) => (
  <ReportSummary>
    <div>Total do cliente (Retiradas): {formatCurrency(clientTotal)}</div>
    <div>Quantidade total de pedidos: {totalOrders}</div>
    <div>Quantidade total de caçambas: {totalCacambas}</div>
    {closureMode && <div>Caçambas selecionadas: {selectedCount}</div>}
  </ReportSummary>
);

export default ClientOrdersSummary;
