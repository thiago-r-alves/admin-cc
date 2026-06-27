import type { FormEvent } from 'react';
import type { ICity, IClient } from '../../interfaces';
import { CACAMBA_CONTENT_TYPES } from '../../interfaces';
import {
  ApplyFilterButton,
  CardSubtitle,
  ClearFilterButton,
  Field,
  FilterActions,
  FilterHeader,
  FiltersGrid,
  FilterTitle,
  Input,
  Label,
  SectionCard,
  Select,
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
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onClientIdChange: (value: string) => void;
  onContentTypeChange: (value: string) => void;
  onApplyFilters: (event: FormEvent<HTMLFormElement>) => void;
  onClearFilters: () => void;
};

export const BillingFiltersPanel = ({
  startDate,
  endDate,
  city,
  clientId,
  contentType,
  clients,
  cities,
  loading,
  loadingFilters,
  onStartDateChange,
  onEndDateChange,
  onCityChange,
  onClientIdChange,
  onContentTypeChange,
  onApplyFilters,
  onClearFilters,
}: BillingFiltersPanelProps) => (
  <SectionCard>
    <FilterHeader>
      <div>
        <FilterTitle>Recorte analítico</FilterTitle>
        <CardSubtitle>Escolha o período e os filtros que fazem sentido para validar sua operação.</CardSubtitle>
      </div>
    </FilterHeader>

    <FiltersGrid as="form" onSubmit={onApplyFilters}>
      <Field>
        <Label htmlFor="billing-start-date">Data inicial</Label>
        <Input
          id="billing-start-date"
          type="date"
          value={startDate}
          onChange={(event) => onStartDateChange(event.target.value)}
        />
      </Field>
      <Field>
        <Label htmlFor="billing-end-date">Data final</Label>
        <Input
          id="billing-end-date"
          type="date"
          value={endDate}
          onChange={(event) => onEndDateChange(event.target.value)}
        />
      </Field>
      <Field>
        <Label htmlFor="billing-city">Cidade</Label>
        <Select id="billing-city" value={city} onChange={(event) => onCityChange(event.target.value)} disabled={loadingFilters}>
          <option value="">Todas</option>
          {cities.map((item) => (
            <option key={item._id} value={item.name}>
              {item.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field>
        <Label htmlFor="billing-client">Cliente</Label>
        <Select id="billing-client" value={clientId} onChange={(event) => onClientIdChange(event.target.value)} disabled={loadingFilters}>
          <option value="">Todos</option>
          {clients.map((item) => (
            <option key={item._id} value={item._id}>
              {item.clientName}
            </option>
          ))}
        </Select>
      </Field>
      <Field>
        <Label htmlFor="billing-content-type">Tipo de conteúdo</Label>
        <Select
          id="billing-content-type"
          value={contentType}
          onChange={(event) => onContentTypeChange(event.target.value)}
        >
          <option value="">Todos</option>
          {CACAMBA_CONTENT_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </Field>
      <FilterActions>
        <ApplyFilterButton type="submit" disabled={loading}>
          Aplicar filtro
        </ApplyFilterButton>
        <ClearFilterButton type="button" disabled={loading} onClick={onClearFilters}>
          Limpar filtro
        </ClearFilterButton>
      </FilterActions>
    </FiltersGrid>
  </SectionCard>
);
