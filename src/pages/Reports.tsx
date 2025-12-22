import { useEffect, useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { SummaryCards } from "@/components/reports/SummaryCards";
import { ExpenseChart } from "@/components/reports/ExpenseChart";
import { ExpenseTable } from "@/components/reports/ExpenseTable";
import { VehicleRanking } from "@/components/reports/VehicleRanking";
import { DriverRanking } from "@/components/reports/DriverRanking";
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

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

interface Maintenance {
  id: string;
  cost: number;
  maintenance_date: string;
  maintenance_type: string;
  vehicle_id: string;
  description: string | null;
}

interface Refueling {
  id: string;
  cost: number;
  refuel_date: string;
  vehicle_id: string;
  driver_id: string | null;
  liters: number;
  fuel_type: string;
}

interface VehicleDocument {
  id: string;
  cost: number | null;
  paid_date: string | null;
  due_date: string | null;
  document_type: string;
  vehicle_id: string;
  title: string;
  status: string;
}

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

interface ExpenseItem {
  id: string;
  date: string;
  type: "maintenance" | "refueling" | "document";
  description: string;
  vehicle: string;
  driver?: string;
  cost: number;
  liters?: number;
}

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

interface DriverExpense {
  id: string;
  name: string;
  totalCost: number;
  refuelingCount: number;
  totalLiters: number;
}

interface MonthlyData {
  month: string;
  maintenances: number;
  refuelings: number;
  documents: number;
}

export default function Reports() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [refuelings, setRefuelings] = useState<Refueling[]>([]);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [selectedDriver, setSelectedDriver] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [vehiclesRes, driversRes, maintenancesRes, refuelingsRes, documentsRes] = await Promise.all([
      supabase.from("vehicles").select("id, plate, brand, model").eq("user_id", user.id),
      supabase.from("drivers").select("id, name").eq("user_id", user.id),
      supabase.from("maintenances").select("*").eq("user_id", user.id),
      supabase.from("refuelings").select("*").eq("user_id", user.id),
      supabase.from("vehicle_documents").select("*").eq("user_id", user.id),
    ]);

    if (vehiclesRes.data) setVehicles(vehiclesRes.data);
    if (driversRes.data) setDrivers(driversRes.data);
    if (maintenancesRes.data) setMaintenances(maintenancesRes.data);
    if (refuelingsRes.data) setRefuelings(refuelingsRes.data);
    if (documentsRes.data) setDocuments(documentsRes.data);
    setLoading(false);
  };

  const clearFilters = () => {
    setSelectedVehicle("all");
    setSelectedDriver("all");
    setStartDate("");
    setEndDate("");
  };

  const filteredMaintenances = useMemo(() => {
    return maintenances.filter((m) => {
      if (selectedVehicle !== "all" && m.vehicle_id !== selectedVehicle) return false;
      if (startDate && m.maintenance_date < startDate) return false;
      if (endDate && m.maintenance_date > endDate) return false;
      return true;
    });
  }, [maintenances, selectedVehicle, startDate, endDate]);

  const filteredRefuelings = useMemo(() => {
    return refuelings.filter((r) => {
      if (selectedVehicle !== "all" && r.vehicle_id !== selectedVehicle) return false;
      if (selectedDriver !== "all" && r.driver_id !== selectedDriver) return false;
      if (startDate && r.refuel_date < startDate) return false;
      if (endDate && r.refuel_date > endDate) return false;
      return true;
    });
  }, [refuelings, selectedVehicle, selectedDriver, startDate, endDate]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((d) => {
      if (selectedVehicle !== "all" && d.vehicle_id !== selectedVehicle) return false;
      const docDate = d.paid_date || d.due_date;
      if (startDate && docDate && docDate < startDate) return false;
      if (endDate && docDate && docDate > endDate) return false;
      return d.cost && d.cost > 0;
    });
  }, [documents, selectedVehicle, startDate, endDate]);

  const paidDocuments = useMemo(() => {
    return documents.filter((d) => d.cost && d.cost > 0);
  }, [documents]);

  const generalData: FinancialData = useMemo(() => {
    const totalMaintenances = maintenances.reduce((sum, m) => sum + Number(m.cost), 0);
    const totalRefuelings = refuelings.reduce((sum, r) => sum + Number(r.cost), 0);
    const totalDocuments = paidDocuments.reduce((sum, d) => sum + Number(d.cost || 0), 0);
    const totalLiters = refuelings.reduce((sum, r) => sum + Number(r.liters), 0);
    return {
      totalMaintenances,
      totalRefuelings,
      totalDocuments,
      total: totalMaintenances + totalRefuelings + totalDocuments,
      maintenanceCount: maintenances.length,
      refuelingCount: refuelings.length,
      documentCount: paidDocuments.length,
      avgMaintenanceCost: maintenances.length > 0 ? totalMaintenances / maintenances.length : 0,
      avgRefuelingCost: refuelings.length > 0 ? totalRefuelings / refuelings.length : 0,
      totalLiters,
    };
  }, [maintenances, refuelings, paidDocuments]);

  const filteredData: FinancialData = useMemo(() => {
    const totalMaintenances = filteredMaintenances.reduce((sum, m) => sum + Number(m.cost), 0);
    const totalRefuelings = filteredRefuelings.reduce((sum, r) => sum + Number(r.cost), 0);
    const totalDocuments = filteredDocuments.reduce((sum, d) => sum + Number(d.cost || 0), 0);
    const totalLiters = filteredRefuelings.reduce((sum, r) => sum + Number(r.liters), 0);
    return {
      totalMaintenances,
      totalRefuelings,
      totalDocuments,
      total: totalMaintenances + totalRefuelings + totalDocuments,
      maintenanceCount: filteredMaintenances.length,
      refuelingCount: filteredRefuelings.length,
      documentCount: filteredDocuments.length,
      avgMaintenanceCost: filteredMaintenances.length > 0 ? totalMaintenances / filteredMaintenances.length : 0,
      avgRefuelingCost: filteredRefuelings.length > 0 ? totalRefuelings / filteredRefuelings.length : 0,
      totalLiters,
    };
  }, [filteredMaintenances, filteredRefuelings, filteredDocuments]);

  const monthlyData: MonthlyData[] = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
        label: format(date, "MMM/yy", { locale: ptBR }),
      };
    });

    return last6Months.map(({ start, end, label }) => {
      const monthMaintenances = filteredMaintenances.filter((m) => {
        const date = parseISO(m.maintenance_date);
        return date >= start && date <= end;
      });
      const monthRefuelings = filteredRefuelings.filter((r) => {
        const date = parseISO(r.refuel_date);
        return date >= start && date <= end;
      });
      const monthDocuments = filteredDocuments.filter((d) => {
        const docDate = d.paid_date || d.due_date;
        if (!docDate) return false;
        const date = parseISO(docDate);
        return date >= start && date <= end;
      });

      return {
        month: label,
        maintenances: monthMaintenances.reduce((sum, m) => sum + Number(m.cost), 0),
        refuelings: monthRefuelings.reduce((sum, r) => sum + Number(r.cost), 0),
        documents: monthDocuments.reduce((sum, d) => sum + Number(d.cost || 0), 0),
      };
    });
  }, [filteredMaintenances, filteredRefuelings, filteredDocuments]);

  const documentTypeLabels: Record<string, string> = {
    ipva: "IPVA / Licenciamento",
    licenciamento: "IPVA / Licenciamento",
    multa: "Multa",
    seguro: "Seguro",
    dpvat: "DPVAT",
    vistoria: "Vistoria",
    outros: "Outros",
  };

  const expenses: ExpenseItem[] = useMemo(() => {
    const vehicleMap = new Map(vehicles.map((v) => [v.id, `${v.plate} - ${v.brand} ${v.model}`]));
    const driverMap = new Map(drivers.map((d) => [d.id, d.name]));

    const maintenanceItems: ExpenseItem[] = filteredMaintenances.map((m) => ({
      id: m.id,
      date: m.maintenance_date,
      type: "maintenance" as const,
      description: m.maintenance_type + (m.description ? ` - ${m.description}` : ""),
      vehicle: vehicleMap.get(m.vehicle_id) || "Desconhecido",
      cost: Number(m.cost),
    }));

    const refuelingItems: ExpenseItem[] = filteredRefuelings.map((r) => ({
      id: r.id,
      date: r.refuel_date,
      type: "refueling" as const,
      description: r.fuel_type,
      vehicle: vehicleMap.get(r.vehicle_id) || "Desconhecido",
      driver: r.driver_id ? driverMap.get(r.driver_id) : undefined,
      cost: Number(r.cost),
      liters: Number(r.liters),
    }));

    const documentItems: ExpenseItem[] = filteredDocuments.map((d) => ({
      id: d.id,
      date: d.paid_date || d.due_date || "",
      type: "document" as const,
      description: `${documentTypeLabels[d.document_type] || d.document_type} - ${d.title}`,
      vehicle: vehicleMap.get(d.vehicle_id) || "Desconhecido",
      cost: Number(d.cost || 0),
    }));

    return [...maintenanceItems, ...refuelingItems, ...documentItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredMaintenances, filteredRefuelings, filteredDocuments, vehicles, drivers]);

  const vehicleRanking: VehicleExpense[] = useMemo(() => {
    const expenseByVehicle = new Map<string, { maintenance: number; refueling: number; document: number }>();

    filteredMaintenances.forEach((m) => {
      const current = expenseByVehicle.get(m.vehicle_id) || { maintenance: 0, refueling: 0, document: 0 };
      current.maintenance += Number(m.cost);
      expenseByVehicle.set(m.vehicle_id, current);
    });

    filteredRefuelings.forEach((r) => {
      const current = expenseByVehicle.get(r.vehicle_id) || { maintenance: 0, refueling: 0, document: 0 };
      current.refueling += Number(r.cost);
      expenseByVehicle.set(r.vehicle_id, current);
    });

    filteredDocuments.forEach((d) => {
      const current = expenseByVehicle.get(d.vehicle_id) || { maintenance: 0, refueling: 0, document: 0 };
      current.document += Number(d.cost || 0);
      expenseByVehicle.set(d.vehicle_id, current);
    });

    return vehicles
      .map((v) => {
        const expenses = expenseByVehicle.get(v.id) || { maintenance: 0, refueling: 0, document: 0 };
        return {
          id: v.id,
          plate: v.plate,
          brand: v.brand,
          model: v.model,
          totalCost: expenses.maintenance + expenses.refueling + expenses.document,
          maintenanceCost: expenses.maintenance,
          refuelingCost: expenses.refueling,
          documentCost: expenses.document,
        };
      })
      .filter((v) => v.totalCost > 0)
      .sort((a, b) => b.totalCost - a.totalCost);
  }, [filteredMaintenances, filteredRefuelings, filteredDocuments, vehicles]);

  const driverRanking: DriverExpense[] = useMemo(() => {
    const expenseByDriver = new Map<string, { cost: number; count: number; liters: number }>();

    filteredRefuelings.forEach((r) => {
      if (r.driver_id) {
        const current = expenseByDriver.get(r.driver_id) || { cost: 0, count: 0, liters: 0 };
        current.cost += Number(r.cost);
        current.count += 1;
        current.liters += Number(r.liters);
        expenseByDriver.set(r.driver_id, current);
      }
    });

    return drivers
      .map((d) => {
        const expenses = expenseByDriver.get(d.id) || { cost: 0, count: 0, liters: 0 };
        return {
          id: d.id,
          name: d.name,
          totalCost: expenses.cost,
          refuelingCount: expenses.count,
          totalLiters: expenses.liters,
        };
      })
      .filter((d) => d.totalCost > 0)
      .sort((a, b) => b.totalCost - a.totalCost);
  }, [filteredRefuelings, drivers]);

  const exportToCSV = () => {
    if (expenses.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }

    const headers = ["Data", "Tipo", "Descrição", "Veículo", "Motorista", "Litros", "Valor"];
    const rows = expenses.map((e) => [
      format(new Date(e.date), "dd/MM/yyyy"),
      e.type === "maintenance" ? "Manutenção" : "Combustível",
      e.description,
      e.vehicle,
      e.driver || "-",
      e.liters?.toString() || "-",
      e.cost.toFixed(2).replace(".", ","),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-financeiro-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("Relatório exportado com sucesso!");
  };

  const hasFilters = selectedVehicle !== "all" || selectedDriver !== "all" || startDate || endDate;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">Análise detalhada de custos gerais e individuais</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2">
            <TabsTrigger value="general">Relatório Geral</TabsTrigger>
            <TabsTrigger value="individual">Relatório Individual</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <SummaryCards data={generalData} title="Resumo Geral" showAvg />
            <ExpenseChart 
              monthlyData={monthlyData} 
              totalMaintenances={generalData.totalMaintenances}
              totalRefuelings={generalData.totalRefuelings}
              totalDocuments={generalData.totalDocuments}
            />
            <div className="grid gap-6 lg:grid-cols-2">
              <VehicleRanking vehicles={vehicleRanking} />
              <DriverRanking drivers={driverRanking} />
            </div>
          </TabsContent>

          <TabsContent value="individual" className="space-y-6">
            <ReportFilters
              vehicles={vehicles}
              drivers={drivers}
              selectedVehicle={selectedVehicle}
              setSelectedVehicle={setSelectedVehicle}
              selectedDriver={selectedDriver}
              setSelectedDriver={setSelectedDriver}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              onClearFilters={clearFilters}
            />

            <SummaryCards 
              data={filteredData} 
              title={hasFilters ? "Resumo Filtrado" : "Resumo Geral"} 
              showAvg 
            />

            <ExpenseChart 
              monthlyData={monthlyData} 
              totalMaintenances={filteredData.totalMaintenances}
              totalRefuelings={filteredData.totalRefuelings}
              totalDocuments={filteredData.totalDocuments}
            />

            <ExpenseTable expenses={expenses} onExportCSV={exportToCSV} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
