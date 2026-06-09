import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Share2, Trash2 } from "lucide-react";
import { checklistSchema, checklistItemSchema, getZodErrorMessage } from "@/lib/validations";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Checklist {
  id: string;
  title: string;
  description: string;
  share_token: string;
}

interface SharedDriver {
  id: string;
  driver_id: string;
  driver_name: string;
}

interface ChecklistItem {
  id: string;
  item_text: string;
  is_checked: boolean;
}

interface Driver {
  id: string;
  name: string;
}

export default function Checklists() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [sharedDrivers, setSharedDrivers] = useState<SharedDriver[]>([]);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    fetchChecklists();
    fetchDrivers();
  }, []);

  useEffect(() => {
    if (selectedChecklist) {
      fetchItems(selectedChecklist);
    }
  }, [selectedChecklist]);

  const fetchChecklists = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("checklists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar checklists");
    } else {
      setChecklists(data || []);
      if (data && data.length > 0 && !selectedChecklist) {
        setSelectedChecklist(data[0].id);
      }
    }
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

  const fetchItems = async (checklistId: string) => {
    const { data, error } = await supabase
      .from("checklist_items")
      .select("*")
      .eq("checklist_id", checklistId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar itens");
    } else {
      setItems(data || []);
    }
  };

  const handleSubmitChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const validation = checklistSchema.safeParse(formData);
    if (!validation.success) {
      toast.error(getZodErrorMessage(validation.error));
      return;
    }
    const { error } = await supabase
      .from("checklists")
      .insert([{ title: validation.data.title, description: validation.data.description ?? "", user_id: user.id }]);

    if (error) {
      toast.error("Erro ao criar checklist");
    } else {
      toast.success("Checklist criado com sucesso!");
      setIsDialogOpen(false);
      fetchChecklists();
      setFormData({ title: "", description: "" });
    }
  };

  const handleAddItem = async () => {
    if (!selectedChecklist) return;

    const validation = checklistItemSchema.safeParse({ item_text: newItem });
    if (!validation.success) {
      toast.error(getZodErrorMessage(validation.error));
      return;
    }

    const { error } = await supabase
      .from("checklist_items")
      .insert([{ checklist_id: selectedChecklist, item_text: validation.data.item_text }]);

    if (error) {
      toast.error("Erro ao adicionar item");
    } else {
      setNewItem("");
      fetchItems(selectedChecklist);
    }
  };

  const handleToggleItem = async (itemId: string, currentState: boolean) => {
    const { error } = await supabase
      .from("checklist_items")
      .update({ is_checked: !currentState })
      .eq("id", itemId);

    if (error) {
      toast.error("Erro ao atualizar item");
    } else {
      if (selectedChecklist) fetchItems(selectedChecklist);
    }
  };

  const handleShare = async () => {
    if (!selectedChecklist || !selectedDriver) return;

    const { error } = await supabase
      .from("checklist_shares")
      .insert([{ checklist_id: selectedChecklist, driver_id: selectedDriver }]);

    if (error) {
      toast.error("Erro ao compartilhar checklist");
    } else {
      toast.success("Checklist compartilhado com sucesso!");
      setIsShareDialogOpen(false);
      setSelectedDriver("");
    }
  };

  const handleDeleteChecklist = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este checklist?")) return;

    const { error } = await supabase.from("checklists").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir checklist");
    } else {
      toast.success("Checklist excluído com sucesso!");
      if (selectedChecklist === id) {
        setSelectedChecklist(null);
      }
      fetchChecklists();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Checklists</h1>
            <p className="text-muted-foreground">Crie e compartilhe checklists com motoristas</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Checklist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Checklist</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitChecklist} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                <Button type="submit" className="w-full">Criar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Meus Checklists</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {checklists.map((checklist) => (
                <div
                  key={checklist.id}
                  className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors flex justify-between items-center ${
                    selectedChecklist === checklist.id ? "bg-muted border-primary" : ""
                  }`}
                  onClick={() => setSelectedChecklist(checklist.id)}
                >
                  <div>
                    <p className="font-medium">{checklist.title}</p>
                    <p className="text-sm text-muted-foreground">{checklist.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChecklist(checklist.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {selectedChecklist
                    ? checklists.find((c) => c.id === selectedChecklist)?.title
                    : "Selecione um checklist"}
                </CardTitle>
                {selectedChecklist && (
                  <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Share2 className="mr-2 h-4 w-4" />
                        Compartilhar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Compartilhar Checklist</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Selecione o motorista</Label>
                          <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                            <SelectTrigger>
                              <SelectValue placeholder="Escolha um motorista" />
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
                        <Button onClick={handleShare} className="w-full">
                          Compartilhar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedChecklist ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar novo item..."
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
                    />
                    <Button onClick={handleAddItem}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={item.is_checked}
                          onCheckedChange={() => handleToggleItem(item.id, item.is_checked)}
                        />
                        <span className={item.is_checked ? "line-through text-muted-foreground" : ""}>
                          {item.item_text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Selecione um checklist para visualizar os itens
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
