import type { ReactNode } from 'react';
import {
  CardHeader,
  CardSubtitle,
  CardTitle,
  EmptyState,
  Table,
  TableCard,
  TableWrap,
} from './billing.styles';

type RankingTableProps = {
  title: string;
  subtitle: string;
  headers: string[];
  rows: Array<Array<ReactNode>>;
};

export const RankingTable = ({ title, subtitle, headers, rows }: RankingTableProps) => (
  <TableCard>
    <CardHeader>
      <div>
        <CardTitle>{title}</CardTitle>
        <CardSubtitle>{subtitle}</CardSubtitle>
      </div>
    </CardHeader>
    {rows.length ? (
      <TableWrap>
        <Table>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    ) : (
      <EmptyState>Nenhum dado disponível para este recorte.</EmptyState>
    )}
  </TableCard>
);
