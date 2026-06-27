import {
  AddButton,
  SearchIcon,
  SearchInput,
  SearchWrap,
  Toolbar,
} from './client.styles';

type ClientToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onAddClient: () => void;
};

export const ClientToolbar = ({ search, onSearchChange, onAddClient }: ClientToolbarProps) => (
  <Toolbar>
    <SearchWrap>
      <SearchIcon aria-hidden="true">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </SearchIcon>
      <SearchInput
        data-testid="clients-search-input"
        type="text"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Buscar cliente por nome, CNPJ/CPF, e-mail, RG/IE, endereço, bairro, cidade, CEP..."
      />
    </SearchWrap>

    <AddButton data-testid="clients-add-button" onClick={onAddClient}>
      + Adicionar Cliente
    </AddButton>
  </Toolbar>
);
