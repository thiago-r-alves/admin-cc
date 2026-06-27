import React from 'react';
import { cn } from '../utils/cn';

type LoadingScreenProps = {
  title?: string;
  subtitle?: string;
  fullHeight?: boolean;
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  title = 'Sistema carregando...',
  subtitle = 'Estamos preparando os dados para você.',
  fullHeight = true,
}) => {
  return (
    <div className={cn('flex items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#fdf2f2_100%)] p-5', fullHeight ? 'min-h-screen' : 'min-h-[240px]')}>
      <div role="status" aria-live="polite" aria-busy="true" className="w-[min(420px,100%)] rounded-[10px] border border-red-200 bg-white px-[1.15rem] py-5 text-center shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
        <div aria-hidden="true" className="mx-auto mb-[0.9rem] h-[42px] w-[42px] animate-spin rounded-full border-4 border-red-100 border-t-brand motion-reduce:animate-none" />
        <h2 className="m-0 text-[clamp(1.05rem,2vw,1.28rem)] font-black text-gray-950">{title}</h2>
        <p className="m-0 mt-[0.45rem] text-[0.9rem] text-gray-500">{subtitle}</p>
        <div aria-hidden="true" className="mt-[0.8rem] inline-flex items-center gap-[0.35rem]">
          <span className="h-[7px] w-[7px] rounded-full bg-brand [animation:app-loading-pulse_1s_ease-in-out_infinite] motion-reduce:animate-none motion-reduce:opacity-80" />
          <span className="h-[7px] w-[7px] rounded-full bg-brand [animation:app-loading-pulse_1s_ease-in-out_infinite] [animation-delay:140ms] motion-reduce:animate-none motion-reduce:opacity-80" />
          <span className="h-[7px] w-[7px] rounded-full bg-brand [animation:app-loading-pulse_1s_ease-in-out_infinite] [animation-delay:280ms] motion-reduce:animate-none motion-reduce:opacity-80" />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
