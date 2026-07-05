import {
  DriverHeader,
  HeaderActions,
  HeaderButton,
  HeaderText,
  NotificationError,
  NotificationStatus,
  PageTitle,
} from './driver.styles';

type DriverHeaderPanelProps = {
  role: string | null;
  driverName: string;
  isSubscribed: boolean;
  pushError: string | null;
  onSubscribe: () => void;
  onLogout: () => void;
};

const formatDriverTitle = (driverName: string) => {
  const trimmedName = driverName.trim();
  if (!trimmedName) return 'Painel do Motorista';
  return `Painel do ${trimmedName.charAt(0).toUpperCase()}${trimmedName.slice(1)}`;
};

export const DriverHeaderPanel = ({
  role,
  driverName,
  isSubscribed,
  pushError,
  onSubscribe,
  onLogout,
}: DriverHeaderPanelProps) => (
  <DriverHeader>
    <HeaderText>
      <PageTitle>{formatDriverTitle(driverName)}</PageTitle>
    </HeaderText>
    <HeaderActions>
      {role === 'motorista' && (
        <>
          {!isSubscribed ? (
            <HeaderButton type="button" $variant="quiet" onClick={onSubscribe}>
              Ativar Notificações
            </HeaderButton>
          ) : (
            <NotificationStatus>Notificações ativas</NotificationStatus>
          )}
          {pushError && <NotificationError>{pushError}</NotificationError>}
        </>
      )}
      <HeaderButton type="button" $variant="danger" onClick={onLogout}>
        Sair
      </HeaderButton>
    </HeaderActions>
  </DriverHeader>
);
