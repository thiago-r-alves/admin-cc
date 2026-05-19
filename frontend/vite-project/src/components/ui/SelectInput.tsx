import React from 'react';
import styled from 'styled-components';
import { uiTokens } from './tokens';

export interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

const SelectEl = styled.select<{ $invalid: boolean }>`
  width: 100%;
  min-height: 43px;
  box-sizing: border-box;
  padding: 0.65rem ${uiTokens.space.md};
  border: 1px solid ${({ $invalid }) => ($invalid ? uiTokens.color.danger : uiTokens.color.border)};
  border-radius: ${uiTokens.radius.sm};
  background: ${uiTokens.color.bg};
  color: ${uiTokens.color.text};
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: ${uiTokens.color.primary};
    box-shadow: 0 0 0 3px ${uiTokens.color.focusRing};
  }
`;

const SelectInput = React.forwardRef<HTMLSelectElement, SelectInputProps>(function SelectInput(
  { invalid = false, ...props },
  ref
) {
  return <SelectEl ref={ref} $invalid={invalid} {...props} />;
});

export default SelectInput;
