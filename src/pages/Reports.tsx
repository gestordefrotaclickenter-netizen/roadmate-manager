import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
}

interface Driver {
  id: string;
  name: string;
}

interface FinancialData {
  totalMaintenances: number;
  totalRefuelings: number;
  total: number;
  maintenanceCount: number;
  refuelingCount: number;
}

export default function Reports() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [selectedDriver, setSelectedDriver] = useState<string>("all");
  const [generalData, setGeneralData] = useState<FinancialData>({
    totalMaintenances: 0,
    totalRefuelings: 0,
    total: 0,
    maintenanceCount: 0,
    refuelingCount: 0,
  });
  const [filteredData, setFilteredData] = useState<FinancialData>({
    totalMaintenances: 0,
    totalRefuelings: 0,
    total: 0,
    maintenanceCount: 0,
    refuelingCount: 0,
  });

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
    fetchGeneralData();
  }, []);

  useEffect(() => {
    fetchFilteredData();
  }, [selectedVehicle, selectedDriver]);

  const fetchVehicles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("vehicles")
      .select("id, plate, brand, model")
      .eq("user_id", user.id);

    if (data) setVehicles(data);
  };

  const fetchDrivers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("drivers")
      .select("id, name")
      .eq("user_id", user.id);

    if (data) setDrivers(data);
  };

  const fetchGeneralData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [maintenances, refuelings] = await Promise.all([
      supabase.from("maintenances").select("cost").eq("user_id", user.id),
      supabase.from("refuelings").select("cost").eq("user_id", user.id),
    ]);

    const totalMaintenances = maintenances.data?.reduce((sum, m) => sum + Number(m.cost), 0) || 0;
    const totalRefuelings = refuelings.data?.reduce((sum, r) => sum + Number(r.cost), 0) || 0;

    setGeneralData({
      totalMaintenances,
      totalRefuelings,
      total: totalMaintenances + totalRefuelings,
      maintenanceCount: maintenances.data?.length || 0,
      refuelingCount: refuelings.data?.length || 0,
    });
  };

  const fetchFilteredData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let maintenanceQuery = supabase
      .from("maintenances")
      .select("cost")
      .eq("user_id", user.id);

    let refuelingQuery = supabase
      .from("refuelings")
      .select("cost")
      .eq("user_id", user.id);

    if (selectedVehicle !== "all") {
      maintenanceQuery = maintenanceQuery.eq("vehicle_id", selectedVehicle);
      refuelingQuery = refuelingQuery.eq("vehicle_id", selectedVehicle);
    }

    if (selectedDriver !== "all") {
      refuelingQuery = refuelingQuery.eq("driver_id", selectedDriver);
    }

    const [maintenances, refuelings] = await Promise.all([
      maintenanceQuery,
      refuelingQuery,
    ]);

    const totalMaintenances = maintenances.data?.reduce((sum, m) => sum + Number(m.cost), 0) || 0;
    const totalRefuelings = refuelings.data?.reduce((sum, r) => sum + Number(r.cost), 0) || 0;

    setFilteredData({
      totalMaintenances,
      totalRefuelings,
      total: totalMaintenances + totalRefuelings,
      maintenanceCount: maintenances.data?.length || 0,
      refuelingCount: refuelings.data?.length || 0,
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">Acompanhe os custos gerais e individuais</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Relatório Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Manutenções</CardTitle>
                  <TrendingUp className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {generalData.totalMaintenances.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {generalData.maintenanceCount} manutenções registradas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Combustível</CardTitle>
                  <TrendingDown className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {generalData.totalRefuelings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {generalData.refuelingCount} abastecimentos registrados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {generalData.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Soma de todos os custos
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatório Individual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Filtrar por Veículo</Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os veículos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os veículos</SelectItem>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate} - {vehicle.brand} {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Filtrar por Motorista</Label>
                <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os motoristas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os motoristas</SelectItem>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Manutenções</CardTitle>
                  <TrendingUp className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {filteredData.totalMaintenances.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {filteredData.maintenanceCount} registros
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Combustível</CardTitle>
                  <TrendingDown className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {filteredData.totalRefuelings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {filteredData.refuelingCount} registros
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {filteredData.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Filtrado
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
