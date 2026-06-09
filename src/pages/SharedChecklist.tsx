import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClipboardCheck, Truck } from "lucide-react";

interface ChecklistInfo {
  id: string;
  title: string;
  description: string | null;
}

interface ChecklistItem {
  id: string;
  item_text: string;
  is_checked: boolean;
}

export default function SharedChecklist() {
  const { token } = useParams<{ token: string }>();
  const [checklist, setChecklist] = useState<ChecklistInfo | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (token) load(token);
  }, [token]);

  const load = async (t: string) => {
    setLoading(true);
    const { data: clData, error } = await supabase.rpc("get_shared_checklist", { _token: t });

    if (error || !clData || clData.length === 0) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setChecklist(clData[0]);
    const { data: itemsData } = await supabase.rpc("get_shared_checklist_items", { _token: t });
    setItems(itemsData || []);
    setLoading(false);
  };

  const handleToggle = async (itemId: string, current: boolean) => {
    if (!token) return;
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, is_checked: !current } : i))
    );
    const { error } = await supabase.rpc("toggle_shared_checklist_item", {
      _token: token,
      _item_id: itemId,
      _checked: !current,
    });
    if (error) {
      toast.error("Erro ao atualizar item");
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, is_checked: current } : i))
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-2 text-center px-4">
        <Truck className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Checklist não encontrado</h1>
        <p className="text-muted-foreground">O link pode estar incorreto ou ter sido removido.</p>
      </div>
    );
  }

  const checkedCount = items.filter((i) => i.is_checked).length;

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-xl bg-gradient-to-r from-primary to-primary/70 text-primary-foreground p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">{checklist?.title}</h1>
              {checklist?.description && (
                <p className="opacity-90">{checklist.description}</p>
              )}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Itens ({checkedCount}/{items.length} concluídos)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum item neste checklist.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50"
                >
                  <Checkbox
                    checked={item.is_checked}
                    onCheckedChange={() => handleToggle(item.id, item.is_checked)}
                  />
                  <span
                    className={item.is_checked ? "line-through text-muted-foreground" : ""}
                  >
                    {item.item_text}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
