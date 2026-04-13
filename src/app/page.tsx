'use client'

import React, { useState, useEffect } from 'react'
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
  MapPin,
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
import BranchMap from '@/components/fleet/branch-map'

type Section = 'dashboard' | 'vehicles' | 'work-orders' | 'fuel' | 'maintenance' | 'reports' | 'backup' | 'map'

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
  { id: 'map', label: 'خريطة الفروع', icon: MapPin },
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
  const [dbReady, setDbReady] = useState(false)
  const [dbInitializing, setDbInitializing] = useState(true)
  const [dbInitError, setDbInitError] = useState<string | null>(null)

  // Initialize database schema on app mount
  useEffect(() => {
    const initializeDb = async () => {
      try {
        setDbInitializing(true)
        setDbInitError(null)

        const res = await fetch('/api/db-setup')
        if (!res.ok) {
          const text = await res.text()
          throw new Error(`HTTP ${res.status}: ${text}`)
        }

        const data = await res.json()
        console.log('[DB Init] Database setup:', data.success ? 'SUCCESS' : 'FAILED', data.message)

        if (data.success) {
          setDbReady(true)
          setDbInitError(null)
        } else {
          setDbReady(false)
          setDbInitError(data.message || 'فشل الاتصال بخادم قاعدة البيانات')
        }
      } catch (err: any) {
        console.error('[DB Init] Error:', err)
        setDbReady(false)
        setDbInitError(err?.message || 'حدث خطأ أثناء تهيئة قاعدة البيانات')
      } finally {
        setDbInitializing(false)
      }
    }
    initializeDb()
  }, [])

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
      case 'map':
        return <BranchMap />
      case 'backup':
        return <BackupRestore />
      default:
        return <DashboardSection />
    }
  }

  const currentNav = navItems.find((n) => n.id === activeSection)

  // Show loading screen while database initializes
  if (dbInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-700">جاري تهيئة قاعدة البيانات</h2>
            <p className="text-slate-500">يرجى الانتظار...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!dbReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-lg text-center">
          <h2 className="text-xl font-semibold text-slate-700">فشل تهيئة قاعدة البيانات</h2>
          <p className="mt-3 text-slate-500">{dbInitError || 'حدث خطأ أثناء تهيئة قاعدة البيانات. يرجى إعادة المحاولة.'}</p>
          <button
            onClick={() => {
              setDbInitializing(true)
              setDbReady(false)
              setDbInitError(null)
              fetch('/api/db-setup')
                .then(async (res) => {
                  if (!res.ok) {
                    const text = await res.text()
                    throw new Error(`HTTP ${res.status}: ${text}`)
                  }
                  return res.json()
                })
                .then((data) => {
                  if (data.success) {
                    setDbReady(true)
                  } else {
                    setDbInitError(data.message || 'فشل الاتصال بخادم قاعدة البيانات')
                  }
                })
                .catch((err: any) => {
                  setDbInitError(err?.message || 'حدث خطأ أثناء تهيئة قاعدة البيانات')
                })
                .finally(() => setDbInitializing(false))
            }}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

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
