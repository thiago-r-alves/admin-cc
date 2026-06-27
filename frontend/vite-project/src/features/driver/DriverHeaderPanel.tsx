import {
  DriverHeader,
  HeaderActions,
  HeaderButton,
  HeaderText,
  NotificationError,
  NotificationStatus,
  PageSubtitle,
  PageTitle,
} from './driver.styles';

type DriverHeaderPanelProps = {
  role: string | null;
  isSubscribed: boolean;
  pushError: string | null;
  onSubscribe: () => void;
  onLogout: () => void;
};

export const DriverHeaderPanel = ({
  role,
  isSubscribed,
  pushError,
  onSubscribe,
  onLogout,
}: DriverHeaderPanelProps) => (
  <DriverHeader>
    <HeaderText>
      <PageTitle>Painel do Motorista</PageTitle>
      <PageSubtitle>Acompanhe seus pedidos ativos e registre as caçambas em campo.</PageSubtitle>
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
