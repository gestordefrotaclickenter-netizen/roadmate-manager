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
import { Plus, Pencil, Trash2, FileText, AlertTriangle, CheckCircle, Car, Clock, CalendarCheck, Shield, Receipt, ClipboardCheck, Filter } from "lucide-react";
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
  ipva: 'IPVA / Licenciamento',
  licenciamento: 'IPVA / Licenciamento',
  multa: 'Multa',
  seguro: 'Seguro',
  dpvat: 'DPVAT',
  vistoria: 'Vistoria',
  outros: 'Outros',
};

// Tipos únicos para exibição nos selects (sem duplicatas)
const uniqueDocumentTypes: { value: DocumentType; label: string }[] = [
  { value: 'ipva', label: 'IPVA / Licenciamento' },
  { value: 'multa', label: 'Multa' },
  { value: 'seguro', label: 'Seguro' },
  { value: 'dpvat', label: 'DPVAT' },
  { value: 'vistoria', label: 'Vistoria' },
  { value: 'outros', label: 'Outros' },
];

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
    if (filterType !== "all") {
      // Se filtrar por ipva, inclui também licenciamento (e vice-versa)
      if (filterType === 'ipva') {
        if (doc.document_type !== 'ipva' && doc.document_type !== 'licenciamento') return false;
      } else if (doc.document_type !== filterType) {
        return false;
      }
    }
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
        {/* Header com visual de frota */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary via-primary/90 to-primary/70 p-6 text-primary-foreground">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAwdi02aC02djZoNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-foreground/10 backdrop-blur-sm">
                <Car className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Documentos da Frota</h1>
                <p className="text-primary-foreground/80">Gerencie IPVA, Licenciamentos, Multas e documentação veicular</p>
              </div>
            </div>
            <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Documento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
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
                          {uniqueDocumentTypes.map(({ value, label }) => (
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
        </div>

        {/* Summary Cards com ícones de frota */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden border-l-4 border-l-primary">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Documentos</p>
                  <p className="text-3xl font-bold text-foreground">{documents.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">{vehicles.length} veículos cadastrados</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ClipboardCheck className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-l-4 border-l-warning">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="text-3xl font-bold text-foreground">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Aguardando pagamento</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-l-4 border-l-destructive">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vencidos</p>
                  <p className="text-3xl font-bold text-foreground">{overdueCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Requer atenção imediata</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-l-4 border-l-accent">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Próximos 30 dias</p>
                  <p className="text-3xl font-bold text-foreground">{upcomingCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Vencimentos próximos</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <CalendarCheck className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filtros</span>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[150px]">
                <Label className="text-xs text-muted-foreground">Tipo de Documento</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {uniqueDocumentTypes.map(({ value, label }) => (
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
                    <SelectItem value="all">Todos os status</SelectItem>
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
                    <SelectItem value="all">Todos os veículos</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        <div className="flex items-center gap-2">
                          <Car className="h-3 w-3" />
                          {v.plate} - {v.brand} {v.model}
                        </div>
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
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>Lista de Documentos</CardTitle>
              </div>
              <Badge variant="secondary" className="font-normal">
                {filteredDocuments.length} {filteredDocuments.length === 1 ? 'documento' : 'documentos'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Veículo</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">Título</TableHead>
                  <TableHead className="font-semibold">Ano Ref.</TableHead>
                  <TableHead className="font-semibold">Vencimento</TableHead>
                  <TableHead className="font-semibold">Valor</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-10 w-10 text-muted-foreground/50" />
                        <p className="text-muted-foreground">Nenhum documento encontrado</p>
                        <p className="text-xs text-muted-foreground">Adicione um novo documento para começar</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Car className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <span className="font-medium">{doc.vehicles?.plate || '-'}</span>
                            <span className="block text-xs text-muted-foreground">
                              {doc.vehicles?.brand} {doc.vehicles?.model}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">{documentTypeLabels[doc.document_type]}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{doc.title}</TableCell>
                      <TableCell>{doc.reference_year || '-'}</TableCell>
                      <TableCell>
                        {doc.due_date ? format(parseISO(doc.due_date), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {doc.cost ? `R$ ${doc.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(doc.status, doc.due_date)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(doc)} className="h-8 w-8">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)} className="h-8 w-8 hover:bg-destructive/10">
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
