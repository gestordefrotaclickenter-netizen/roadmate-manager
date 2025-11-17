import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Refueling {
  id: string;
  fuel_type: string;
  liters: number;
  cost: number;
  refuel_date: string;
  odometer: number;
  vehicle_id: string;
  driver_id: string | null;
}

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

export default function Refuelings() {
  const [refuelings, setRefuelings] = useState<Refueling[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRefueling, setEditingRefueling] = useState<Refueling | null>(null);
  const [formData, setFormData] = useState({
    vehicle_id: "",
    driver_id: "",
    fuel_type: "",
    liters: "",
    cost: "",
    refuel_date: new Date().toISOString().split("T")[0],
    odometer: "",
  });

  useEffect(() => {
    fetchRefuelings();
    fetchVehicles();
    fetchDrivers();
  }, []);

  const fetchVehicles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("vehicles")
      .select("id, plate, brand, model")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (data) setVehicles(data);
  };

  const fetchDrivers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("drivers")
      .select("id, name")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (data) setDrivers(data);
  };

  const fetchRefuelings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("refuelings")
      .select("*")
      .eq("user_id", user.id)
      .order("refuel_date", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar abastecimentos");
    } else {
      setRefuelings(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dataToSend = {
      ...formData,
      liters: parseFloat(formData.liters),
      cost: parseFloat(formData.cost),
      odometer: parseInt(formData.odometer),
      driver_id: formData.driver_id || null,
      user_id: user.id,
    };

    if (editingRefueling) {
      const { error } = await supabase
        .from("refuelings")
        .update(dataToSend)
        .eq("id", editingRefueling.id);

      if (error) {
        toast.error("Erro ao atualizar abastecimento");
      } else {
        toast.success("Abastecimento atualizado com sucesso!");
        setIsDialogOpen(false);
        fetchRefuelings();
        resetForm();
      }
    } else {
      const { error } = await supabase.from("refuelings").insert([dataToSend]);

      if (error) {
        toast.error("Erro ao registrar abastecimento");
      } else {
        toast.success("Abastecimento registrado com sucesso!");
        setIsDialogOpen(false);
        fetchRefuelings();
        resetForm();
      }
    }
  };

  const handleEdit = (refueling: Refueling) => {
    setEditingRefueling(refueling);
    setFormData({
      vehicle_id: refueling.vehicle_id,
      driver_id: refueling.driver_id || "",
      fuel_type: refueling.fuel_type,
      liters: refueling.liters.toString(),
      cost: refueling.cost.toString(),
      refuel_date: refueling.refuel_date,
      odometer: refueling.odometer.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este abastecimento?")) return;

    const { error } = await supabase.from("refuelings").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir abastecimento");
    } else {
      toast.success("Abastecimento excluído com sucesso!");
      fetchRefuelings();
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: "",
      driver_id: "",
      fuel_type: "",
      liters: "",
      cost: "",
      refuel_date: new Date().toISOString().split("T")[0],
      odometer: "",
    });
    setEditingRefueling(null);
  };

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle ? `${vehicle.plate} - ${vehicle.brand} ${vehicle.model}` : "N/A";
  };

  const getDriverName = (driverId: string | null) => {
    if (!driverId) return "-";
    const driver = drivers.find((d) => d.id === driverId);
    return driver?.name || "-";
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Abastecimentos</h1>
            <p className="text-muted-foreground">Registre e acompanhe os abastecimentos da frota</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Abastecimento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingRefueling ? "Editar" : "Novo"} Abastecimento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_id">Veículo</Label>
                  <Select
                    value={formData.vehicle_id}
                    onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.plate} - {vehicle.brand} {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driver_id">Motorista (opcional)</Label>
                  <Select
                    value={formData.driver_id}
                    onValueChange={(value) => setFormData({ ...formData, driver_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um motorista" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuel_type">Tipo de Combustível</Label>
                  <Select
                    value={formData.fuel_type}
                    onValueChange={(value) => setFormData({ ...formData, fuel_type: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gasolina">Gasolina</SelectItem>
                      <SelectItem value="Etanol">Etanol</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="GNV">GNV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="liters">Litros</Label>
                    <Input
                      id="liters"
                      type="number"
                      step="0.01"
                      value={formData.liters}
                      onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Custo (R$)</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="refuel_date">Data</Label>
                    <Input
                      id="refuel_date"
                      type="date"
                      value={formData.refuel_date}
                      onChange={(e) => setFormData({ ...formData, refuel_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="odometer">Km</Label>
                    <Input
                      id="odometer"
                      type="number"
                      value={formData.odometer}
                      onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  {editingRefueling ? "Atualizar" : "Registrar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Abastecimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Combustível</TableHead>
                  <TableHead>Litros</TableHead>
                  <TableHead>Km</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refuelings.map((refueling) => (
                  <TableRow key={refueling.id}>
                    <TableCell>
                      {new Date(refueling.refuel_date).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>{getVehicleInfo(refueling.vehicle_id)}</TableCell>
                    <TableCell>{getDriverName(refueling.driver_id)}</TableCell>
                    <TableCell>{refueling.fuel_type}</TableCell>
                    <TableCell>{refueling.liters.toFixed(2)}L</TableCell>
                    <TableCell>{refueling.odometer.toLocaleString()} km</TableCell>
                    <TableCell className="font-medium">
                      R$ {refueling.cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(refueling)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(refueling.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
