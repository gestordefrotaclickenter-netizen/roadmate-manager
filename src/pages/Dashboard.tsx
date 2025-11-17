import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Car, Users, Wrench, Fuel, TrendingUp, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    vehicles: 0,
    drivers: 0,
    maintenances: 0,
    refuelings: 0,
    totalMaintenanceCost: 0,
    totalRefuelingCost: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [vehicles, drivers, maintenances, refuelings] = await Promise.all([
      supabase.from("vehicles").select("*", { count: "exact" }).eq("user_id", user.id),
      supabase.from("drivers").select("*", { count: "exact" }).eq("user_id", user.id),
      supabase.from("maintenances").select("cost").eq("user_id", user.id),
      supabase.from("refuelings").select("cost").eq("user_id", user.id),
    ]);

    const totalMaintenanceCost = maintenances.data?.reduce((sum, m) => sum + Number(m.cost), 0) || 0;
    const totalRefuelingCost = refuelings.data?.reduce((sum, r) => sum + Number(r.cost), 0) || 0;

    setStats({
      vehicles: vehicles.count || 0,
      drivers: drivers.count || 0,
      maintenances: maintenances.data?.length || 0,
      refuelings: refuelings.data?.length || 0,
      totalMaintenanceCost,
      totalRefuelingCost,
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua frota</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Veículos</CardTitle>
              <Car className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.vehicles}</div>
              <p className="text-xs text-muted-foreground">Veículos cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Motoristas</CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.drivers}</div>
              <p className="text-xs text-muted-foreground">Motoristas ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manutenções</CardTitle>
              <Wrench className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.maintenances}</div>
              <p className="text-xs text-muted-foreground">Manutenções registradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abastecimentos</CardTitle>
              <Fuel className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.refuelings}</div>
              <p className="text-xs text-muted-foreground">Abastecimentos registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custo Manutenções</CardTitle>
              <TrendingUp className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats.totalMaintenanceCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Total em manutenções</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custo Combustível</CardTitle>
              <Fuel className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats.totalRefuelingCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Total em combustível</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Bem-vindo ao Sistema de Gestão de Frotas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Use o menu lateral para navegar entre os módulos e gerenciar sua frota de forma eficiente.
              Cadastre veículos, motoristas, registre manutenções e abastecimentos, e acompanhe os relatórios financeiros.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
