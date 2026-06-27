import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
`;

export const Title = styled.h2`
  margin: 0;
  color: #1f2937;
  font-size: clamp(1.45rem, 2vw, 2rem);
  line-height: 1.15;
`;

export const Toolbar = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.8rem;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const SearchWrap = styled.div`
  position: relative;
  flex: 1 1 auto;
  min-width: 260px;
  padding-top: 1.3rem;

  @media (max-width: 720px) {
    width: 100%;
    min-width: 0;
    padding-top: 0;
  }
`;

export const SearchIcon = styled.span`
  position: absolute;
  left: 0.9rem;
  top: calc(50% + 0.65rem);
  transform: translateY(-50%);
  display: inline-flex;
  color: #9ca3af;
  pointer-events: none;

  @media (max-width: 720px) {
    top: 50%;
  }
`;

export const SearchInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 0.82rem 0.9rem 0.82rem 2.45rem;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #ffffff;
  color: #374151;
  font-size: 0.92rem;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #e30613;
    box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.12);
  }
`;

export const AddButton = styled.button`
  flex: 0 0 auto;
  min-height: 43px;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 4px;
  background: #e30613;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 900;
  text-transform: uppercase;
  white-space: nowrap;
  box-shadow: 0 8px 16px rgba(227, 6, 19, 0.18);

  &:hover {
    background: #c9000b;
  }

  @media (max-width: 720px) {
    width: 100%;
  }
`;

