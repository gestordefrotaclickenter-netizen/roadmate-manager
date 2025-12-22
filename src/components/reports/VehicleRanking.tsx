import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Car, TrendingUp } from "lucide-react";

interface VehicleExpense {
  id: string;
  plate: string;
  brand: string;
  model: string;
  totalCost: number;
  maintenanceCost: number;
  refuelingCost: number;
  documentCost: number;
}

interface VehicleRankingProps {
  vehicles: VehicleExpense[];
}

export function VehicleRanking({ vehicles }: VehicleRankingProps) {
  const maxCost = Math.max(...vehicles.map(v => v.totalCost), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Ranking de Veículos por Gasto
        </CardTitle>
      </CardHeader>
      <CardContent>
        {vehicles.length > 0 ? (
          <div className="space-y-4">
            {vehicles.slice(0, 10).map((vehicle, index) => (
              <div key={vehicle.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}º
                    </span>
                    <div>
                      <p className="font-medium">{vehicle.plate}</p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.brand} {vehicle.model}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      R$ {vehicle.totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Man: R$ {vehicle.maintenanceCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | 
                      Comb: R$ {vehicle.refuelingCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | 
                      Doc: R$ {vehicle.documentCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <Progress value={(vehicle.totalCost / maxCost) * 100} className="h-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
            <p>Nenhum veículo com gastos registrados</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
