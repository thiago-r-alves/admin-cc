import type { FormEvent } from 'react';
import type { ICity, IClient } from '../../interfaces';
import { CACAMBA_CONTENT_TYPES } from '../../interfaces';
import { getBillingDatePreset, type BillingDatePreset } from '../../pages/billing.helpers';
import { cn } from '../../utils/cn';
import { BillingIcon } from './BillingIcon';
import {
  ApplyFilterButton, CardSubtitle, ClearFilterButton, Field, FilterActions,
  FilterHeader, FiltersGrid, FilterTitle, Input, Label, SectionCard, Select,
} from './billing.styles';

type BillingFiltersPanelProps = {
  startDate: string;
  endDate: string;
  city: string;
  clientId: string;
  contentType: string;
  clients: IClient[];
  cities: ICity[];
  loading: boolean;
  loadingFilters: boolean;
  hasPendingChanges: boolean;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onClientIdChange: (value: string) => void;
  onContentTypeChange: (value: string) => void;
  onApplyFilters: (event: FormEvent<HTMLFormElement>) => void;
  onClearFilters: () => void;
};

const datePresets: { key: BillingDatePreset; label: string }[] = [
  { key: 'current-month', label: 'Este mês' },
  { key: 'previous-month', label: 'Mês anterior' },
  { key: 'last-three-months', label: 'Últimos 3 meses' },
  { key: 'current-year', label: 'Este ano' },
];

export const BillingFiltersPanel = ({
  startDate, endDate, city, clientId, contentType, clients, cities, loading,
  loadingFilters, hasPendingChanges, onStartDateChange, onEndDateChange,
  onCityChange, onClientIdChange, onContentTypeChange, onApplyFilters, onClearFilters,
}: BillingFiltersPanelProps) => {
  const selectPreset = (key: BillingDatePreset) => {
    const range = getBillingDatePreset(key);
    onStartDateChange(range.startDate);
    onEndDateChange(range.endDate);
  };

  return (
    <SectionCard>
      <FilterHeader>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-slate-400"><BillingIcon name="filter" /></span>
          <div>
            <FilterTitle>Recorte analítico</FilterTitle>
            <CardSubtitle>Escolha o período e refine a análise. Use Aplicar filtro para atualizar os indicadores.</CardSubtitle>
          </div>
        </div>
        {hasPendingChanges && <span className="rounded-ui-md bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">Alterações não aplicadas</span>}
      </FilterHeader>
      <form onSubmit={onApplyFilters} noValidate className="grid gap-5">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-4 max-[1200px]:grid-cols-1">
          <div className="grid min-w-0 grid-cols-2 gap-4 max-[380px]:grid-cols-1">
            <Field>
              <Label htmlFor="billing-start-date">Data inicial</Label>
              <Input id="billing-start-date" type="date" required value={startDate} onChange={(event) => onStartDateChange(event.target.value)} />
            </Field>
            <Field>
              <Label htmlFor="billing-end-date">Data final</Label>
              <Input id="billing-end-date" type="date" required value={endDate} onChange={(event) => onEndDateChange(event.target.value)} />
            </Field>
          </div>
          <div role="group" aria-label="Períodos rápidos" className="flex flex-wrap gap-2">
            {datePresets.map(({ key, label }) => {
              const range = getBillingDatePreset(key);
              const selected = range.startDate === startDate && range.endDate === endDate;
              return (
                <button key={key} type="button" aria-pressed={selected} onClick={() => selectPreset(key)} className={cn('min-h-11 rounded-ui-md border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-focus', selected ? 'border-brand-border bg-brand-soft text-brand' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50')}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <FiltersGrid>
          <Field>
            <Label htmlFor="billing-city">Cidade</Label>
            <Select id="billing-city" value={city} onChange={(event) => onCityChange(event.target.value)} disabled={loadingFilters}>
              <option value="">Todas</option>
              {cities.map((item) => <option key={item._id} value={item.name}>{item.name}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="billing-client">Cliente</Label>
            <Select id="billing-client" value={clientId} onChange={(event) => onClientIdChange(event.target.value)} disabled={loadingFilters}>
              <option value="">Todos</option>
              {clients.map((item) => <option key={item._id} value={item._id}>{item.clientName}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="billing-content-type">Tipo de conteúdo</Label>
            <Select id="billing-content-type" value={contentType} onChange={(event) => onContentTypeChange(event.target.value)}>
              <option value="">Todos</option>
              {CACAMBA_CONTENT_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </Field>
        </FiltersGrid>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <p className="m-0 text-xs leading-relaxed text-slate-500">{loadingFilters ? 'Carregando opções de filtros...' : 'Os indicadores mostram apenas os filtros aplicados.'}</p>
          <FilterActions>
            <ClearFilterButton type="button" disabled={loading} onClick={onClearFilters}>Limpar filtro</ClearFilterButton>
            <ApplyFilterButton type="submit" disabled={loading}><BillingIcon name="filter" className="h-4 w-4" />Aplicar filtro</ApplyFilterButton>
          </FilterActions>
        </div>
      </form>
    </SectionCard>
  );
};
