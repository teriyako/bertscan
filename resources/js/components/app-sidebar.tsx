import { Link } from '@inertiajs/react';
import { Database, FileDown, LayoutGrid, Users } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard as dataHubDashboard } from '@/routes/data-hub';
import { index as exportsIndex } from '@/routes/data-hub/exports';
import { index as submissionsIndex } from '@/routes/data-hub/submissions';
import type { NavItem } from '@/types';

const dataHubNavItems: NavItem[] = [
    {
        title: 'Data Hub',
        href: dataHubDashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Submissions',
        href: submissionsIndex(),
        icon: Database,
    },
    {
        title: 'Opted-in Users',
        href: '/data-hub/opted-in',
        icon: Users,
    },
    {
        title: 'Exports',
        href: exportsIndex(),
        icon: FileDown,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dataHubDashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={dataHubNavItems} label="Data Hub" />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
