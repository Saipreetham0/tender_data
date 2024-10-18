// components/TenderTable.tsx
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"

  interface Tender {
    title: string;
    postedDate: string;
    closingDate: string;
    link: string;
  }

  interface TenderTableProps {
    tenders: Tender[];
  }

  export default function TenderTable({ tenders }: TenderTableProps) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tender Description</TableHead>
            <TableHead>Posted Date</TableHead>
            <TableHead>Closing Date</TableHead>
            <TableHead>Details & Documents</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenders.map((tender, index) => (
            <TableRow key={index}>
              <TableCell>{tender.title}</TableCell>
              <TableCell>{tender.postedDate}</TableCell>
              <TableCell>{tender.closingDate}</TableCell>
              <TableCell>
                {tender.link ? (
                  <a href={tender.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Detailed Notification
                  </a>
                ) : (
                  'N/A'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }