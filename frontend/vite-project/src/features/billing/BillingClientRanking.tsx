import { useId, useMemo, useState } from 'react';
import type { IBillingSummaryResponse } from '../../interfaces';
import { formatCurrency } from '../../pages/billing.helpers';
import { BillingIcon } from './BillingIcon';
import { RankingTable } from './RankingTable';

type ClientSort = 'revenue' | 'ticket' | 'count' | 'name';

type BillingClientRankingProps = {
  clients: IBillingSummaryResponse['topClients'];
  totalRevenue: number;
};

const normalizeSearch = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();

export const BillingClientRanking = ({ clients, totalRevenue }: BillingClientRankingProps) => {
  const searchId = useId();
  const sortId = useId();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<ClientSort>('revenue');
  const filteredClients = useMemo(() => {
    const query = normalizeSearch(search);
    return clients
      .filter((client) => normalizeSearch(client.clientName).includes(query))
      .sort((a, b) => {
        const byName = a.clientName.localeCompare(b.clientName, 'pt-BR');
        if (sort === 'name') return byName;
        if (sort === 'ticket') return b.averageTicket - a.averageTicket || b.revenue - a.revenue || byName;
        if (sort === 'count') return b.cacambaCount - a.cacambaCount || b.revenue - a.revenue || byName;
        return b.revenue - a.revenue || b.cacambaCount - a.cacambaCount || byName;
      });
  }, [clients, search, sort]);

  return (
    <RankingTable
      title="Clientes com maior faturamento"
      subtitle="Receita, volume e participação de cada cliente no período."
      headers={['Cliente', 'Receita', 'Caçambas', 'Ticket médio', 'Participação']}
      rows={filteredClients.map((client) => [
        client.clientName,
        formatCurrency(client.revenue),
        client.cacambaCount,
        formatCurrency(client.averageTicket),
        `${(totalRevenue > 0 ? client.revenue / totalRevenue * 100 : 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`,
      ])}
      emptyMessage={search.trim() ? 'Nenhum cliente encontrado para esta busca.' : undefined}
      controls={(
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[160px] flex-1">
            <label htmlFor={searchId} className="sr-only">Buscar cliente no ranking</label>
            <div className="relative">
              <BillingIcon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id={searchId}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente..."
                className="min-h-11 w-full min-w-0 rounded-ui-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-focus"
              />
            </div>
          </div>
          <div className="w-[190px] max-[560px]:w-full">
            <label htmlFor={sortId} className="sr-only">Ordenar clientes por</label>
            <select
              id={sortId}
              value={sort}
              onChange={(event) => setSort(event.target.value as ClientSort)}
              className="min-h-11 w-full min-w-0 rounded-ui-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-focus"
            >
              <option value="revenue">Maior faturamento</option>
              <option value="ticket">Maior ticket médio</option>
              <option value="count">Mais caçambas</option>
              <option value="name">Nome (A–Z)</option>
            </select>
          </div>
        </div>
      )}
    />
  );
};
