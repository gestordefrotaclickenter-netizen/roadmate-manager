import { LayoutDashboard, Car, Users, ClipboardCheck, Wrench, Fuel, FileText, FileArchive, CircleDot, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Veículos", url: "/vehicles", icon: Car },
  { title: "Motoristas", url: "/drivers", icon: Users },
  { title: "Documentos", url: "/documents", icon: FileArchive },
  { title: "Checklists", url: "/checklists", icon: ClipboardCheck },
  { title: "Manutenções", url: "/maintenances", icon: Wrench },
  { title: "Abastecimentos", url: "/refuelings", icon: Fuel },
  { title: "Pneus", url: "/tires", icon: CircleDot },
  { title: "Relatórios", url: "/reports", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const collapsed = state === "collapsed";

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao fazer logout");
    } else {
      navigate("/auth");
    }
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"}>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-6">
            <h2 className={`font-bold text-sidebar-primary ${collapsed ? "text-xs text-center" : "text-xl"}`}>
              {collapsed ? "GF" : "Gestão de Frotas"}
            </h2>
          </div>
          
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className={`${collapsed ? "" : "mr-2"} h-5 w-5`} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleLogout}
          >
            <LogOut className={`${collapsed ? "" : "mr-2"} h-5 w-5`} />
            {!collapsed && <span>Sair</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
