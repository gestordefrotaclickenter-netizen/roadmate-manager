import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Fuel, DollarSign, Wrench, FileText } from "lucide-react";

interface FinancialData {
  totalMaintenances: number;
  totalRefuelings: number;
  totalDocuments: number;
  total: number;
  maintenanceCount: number;
  refuelingCount: number;
  documentCount: number;
  avgMaintenanceCost: number;
  avgRefuelingCost: number;
  totalLiters: number;
}

interface SummaryCardsProps {
  data: FinancialData;
  title: string;
  showAvg?: boolean;
}

export function SummaryCards({ data, title, showAvg = false }: SummaryCardsProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">{title}</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manutenções</CardTitle>
            <Wrench className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {data.totalMaintenances.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.maintenanceCount} registros
              {showAvg && data.maintenanceCount > 0 && (
                <span className="block mt-1">
                  Média: R$ {data.avgMaintenanceCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Combustível</CardTitle>
            <Fuel className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {data.totalRefuelings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.refuelingCount} abastecimentos
              {showAvg && data.refuelingCount > 0 && (
                <span className="block mt-1">
                  Média: R$ {data.avgRefuelingCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentação</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {data.totalDocuments.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.documentCount} documentos
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-muted-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Litros</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalLiters.toLocaleString("pt-BR", { minimumFractionDigits: 1 })} L
            </div>
            <p className="text-xs text-muted-foreground">
              {data.refuelingCount > 0 && (
                <>Preço médio: R$ {(data.totalRefuelings / data.totalLiters || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/L</>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {data.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma de todos os gastos
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
