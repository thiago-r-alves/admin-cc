import React from 'react';
import styled from 'styled-components';
import { uiTokens } from './tokens';

export interface FieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  error?: React.ReactNode;
  hint?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}

const Root = styled.div`
  min-width: 0;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.4rem;
  color: #4b5563;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.02em;
`;

const Hint = styled.small`
  display: block;
  margin-top: 0.35rem;
  color: ${uiTokens.color.textMuted};
  font-size: 0.75rem;
`;

const Error = styled.small`
  display: block;
  margin-top: 0.35rem;
  color: ${uiTokens.color.danger};
  font-size: 0.75rem;
  font-weight: 700;
`;

const Field: React.FC<FieldProps> = ({ label, htmlFor, error, hint, required, children }) => (
  <Root>
    {label ? (
      <Label htmlFor={htmlFor}>
        {label}
        {required ? ' *' : ''}
      </Label>
    ) : null}
    {children}
    {error ? <Error>{error}</Error> : hint ? <Hint>{hint}</Hint> : null}
  </Root>
);

export default Field;
