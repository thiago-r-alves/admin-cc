import React from 'react';
import styled from 'styled-components';
import { uiTokens } from './tokens';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

const Shell = styled.div<{ $invalid: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 43px;
  width: 100%;
  box-sizing: border-box;
  padding: 0 ${uiTokens.space.md};
  border: 1px solid ${({ $invalid }) => ($invalid ? uiTokens.color.danger : uiTokens.color.border)};
  border-radius: ${uiTokens.radius.sm};
  background: ${uiTokens.color.bg};
  transition: border-color ${uiTokens.transition.fast}, box-shadow ${uiTokens.transition.fast};

  &:focus-within {
    border-color: ${uiTokens.color.primary};
    box-shadow: 0 0 0 3px ${uiTokens.color.focusRing};
  }
`;

const InputEl = styled.input`
  width: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  color: ${uiTokens.color.text};
  font-size: 0.9rem;

  &::placeholder {
    color: #9ca3af;
    opacity: 1;
  }

  &:focus {
    outline: none;
  }
`;

const Adornment = styled.span`
  display: inline-flex;
  align-items: center;
  color: ${uiTokens.color.textMuted};
`;

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { invalid = false, startAdornment, endAdornment, ...props },
  ref
) {
  return (
    <Shell $invalid={invalid}>
      {startAdornment ? <Adornment>{startAdornment}</Adornment> : null}
      <InputEl ref={ref} {...props} />
      {endAdornment ? <Adornment>{endAdornment}</Adornment> : null}
    </Shell>
  );
});

export default TextInput;
