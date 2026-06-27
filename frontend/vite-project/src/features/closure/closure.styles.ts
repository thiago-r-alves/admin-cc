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

  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

export const Title = styled.h2`
  margin: 0;
  color: #1f2937;
  font-size: clamp(1.45rem, 2vw, 2rem);
  line-height: 1.15;
`;

export const Subtitle = styled.p`
  margin: 0.35rem 0 0;
  color: #6b7280;
  font-size: 0.9rem;
`;

export const Toolbar = styled.div`
  display: grid;
  grid-template-columns: 160px 160px 180px minmax(240px, 1fr);
  gap: 0.8rem;
  align-items: end;

  @media (max-width: 980px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const Field = styled.div`
  min-width: 0;
`;

export const Label = styled.label`
  display: block;
  margin-bottom: 0.3rem;
  color: #6b7280;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

export const Input = styled.input`
  width: 100%;
  min-height: 43px;
  box-sizing: border-box;
  padding: 0.58rem 0.65rem;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #ffffff;
  color: #374151;
  font-size: 0.88rem;

  &:focus {
    outline: none;
    border-color: #e30613;
    box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.12);
  }
`;

export const Select = styled.select`
  width: 100%;
  min-height: 43px;
  box-sizing: border-box;
  padding: 0.58rem 0.65rem;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #ffffff;
  color: #374151;
  font-size: 0.88rem;

  &:focus {
    outline: none;
    border-color: #e30613;
    box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.12);
  }
`;

export const SearchWrap = styled.div`
  position: relative;
`;

export const SearchIcon = styled.span`
  position: absolute;
  left: 0.9rem;
  top: calc(50% + 0.65rem);
  transform: translateY(-50%);
  display: inline-flex;
  color: #9ca3af;
  pointer-events: none;
`;

export const SearchInput = styled(Input)`
  padding-left: 2.45rem;
`;


export const ClientsWrap = styled.div`
  width: 100%;
  overflow: hidden;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #ffffff;
`;

export const ClientRow = styled.div`
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1.1rem;
  border-bottom: 1px solid #fee2e2;
  background: #ffffff;
  text-align: left;

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    background: #fffafa;
  }

  @media (max-width: 980px) {
    align-items: stretch;
    flex-direction: column;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const ClientInfo = styled.div`
  min-width: 0;
  flex: 1 1 340px;
`;

export const ClientName = styled.span`
  display: block;
  color: #1f2937;
  font-size: 1rem;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.3;
  word-break: break-word;
`;

export const ActionButtons = styled.div`
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 0.7rem;
  flex-wrap: wrap;
  flex: 0 0 auto;
  min-width: min(100%, 420px);

  @media (max-width: 980px) {
    width: 100%;
    min-width: 0;
    justify-content: flex-start;
  }
`;

export const ClientActionButton = styled.button`
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0.6rem 0.95rem;
  border: 1px solid #d8b4b4;
  border-radius: 4px;
  color: #6b1f1f;
  font-size: 0.76rem;
  font-weight: 900;
  text-transform: uppercase;
  background: #ffffff;
  cursor: pointer;
  flex: 0 0 auto;
  max-width: 100%;
  line-height: 1.2;
  text-align: center;

  &:hover {
    border-color: #e30613;
    color: #991b1b;
    background: #fff1f2;
  }

  @media (max-width: 640px) {
    width: 100%;
  }
`;

export const EmptyState = styled.div`
  padding: 1.2rem;
  border: 1px dashed #fecaca;
  border-radius: 8px;
  background: #fffafa;
  color: #6b7280;
`;

