import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type DocumentType = 'ipva' | 'licenciamento' | 'multa' | 'seguro' | 'dpvat' | 'vistoria' | 'outros';

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
}

interface VehicleDocument {
  id: string;
  vehicle_id: string;
  document_type: DocumentType;
  title: string;
  description: string | null;
  due_date: string | null;
  paid_date: string | null;
  cost: number | null;
  status: string;
  reference_year: number | null;
  vehicles?: Vehicle;
}

const documentTypeLabels: Record<DocumentType, string> = {
  ipva: 'IPVA',
  licenciamento: 'Licenciamento',
  multa: 'Multa',
  seguro: 'Seguro',
  dpvat: 'DPVAT',
  vistoria: 'Vistoria',
  outros: 'Outros',
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  vencido: 'Vencido',
  agendado: 'Agendado',
};

export default function Documents() {
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<VehicleDocument | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterVehicle, setFilterVehicle] = useState<string>("all");
  const [formData, setFormData] = useState({
    vehicle_id: "",
    document_type: "ipva" as DocumentType,
    title: "",
    description: "",
    due_date: "",
    paid_date: "",
    cost: "",
    status: "pendente",
    reference_year: new Date().getFullYear().toString(),
  });

  useEffect(() => {
    fetchDocuments();
    fetchVehicles();
  }, []);

  const fetchDocuments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("vehicle_documents")
      .select(`
        *,
        vehicles (id, plate, brand, model)
      `)
      .eq("user_id", user.id)
      .order("due_date", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar documentos");
      return;
    }

    setDocuments(data || []);
  };

  const fetchVehicles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("vehicles")
      .select("id, plate, brand, model")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (error) {
      toast.error("Erro ao carregar veículos");
      return;
    }

    setVehicles(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const documentData = {
      user_id: user.id,
      vehicle_id: formData.vehicle_id,
      document_type: formData.document_type,
      title: formData.title,
      description: formData.description || null,
      due_date: formData.due_date || null,
      paid_date: formData.paid_date || null,
      cost: formData.cost ? parseFloat(formData.cost) : null,
      status: formData.status,
      reference_year: formData.reference_year ? parseInt(formData.reference_year) : null,
    };

    if (editingDocument) {
      const { error } = await supabase
        .from("vehicle_documents")
        .update(documentData)
        .eq("id", editingDocument.id);

      if (error) {
        toast.error("Erro ao atualizar documento");
        return;
      }
      toast.success("Documento atualizado com sucesso!");
    } else {
      const { error } = await supabase
        .from("vehicle_documents")
        .insert([documentData]);

      if (error) {
        toast.error("Erro ao adicionar documento");
        return;
      }
      toast.success("Documento adicionado com sucesso!");
    }

    resetForm();
    fetchDocuments();
    setIsOpen(false);
  };

  const handleEdit = (document: VehicleDocument) => {
    setEditingDocument(document);
    setFormData({
      vehicle_id: document.vehicle_id,
      document_type: document.document_type,
      title: document.title,
      description: document.description || "",
      due_date: document.due_date || "",
      paid_date: document.paid_date || "",
      cost: document.cost?.toString() || "",
      status: document.status,
      reference_year: document.reference_year?.toString() || "",
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;

    const { error } = await supabase
      .from("vehicle_documents")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir documento");
      return;
    }

    toast.success("Documento excluído com sucesso!");
    fetchDocuments();
  };

  const resetForm = () => {
    setEditingDocument(null);
    setFormData({
      vehicle_id: "",
      document_type: "ipva",
      title: "",
      description: "",
      due_date: "",
      paid_date: "",
      cost: "",
      status: "pendente",
      reference_year: new Date().getFullYear().toString(),
    });
  };

  const getStatusBadge = (status: string, dueDate: string | null) => {
    if (status === 'pago') {
      return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
    }
    
    if (dueDate) {
      const days = differenceInDays(parseISO(dueDate), new Date());
      if (days < 0) {
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Vencido</Badge>;
      }
      if (days <= 30) {
        return <Badge className="bg-warning text-warning-foreground"><AlertTriangle className="w-3 h-3 mr-1" />Vence em {days} dias</Badge>;
      }
    }
    
    return <Badge variant="secondary">{statusLabels[status] || status}</Badge>;
  };

  const filteredDocuments = documents.filter(doc => {
    if (filterType !== "all" && doc.document_type !== filterType) return false;
    if (filterStatus !== "all" && doc.status !== filterStatus) return false;
    if (filterVehicle !== "all" && doc.vehicle_id !== filterVehicle) return false;
    return true;
  });

  const pendingCount = documents.filter(d => d.status === 'pendente').length;
  const overdueCount = documents.filter(d => {
    if (!d.due_date || d.status === 'pago') return false;
    return differenceInDays(parseISO(d.due_date), new Date()) < 0;
  }).length;
  const upcomingCount = documents.filter(d => {
    if (!d.due_date || d.status === 'pago') return false;
    const days = differenceInDays(parseISO(d.due_date), new Date());
    return days >= 0 && days <= 30;
  }).length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Documentos de Veículos</h1>
            <p className="text-muted-foreground">IPVA, Licenciamentos, Multas e outros documentos</p>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Novo Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingDocument ? "Editar Documento" : "Novo Documento"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Veículo *</Label>
                    <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.plate} - {v.brand} {v.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select value={formData.document_type} onValueChange={(value) => setFormData({ ...formData, document_type: value as DocumentType })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(documentTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: IPVA 2024"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Observações adicionais"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ano Referência</Label>
                    <Input
                      type="number"
                      value={formData.reference_year}
                      onChange={(e) => setFormData({ ...formData, reference_year: e.target.value })}
                      min="2000"
                      max="2100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vencimento</Label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Pagamento</Label>
                    <Input
                      type="date"
                      value={formData.paid_date}
                      onChange={(e) => setFormData({ ...formData, paid_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingDocument ? "Atualizar" : "Adicionar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{documents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vencidos</p>
                  <p className="text-2xl font-bold">{overdueCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Próximos 30 dias</p>
                  <p className="text-2xl font-bold">{upcomingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[150px]">
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(documentTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs text-muted-foreground">Veículo</Label>
                <Select value={filterVehicle} onValueChange={setFilterVehicle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.plate} - {v.brand} {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Ano Ref.</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhum documento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        {doc.vehicles?.plate || '-'}
                        <span className="block text-xs text-muted-foreground">
                          {doc.vehicles?.brand} {doc.vehicles?.model}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{documentTypeLabels[doc.document_type]}</Badge>
                      </TableCell>
                      <TableCell>{doc.title}</TableCell>
                      <TableCell>{doc.reference_year || '-'}</TableCell>
                      <TableCell>
                        {doc.due_date ? format(parseISO(doc.due_date), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                      </TableCell>
                      <TableCell>
                        {doc.cost ? `R$ ${doc.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(doc.status, doc.due_date)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(doc)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
