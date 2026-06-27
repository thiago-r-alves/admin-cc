import React from 'react';

export interface FieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  error?: React.ReactNode;
  hint?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, htmlFor, error, hint, required, children }) => (
  <div className="min-w-0">
    {label ? (
      <label htmlFor={htmlFor} className="mb-[0.4rem] block text-[0.72rem] font-black tracking-[0.02em] text-gray-600">
        {label}
        {required ? ' *' : ''}
      </label>
    ) : null}
    {children}
    {error ? (
      <small className="mt-[0.35rem] block text-xs font-bold text-red-600">{error}</small>
    ) : hint ? (
      <small className="mt-[0.35rem] block text-xs text-gray-500">{hint}</small>
    ) : null}
  </div>
);

export default Field;
