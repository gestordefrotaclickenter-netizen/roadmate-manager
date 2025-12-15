import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { User, TrendingUp } from "lucide-react";

interface DriverExpense {
  id: string;
  name: string;
  totalCost: number;
  refuelingCount: number;
  totalLiters: number;
}

interface DriverRankingProps {
  drivers: DriverExpense[];
}

export function DriverRanking({ drivers }: DriverRankingProps) {
  const maxCost = Math.max(...drivers.map(d => d.totalCost), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Ranking de Motoristas por Gasto
        </CardTitle>
      </CardHeader>
      <CardContent>
        {drivers.length > 0 ? (
          <div className="space-y-4">
            {drivers.slice(0, 10).map((driver, index) => (
              <div key={driver.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}º
                    </span>
                    <div>
                      <p className="font-medium">{driver.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {driver.refuelingCount} abastecimentos | {driver.totalLiters.toLocaleString("pt-BR", { minimumFractionDigits: 1 })} L
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      R$ {driver.totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <Progress value={(driver.totalCost / maxCost) * 100} className="h-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
            <p>Nenhum motorista com gastos registrados</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
