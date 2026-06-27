import type { IDriver } from '../../../interfaces';
import { DriverEditIcon, DriverPersonIcon, DriverTrashIcon } from '../AdminIcons';
import {
  AddDriverButton,
  DriverActions,
  DriverActionButton,
  DriverAvatar,
  DriverInfo,
  DriverItem,
  DriverList,
  DriverName,
  DriverRole,
  DriversHeader,
  DriversPage,
  DriversTitle,
  EmptyState,
} from '../admin.styles';

type DriversTabProps = {
  drivers: IDriver[];
  onAddDriver: () => void;
  onEditDriver: (driver: IDriver) => void;
  onDeleteDriver: (driverId: string) => void;
};

export const DriversTab = ({
  drivers,
  onAddDriver,
  onEditDriver,
  onDeleteDriver,
}: DriversTabProps) => (
  <DriversPage>
    <DriversHeader>
      <DriversTitle>Gerenciar Motoristas</DriversTitle>
      <AddDriverButton type="button" onClick={onAddDriver}>
        + Adicionar Motorista
      </AddDriverButton>
    </DriversHeader>

    <DriverList>
      {drivers.length ? (
        drivers.map((driver) => (
          <DriverItem key={driver._id}>
            <DriverInfo>
              <DriverAvatar>
                <DriverPersonIcon />
              </DriverAvatar>
              <div>
                <DriverName>{driver.username}</DriverName>
                <DriverRole>Motorista</DriverRole>
              </div>
            </DriverInfo>

            <DriverActions>
              <DriverActionButton type="button" onClick={() => onEditDriver(driver)}>
                <DriverEditIcon />
                Editar
              </DriverActionButton>
              <DriverActionButton type="button" $variant="danger" onClick={() => onDeleteDriver(driver._id)}>
                <DriverTrashIcon />
                Excluir
              </DriverActionButton>
            </DriverActions>
          </DriverItem>
        ))
      ) : (
        <EmptyState>Nenhum motorista cadastrado.</EmptyState>
      )}
    </DriverList>
  </DriversPage>
);
