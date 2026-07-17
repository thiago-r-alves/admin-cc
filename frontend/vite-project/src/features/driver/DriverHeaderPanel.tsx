import {
  DriverHeader,
  HeaderActions,
  HeaderButton,
  HeaderText,
  NotificationError,
  NotificationStatus,
  PageTitle,
} from './driver.styles';
import { formatDriverName } from '../../utils/formatDriverName';

type DriverHeaderPanelProps = {
  role: string | null;
  driverName: string;
  isSubscribed: boolean;
  pushError: string | null;
  activeOrderCount: number;
  onSubscribe: () => void;
  onLogout: () => void;
};

const formatDriverTitle = (driverName: string) => {
  const formattedName = formatDriverName(driverName, '');
  return formattedName ? `Painel do ${formattedName}` : 'Painel do Motorista';
};

export const DriverHeaderPanel = ({
  role,
  driverName,
  isSubscribed,
  pushError,
  activeOrderCount,
  onSubscribe,
  onLogout,
}: DriverHeaderPanelProps) => (
  <DriverHeader>
    <HeaderText>
      <PageTitle>{formatDriverTitle(driverName)}</PageTitle>
      <p className="m-0 mt-1 text-base font-semibold text-gray-600">
        {activeOrderCount === 1 ? '1 pedido ativo' : `${activeOrderCount} pedidos ativos`}
      </p>
    </HeaderText>
    <HeaderActions>
      {role === 'motorista' && (
        <>
          {!isSubscribed ? (
            <HeaderButton type="button" $variant="quiet" onClick={onSubscribe} aria-label="Ativar notificações de novos pedidos">
              Ativar Notificações
            </HeaderButton>
          ) : (
            <NotificationStatus role="status">✓ Notificações ativas</NotificationStatus>
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
