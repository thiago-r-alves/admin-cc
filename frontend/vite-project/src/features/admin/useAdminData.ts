import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { IDriver, IOrder } from '../../interfaces';
import { apiUrl, authFetch } from '../../services/api';

type OrdersSocket = {
  on(event: 'orders_updated', listener: () => void): void;
  off(event: 'orders_updated'): void;
  close(): void;
};

type UseAdminDataArgs = {
  onAuthError: () => void;
};

type UseAdminDataResult = {
  orders: IOrder[];
  setOrders: Dispatch<SetStateAction<IOrder[]>>;
  drivers: IDriver[];
  loading: boolean;
  error: string | null;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  fetchData: (options?: { background?: boolean }) => Promise<void>;
};

export const useAdminData = ({ onAuthError }: UseAdminDataArgs): UseAdminDataResult => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [drivers, setDrivers] = useState<IDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<OrdersSocket | null>(null);

  const authenticatedFetch = useCallback(
    (url: string, options?: RequestInit) =>
      authFetch(url, {
        ...options,
        onUnauthorized: onAuthError,
      }),
    [onAuthError],
  );

  const fetchData = useCallback(async (options?: { background?: boolean }) => {
    const isBackgroundRefresh = Boolean(options?.background);
    if (!isBackgroundRefresh) setLoading(true);
    setError(null);

    try {
      const [ordersResponse, driversResponse] = await Promise.all([
        authenticatedFetch(`${apiUrl}/orders`),
        authenticatedFetch(`${apiUrl}/drivers`),
      ]);

      const [ordersData, driversData] = await Promise.all([
        ordersResponse.json() as Promise<IOrder[]>,
        driversResponse.json() as Promise<IDriver[]>,
      ]);

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setDrivers(Array.isArray(driversData) ? driversData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao carregar os dados.');
    } finally {
      if (!isBackgroundRefresh) setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    let mounted = true;
    void fetchData();

    (async () => {
      try {
        const { io } = await import('socket.io-client');
        if (!mounted) return;

        socketRef.current = io(apiUrl);
        socketRef.current.on('orders_updated', () => {
          void fetchData({ background: true });
        });
      } catch (err) {
        console.error('Falha ao carregar socket.io-client dinamicamente', err);
      }
    })();

    return () => {
      mounted = false;
      try {
        if (socketRef.current) {
          socketRef.current.off('orders_updated');
          socketRef.current.close();
          socketRef.current = null;
        }
      } catch {
        // ignore cleanup errors
      }
    };
  }, [fetchData]);

  return {
    orders,
    setOrders,
    drivers,
    loading,
    error,
    authenticatedFetch,
    fetchData,
  };
};
