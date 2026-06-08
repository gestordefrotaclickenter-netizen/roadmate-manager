import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { maintenanceSchema, getZodErrorMessage } from "@/lib/validations";

interface Maintenance {
  id: string;
  maintenance_type: string;
  description: string;
  cost: number;
  maintenance_date: string;
  odometer: number;
  vehicle_id: string;
}

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
}

export default function Maintenances() {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
  const [formData, setFormData] = useState({
    vehicle_id: "",
    maintenance_type: "",
    description: "",
    cost: "",
    maintenance_date: new Date().toISOString().split("T")[0],
    odometer: "",
  });

  useEffect(() => {
    fetchMaintenances();
    fetchVehicles();
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

  const fetchMaintenances = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("maintenances")
      .select("*")
      .eq("user_id", user.id)
      .order("maintenance_date", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar manutenções");
    } else {
      setMaintenances(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dataToSend = {
      ...formData,
      cost: parseFloat(formData.cost),
      odometer: formData.odometer ? parseInt(formData.odometer) : null,
      user_id: user.id,
    };

    if (editingMaintenance) {
      const { error } = await supabase
        .from("maintenances")
        .update(dataToSend)
        .eq("id", editingMaintenance.id);

      if (error) {
        toast.error("Erro ao atualizar manutenção");
      } else {
        toast.success("Manutenção atualizada com sucesso!");
        setIsDialogOpen(false);
        fetchMaintenances();
        resetForm();
      }
    } else {
      const { error } = await supabase.from("maintenances").insert([dataToSend]);

      if (error) {
        toast.error("Erro ao registrar manutenção");
      } else {
        toast.success("Manutenção registrada com sucesso!");
        setIsDialogOpen(false);
        fetchMaintenances();
        resetForm();
      }
    }
  };

  const handleEdit = (maintenance: Maintenance) => {
    setEditingMaintenance(maintenance);
    setFormData({
      vehicle_id: maintenance.vehicle_id,
      maintenance_type: maintenance.maintenance_type,
      description: maintenance.description,
      cost: maintenance.cost.toString(),
      maintenance_date: maintenance.maintenance_date,
      odometer: maintenance.odometer?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta manutenção?")) return;

    const { error } = await supabase.from("maintenances").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir manutenção");
    } else {
      toast.success("Manutenção excluída com sucesso!");
      fetchMaintenances();
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: "",
      maintenance_type: "",
      description: "",
      cost: "",
      maintenance_date: new Date().toISOString().split("T")[0],
      odometer: "",
    });
    setEditingMaintenance(null);
  };

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle ? `${vehicle.plate} - ${vehicle.brand} ${vehicle.model}` : "N/A";
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manutenções</h1>
            <p className="text-muted-foreground">Registre e acompanhe as manutenções da frota</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Manutenção
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingMaintenance ? "Editar" : "Nova"} Manutenção</DialogTitle>
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
                  <Label htmlFor="maintenance_type">Tipo de Manutenção</Label>
                  <Input
                    id="maintenance_type"
                    value={formData.maintenance_type}
                    onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })}
                    placeholder="Ex: Troca de óleo, Revisão..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="maintenance_date">Data</Label>
                    <Input
                      id="maintenance_date"
                      type="date"
                      value={formData.maintenance_date}
                      onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="odometer">Km (opcional)</Label>
                  <Input
                    id="odometer"
                    type="number"
                    value={formData.odometer}
                    onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingMaintenance ? "Atualizar" : "Registrar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Manutenções</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Km</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenances.map((maintenance) => (
                  <TableRow key={maintenance.id}>
                    <TableCell>
                      {new Date(maintenance.maintenance_date).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>{getVehicleInfo(maintenance.vehicle_id)}</TableCell>
                    <TableCell className="font-medium">{maintenance.maintenance_type}</TableCell>
                    <TableCell>{maintenance.description}</TableCell>
                    <TableCell>{maintenance.odometer ? `${maintenance.odometer.toLocaleString()} km` : "-"}</TableCell>
                    <TableCell className="font-medium">
                      R$ {maintenance.cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(maintenance)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(maintenance.id)}>
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
