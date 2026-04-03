'use client'

import React, { useState } from 'react'
import {
  LayoutDashboard,
  Car,
  ClipboardList,
  Fuel,
  Wrench,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  Truck,
  Database,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import DashboardSection from '@/components/fleet/dashboard'
import VehicleManagement from '@/components/fleet/vehicle-management'
import WorkOrders from '@/components/fleet/work-orders'
import FuelMonitoring from '@/components/fleet/fuel-monitoring'
import MaintenanceSection from '@/components/fleet/maintenance'
import ReportsSection from '@/components/fleet/reports'
import BackupRestore from '@/components/fleet/backup'

type Section = 'dashboard' | 'vehicles' | 'work-orders' | 'fuel' | 'maintenance' | 'reports' | 'backup'

interface NavItem {
  id: Section
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { id: 'vehicles', label: 'إدارة المركبات', icon: Car },
  { id: 'work-orders', label: 'أوامر الشغل', icon: ClipboardList },
  { id: 'fuel', label: 'مراقبة الوقود', icon: Fuel },
  { id: 'maintenance', label: 'الصيانة', icon: Wrench },
  { id: 'reports', label: 'التقارير', icon: BarChart3 },
  { id: 'backup', label: 'النسخ الاحتياطي', icon: Database },
]

function SidebarContent({
  activeSection,
  onSectionChange,
  collapsed,
}: {
  activeSection: Section
  onSectionChange: (section: Section) => void
  collapsed: boolean
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/20">
          <Truck className="w-6 h-6 text-emerald-400" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-base font-bold text-emerald-400 tracking-tight">SmartFleet</span>
            <span className="text-[10px] text-slate-400 leading-tight">إدارة الأسطول الذكية</span>
          </div>
        )}
      </div>

      <Separator className="bg-slate-700/50" />

      {/* Nav */}
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const isActive = activeSection === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                )}
              >
                <Icon className={cn('w-5 h-5 shrink-0', isActive && 'text-emerald-400')} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-slate-700/50" />

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3">
          <p className="text-[10px] text-slate-500 text-center">
            © 2025 SmartFleet Manager
          </p>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard')
  const [collapsed, setCollapsed] = useState(false)

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection />
      case 'vehicles':
        return <VehicleManagement />
      case 'work-orders':
        return <WorkOrders />
      case 'fuel':
        return <FuelMonitoring />
      case 'maintenance':
        return <MaintenanceSection />
      case 'reports':
        return <ReportsSection />
      case 'backup':
        return <BackupRestore />
      default:
        return <DashboardSection />
    }
  }

  const currentNav = navItems.find((n) => n.id === activeSection)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-full bg-slate-900 border-l border-slate-700/50 transition-all duration-300 shrink-0',
          collapsed ? 'w-[68px]' : 'w-[240px]'
        )}
      >
        <SidebarContent
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          collapsed={collapsed}
        />
        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute top-7 items-center justify-center w-6 h-6 rounded-full bg-slate-700 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-600 transition-colors z-10"
          style={{ right: collapsed ? '56px' : '228px' }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-3 right-3 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-white shadow-md border-slate-200">
              <Truck className="w-5 h-5 text-emerald-600" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-[260px] bg-slate-900 border-slate-700/50">
            <SidebarContent
              activeSection={activeSection}
              onSectionChange={(s) => setActiveSection(s)}
              collapsed={false}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0">
          <div className="lg:hidden w-8" />
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
              {currentNav && <currentNav.icon className="w-5 h-5 text-emerald-500" />}
              {currentNav?.label}
            </h1>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {renderSection()}
        </div>
      </main>
    </div>
  )
}
