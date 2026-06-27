import styled from 'styled-components';

export const Page = styled.div`
  display: grid;
  gap: 1.25rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow-x: hidden;
`;

export const SectionCard = styled.section`
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid #f1d3d8;
  border-radius: 22px;
  padding: 1.2rem;
  background:
    linear-gradient(180deg, rgba(255, 245, 247, 0.7) 0%, rgba(255, 255, 255, 0.98) 100%),
    #ffffff;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);

  @media (max-width: 640px) {
    padding: 1rem;
  }
`;

export const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.85rem;
  align-items: end;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

export const Field = styled.div`
  min-width: 0;
`;

export const Label = styled.label`
  display: block;
  margin-bottom: 0.35rem;
  color: #6b7280;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const sharedFieldCss = `
  width: 100%;
  min-width: 0;
  min-height: 44px;
  box-sizing: border-box;
  padding: 0.68rem 0.78rem;
  border: 1px solid #f3c2ca;
  border-radius: 12px;
  background: #ffffff;
  color: #1f2937;
  font-size: 0.9rem;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;

  &:focus {
    outline: none;
    border-color: #e30613;
    box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.12);
    transform: translateY(-1px);
  }
`;

export const Input = styled.input`${sharedFieldCss}`;
export const Select = styled.select`${sharedFieldCss}`;

export const ApplyFilterButton = styled.button`
  width: 100%;
  min-height: 44px;
  border: 0;
  border-radius: 12px;
  background: #e30613;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.86rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: background 0.18s ease, transform 0.18s ease, opacity 0.18s ease;

  &:hover {
    background: #c9000b;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

export const ClearFilterButton = styled(ApplyFilterButton)`
  border: 1px solid #f3c2ca;
  background: #ffffff;
  color: #7f1d1d;

  &:hover {
    background: #fff7f8;
  }
`;

export const FilterActions = styled.div`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 180px));
  justify-content: start;
  gap: 0.65rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

export const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.9rem;
  min-width: 0;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

export const KpiCard = styled.div`
  position: relative;
  min-width: 0;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid #f5d5db;
  padding: 1rem;
  background: linear-gradient(180deg, #ffffff 0%, #fff8f8 100%);

  &::after {
    content: '';
    position: absolute;
    inset: auto -40px -40px auto;
    width: 120px;
    height: 120px;
    border-radius: 999px;
    background: rgba(227, 6, 19, 0.07);
  }
`;

export const KpiLabel = styled.span`
  display: block;
  color: #6b7280;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const KpiValue = styled.strong`
  display: block;
  margin-top: 0.6rem;
  color: #111827;
  font-size: clamp(1.45rem, 2vw, 2rem);
  line-height: 1.05;
  overflow-wrap: anywhere;
`;

export const KpiFootnote = styled.span`
  display: block;
  margin-top: 0.45rem;
  color: #7f1d1d;
  font-size: 0.82rem;
  font-weight: 700;
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  min-width: 0;

  > div {
    min-width: 0;
  }

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

export const CardTitle = styled.h3`
  margin: 0;
  color: #111827;
  font-size: 1.08rem;
  overflow-wrap: anywhere;
`;

export const CardSubtitle = styled.p`
  margin: 0.3rem 0 0;
  color: #6b7280;
  font-size: 0.88rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
`;

export const TrendChartWrap = styled.div`
  display: grid;
  gap: 0.9rem;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: hidden;
  contain: inline-size;
  -webkit-overflow-scrolling: touch;
`;

export const TrendChartSvg = styled.svg`
  display: block;
  width: auto;
  height: 280px;
  flex: 0 0 auto;
`;

export const TrendAxisLabel = styled.text`
  fill: #6b7280;
  font-size: 11px;
  font-weight: 700;
`;

export const LegendRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
  flex-wrap: wrap;
  min-width: 0;
`;

export const LegendPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid #f0c8cf;
  border-radius: 999px;
  color: #6b7280;
  font-size: 0.76rem;
  font-weight: 800;

  &::before {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: linear-gradient(180deg, #ef4444 0%, #b91c1c 100%);
  }
`;

export const InsightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

export const InsightCard = styled.div`
  min-width: 0;
  border: 1px solid #f2d6da;
  border-radius: 18px;
  padding: 1rem;
  background: #ffffff;
`;

export const InsightLabel = styled.span`
  display: block;
  color: #6b7280;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const InsightValue = styled.strong`
  display: block;
  margin-top: 0.55rem;
  color: #111827;
  font-size: 1.02rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
`;

export const TablesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  min-width: 0;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

export const TableCard = styled(SectionCard)`
  padding: 1rem;
`;

export const TableWrap = styled.div`
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  overflow: auto;
  contain: inline-size;
  -webkit-overflow-scrolling: touch;
`;

export const Table = styled.table`
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;

  th,
  td {
    padding: 0.8rem 0.3rem;
    border-bottom: 1px solid #f4e0e4;
    text-align: left;
    font-size: 0.88rem;
  }

  th {
    color: #6b7280;
    font-size: 0.73rem;
    font-weight: 900;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  td {
    color: #1f2937;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }
`;

export const EmptyState = styled.div`
  border: 1px dashed #efb2bb;
  border-radius: 16px;
  padding: 1.25rem;
  background: #fffafa;
  color: #6b7280;
`;

export const LoadingState = styled(EmptyState)`
  color: #7f1d1d;
`;

export const FilterHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  min-width: 0;

  > div {
    min-width: 0;
  }

  @media (max-width: 640px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

export const FilterTitle = styled.h3`
  margin: 0;
  color: #111827;
  font-size: 1rem;
`;

