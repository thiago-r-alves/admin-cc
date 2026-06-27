import type { ClosurePaymentStatus } from './closure.types';
import {
  Field,
  Input,
  Label,
  SearchIcon,
  SearchInput,
  SearchWrap,
  Select,
  Toolbar,
} from './closure.styles';

type ClosureFiltersProps = {
  startDate: string;
  endDate: string;
  paymentStatus: ClosurePaymentStatus;
  search: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onPaymentStatusChange: (value: ClosurePaymentStatus) => void;
  onSearchChange: (value: string) => void;
};

export const ClosureFilters = ({
  startDate,
  endDate,
  paymentStatus,
  search,
  onStartDateChange,
  onEndDateChange,
  onPaymentStatusChange,
  onSearchChange,
}: ClosureFiltersProps) => (
  <Toolbar>
    <Field>
      <Label htmlFor="closure-start-date">Data Inicial</Label>
      <Input
        id="closure-start-date"
        type="date"
        value={startDate}
        onChange={(event) => onStartDateChange(event.target.value)}
      />
    </Field>
    <Field>
      <Label htmlFor="closure-end-date">Data Final</Label>
      <Input
        id="closure-end-date"
        type="date"
        value={endDate}
        onChange={(event) => onEndDateChange(event.target.value)}
      />
    </Field>
    <Field>
      <Label htmlFor="closure-payment-status">Pagamento</Label>
      <Select
        id="closure-payment-status"
        value={paymentStatus}
        onChange={(event) => onPaymentStatusChange(event.target.value as ClosurePaymentStatus)}
      >
        <option value="all">Todas</option>
        <option value="pending">Pendentes</option>
        <option value="metadata_pending">Informações pendentes</option>
        <option value="invoice_pending">NF pendente</option>
        <option value="pix_pending">Pix pendente</option>
        <option value="paid">Pagas</option>
      </Select>
    </Field>
    <SearchWrap>
      <Label htmlFor="closure-search">Buscar Cliente</Label>
      <SearchIcon aria-hidden="true">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </SearchIcon>
      <SearchInput
        id="closure-search"
        type="text"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Buscar por nome, CNPJ/CPF, endereco, bairro, cidade, CEP..."
      />
    </SearchWrap>
  </Toolbar>
);
