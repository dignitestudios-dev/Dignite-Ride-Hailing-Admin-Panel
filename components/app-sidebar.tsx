"use client";

import * as React from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Settings,
  BellDot,
  CreditCard,
  Users,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Next js",
    email: "admin@example.com",
    avatar: "",
  },
  navGroups: [
    {
      label: "Dashboard",
      items: [
        {
          title: "Overview",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: "Management",
      items: [
        {
          title: "Users",
          url: "#",
          icon: Users,
          items: [
            {
              title: "Drivers",
              url: "/dashboard/drivers",
            },
            {
              title: "Passengers",
              url: "/dashboard/users",
            },
          ],
        },
        {
          title: "Driver Requests",
          url: "/dashboard/driver-requests",
          icon: CheckSquare,
        },
        {
          title: "Vehicle Categories",
          url: "/dashboard/vehicle-categories",
          icon: Settings,
        },
      ],
    },
    {
      label: "Insights",
      items: [
        {
          title: "Reports",
          url: "/dashboard/reports",
          icon: BarChart3,
        },
        {
          title: "Notifications",
          url: "/dashboard/notifications",
          icon: BellDot,
        },
      ],
    },
    {
      label: "Finance",
      items: [
        {
          title: "Revenue",
          url: "#",
          icon: CreditCard,
          items: [
            {
              title: "Subscription Revenue",
              url: "/dashboard/revenue/subscription",
            },
            {
              title: "Withdrawal Commission",
              url: "/dashboard/revenue/withdrawal-commission",
            },
          ],
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useSelector((state: RootState) => state.auth.user);

  const userData = user
    ? {
        name: user.name,
        email: user.email,
        avatar: "",
      }
    : {
        name: "Guest",
        email: "",
        avatar: "",
      };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-primary-foreground">
                  <Logo size={32} className="text-current" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-xl">Dignite Rides</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
