import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  status: string;
  odometer: number;
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    plate: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    status: "active",
    odometer: 0,
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar veículos");
    } else {
      setVehicles(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingVehicle) {
      const { error } = await supabase
        .from("vehicles")
        .update(formData)
        .eq("id", editingVehicle.id);

      if (error) {
        toast.error("Erro ao atualizar veículo");
      } else {
        toast.success("Veículo atualizado com sucesso!");
        setIsDialogOpen(false);
        fetchVehicles();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("vehicles")
        .insert([{ ...formData, user_id: user.id }]);

      if (error) {
        toast.error("Erro ao cadastrar veículo");
      } else {
        toast.success("Veículo cadastrado com sucesso!");
        setIsDialogOpen(false);
        fetchVehicles();
        resetForm();
      }
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData(vehicle);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este veículo?")) return;

    const { error } = await supabase.from("vehicles").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir veículo");
    } else {
      toast.success("Veículo excluído com sucesso!");
      fetchVehicles();
    }
  };

  const resetForm = () => {
    setFormData({
      plate: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      color: "",
      status: "active",
      odometer: 0,
    });
    setEditingVehicle(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Veículos</h1>
            <p className="text-muted-foreground">Gerencie os veículos da sua frota</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Veículo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingVehicle ? "Editar" : "Novo"} Veículo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plate">Placa</Label>
                  <Input
                    id="plate"
                    value={formData.plate}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marca</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Ano</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Cor</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="odometer">Km Atual</Label>
                  <Input
                    id="odometer"
                    type="number"
                    value={formData.odometer}
                    onChange={(e) => setFormData({ ...formData, odometer: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingVehicle ? "Atualizar" : "Cadastrar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Veículos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Marca/Modelo</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Km</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.plate}</TableCell>
                    <TableCell>{vehicle.brand} {vehicle.model}</TableCell>
                    <TableCell>{vehicle.year}</TableCell>
                    <TableCell>{vehicle.color}</TableCell>
                    <TableCell>{vehicle.odometer.toLocaleString("pt-BR")} km</TableCell>
                    <TableCell>
                      <Badge variant={vehicle.status === "active" ? "default" : "secondary"}>
                        {vehicle.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(vehicle)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(vehicle.id)}>
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
