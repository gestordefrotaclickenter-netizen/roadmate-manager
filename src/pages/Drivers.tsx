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
import { driverSchema, getZodErrorMessage } from "@/lib/validations";

interface Driver {
  id: string;
  name: string;
  license_number: string;
  license_category: string;
  phone: string;
  email: string;
  status: string;
}

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    license_number: "",
    license_category: "",
    phone: "",
    email: "",
    status: "active",
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar motoristas");
    } else {
      setDrivers(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingDriver) {
      const { error } = await supabase
        .from("drivers")
        .update(formData)
        .eq("id", editingDriver.id);

      if (error) {
        toast.error("Erro ao atualizar motorista");
      } else {
        toast.success("Motorista atualizado com sucesso!");
        setIsDialogOpen(false);
        fetchDrivers();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("drivers")
        .insert([{ ...formData, user_id: user.id }]);

      if (error) {
        toast.error("Erro ao cadastrar motorista");
      } else {
        toast.success("Motorista cadastrado com sucesso!");
        setIsDialogOpen(false);
        fetchDrivers();
        resetForm();
      }
    }
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData(driver);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este motorista?")) return;

    const { error } = await supabase.from("drivers").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir motorista");
    } else {
      toast.success("Motorista excluído com sucesso!");
      fetchDrivers();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      license_number: "",
      license_category: "",
      phone: "",
      email: "",
      status: "active",
    });
    setEditingDriver(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Motoristas</h1>
            <p className="text-muted-foreground">Gerencie os motoristas da sua frota</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Motorista
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingDriver ? "Editar" : "Novo"} Motorista</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="license_number">CNH</Label>
                    <Input
                      id="license_number"
                      value={formData.license_number}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_category">Categoria</Label>
                    <Input
                      id="license_category"
                      value={formData.license_category}
                      onChange={(e) => setFormData({ ...formData, license_category: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingDriver ? "Atualizar" : "Cadastrar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Motoristas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNH</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">{driver.name}</TableCell>
                    <TableCell>{driver.license_number}</TableCell>
                    <TableCell>{driver.license_category}</TableCell>
                    <TableCell>{driver.phone}</TableCell>
                    <TableCell>{driver.email}</TableCell>
                    <TableCell>
                      <Badge variant={driver.status === "active" ? "default" : "secondary"}>
                        {driver.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(driver)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(driver.id)}>
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
