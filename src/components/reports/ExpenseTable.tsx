import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExpenseItem {
  id: string;
  date: string;
  type: "maintenance" | "refueling";
  description: string;
  vehicle: string;
  driver?: string;
  cost: number;
  liters?: number;
}

interface ExpenseTableProps {
  expenses: ExpenseItem[];
  onExportCSV: () => void;
}

export function ExpenseTable({ expenses, onExportCSV }: ExpenseTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhamento de Gastos
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onExportCSV} disabled={expenses.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {expenses.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead className="text-right">Litros</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {format(new Date(expense.date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={expense.type === "maintenance" ? "secondary" : "outline"}>
                        {expense.type === "maintenance" ? "Manutenção" : "Combustível"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {expense.description}
                    </TableCell>
                    <TableCell>{expense.vehicle}</TableCell>
                    <TableCell>{expense.driver || "-"}</TableCell>
                    <TableCell className="text-right">
                      {expense.liters ? `${expense.liters.toLocaleString("pt-BR")} L` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {expense.cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-50" />
            <p>Nenhum gasto encontrado para os filtros selecionados</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
