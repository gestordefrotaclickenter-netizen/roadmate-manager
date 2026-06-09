import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CircleDot } from "lucide-react";
import { tireSchema, getZodErrorMessage } from "@/lib/validations";

interface Tire {
  id: string;
  vehicle_id: string;
  brand: string | null;
  position: string;
  change_date: string;
  install_odometer: number;
  removal_odometer: number | null;
  purchase_price: number;
}

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
}

const POSITIONS = [
  "Dianteiro Esquerdo",
  "Dianteiro Direito",
  "Traseiro Esquerdo",
  "Traseiro Direito",
  "Estepe",
];

const isFront = (position: string) => position.toLowerCase().includes("dianteiro");
const isRear = (position: string) => position.toLowerCase().includes("traseiro");

export default function Tires() {
  const [tires, setTires] = useState<Tire[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTire, setEditingTire] = useState<Tire | null>(null);
  const [formData, setFormData] = useState({
    vehicle_id: "",
    brand: "",
    position: "",
    change_date: new Date().toISOString().split("T")[0],
    install_odometer: "",
    removal_odometer: "",
    purchase_price: "",
  });

  useEffect(() => {
    fetchTires();
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

  const fetchTires = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("tires")
      .select("*")
      .eq("user_id", user.id)
      .order("change_date", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar pneus");
    } else {
      setTires(data || []);
    }
  };

  const getKmRodados = (tire: Tire) => {
    const end = tire.removal_odometer ?? null;
    if (end === null) return null;
    const km = end - tire.install_odometer;
    return km >= 0 ? km : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const parsed = {
      vehicle_id: formData.vehicle_id,
      brand: formData.brand,
      position: formData.position,
      change_date: formData.change_date,
      install_odometer: parseInt(formData.install_odometer) || 0,
      removal_odometer: formData.removal_odometer ? parseInt(formData.removal_odometer) : null,
      purchase_price: parseFloat(formData.purchase_price),
    };

    const validation = tireSchema.safeParse(parsed);
    if (!validation.success) {
      toast.error(getZodErrorMessage(validation.error));
      return;
    }
    const v = validation.data;
    const dataToSend = {
      vehicle_id: v.vehicle_id,
      brand: v.brand ?? "",
      position: v.position,
      change_date: v.change_date,
      install_odometer: v.install_odometer,
      removal_odometer: v.removal_odometer ?? null,
      purchase_price: v.purchase_price,
      user_id: user.id,
    };

    if (editingTire) {
      const { error } = await supabase.from("tires").update(dataToSend).eq("id", editingTire.id);
      if (error) {
        toast.error("Erro ao atualizar pneu");
      } else {
        toast.success("Pneu atualizado com sucesso!");
        setIsDialogOpen(false);
        fetchTires();
        resetForm();
      }
    } else {
      const { error } = await supabase.from("tires").insert([dataToSend]);
      if (error) {
        toast.error("Erro ao registrar pneu");
      } else {
        toast.success("Pneu registrado com sucesso!");
        setIsDialogOpen(false);
        fetchTires();
        resetForm();
      }
    }
  };

  const handleEdit = (tire: Tire) => {
    setEditingTire(tire);
    setFormData({
      vehicle_id: tire.vehicle_id,
      brand: tire.brand || "",
      position: tire.position,
      change_date: tire.change_date,
      install_odometer: tire.install_odometer.toString(),
      removal_odometer: tire.removal_odometer?.toString() || "",
      purchase_price: tire.purchase_price.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este pneu?")) return;

    const { error } = await supabase.from("tires").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir pneu");
    } else {
      toast.success("Pneu excluído com sucesso!");
      fetchTires();
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: "",
      brand: "",
      position: "",
      change_date: new Date().toISOString().split("T")[0],
      install_odometer: "",
      removal_odometer: "",
      purchase_price: "",
    });
    setEditingTire(null);
  };

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle ? `${vehicle.plate} - ${vehicle.brand} ${vehicle.model}` : "N/A";
  };

  const frontKm = tires.filter((t) => isFront(t.position)).reduce((sum, t) => sum + (getKmRodados(t) ?? 0), 0);
  const rearKm = tires.filter((t) => isRear(t.position)).reduce((sum, t) => sum + (getKmRodados(t) ?? 0), 0);
  const totalCost = tires.reduce((sum, t) => sum + t.purchase_price, 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Controle de Pneus</h1>
            <p className="text-muted-foreground">Gerencie trocas, posições e custos dos pneus da frota</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Pneu
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingTire ? "Editar" : "Novo"} Pneu</DialogTitle>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position">Posição do Pneu</Label>
                    <Select
                      value={formData.position}
                      onValueChange={(value) => setFormData({ ...formData, position: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marca</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Ex: Pirelli"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="change_date">Data da Troca</Label>
                  <Input
                    id="change_date"
                    type="date"
                    value={formData.change_date}
                    onChange={(e) => setFormData({ ...formData, change_date: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="install_odometer">Km Instalação</Label>
                    <Input
                      id="install_odometer"
                      type="number"
                      value={formData.install_odometer}
                      onChange={(e) => setFormData({ ...formData, install_odometer: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="removal_odometer">Km Remoção (opcional)</Label>
                    <Input
                      id="removal_odometer"
                      type="number"
                      value={formData.removal_odometer}
                      onChange={(e) => setFormData({ ...formData, removal_odometer: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchase_price">Preço de Aquisição (R$)</Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingTire ? "Atualizar" : "Registrar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Km Rodados Dianteiros</CardTitle>
              <CircleDot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{frontKm.toLocaleString("pt-BR")} km</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Km Rodados Traseiros</CardTitle>
              <CircleDot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rearKm.toLocaleString("pt-BR")} km</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custo Total em Pneus</CardTitle>
              <CircleDot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Pneus</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data da Troca</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Posição</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Km Instalação</TableHead>
                  <TableHead>Km Remoção</TableHead>
                  <TableHead>Km Rodados</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tires.map((tire) => {
                  const km = getKmRodados(tire);
                  return (
                    <TableRow key={tire.id}>
                      <TableCell>{new Date(tire.change_date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{getVehicleInfo(tire.vehicle_id)}</TableCell>
                      <TableCell>
                        <Badge variant={isFront(tire.position) ? "default" : "secondary"}>
                          {tire.position}
                        </Badge>
                      </TableCell>
                      <TableCell>{tire.brand || "-"}</TableCell>
                      <TableCell>{tire.install_odometer.toLocaleString()} km</TableCell>
                      <TableCell>
                        {tire.removal_odometer !== null ? `${tire.removal_odometer.toLocaleString()} km` : "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {km !== null ? `${km.toLocaleString()} km` : "Em uso"}
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {tire.purchase_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(tire)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(tire.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
