'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Car,
  ClipboardList,
  Fuel,
  Wrench,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts'

interface DashboardData {
  totalVehicles: number
  openWorkOrders: number
  totalFuelCost: number
  maintenanceAlerts: number
  fuelByBranch: { branch: string; amount: number }[]
  vehicleTypeData: { type: string; count: number }[]
  monthlyTrend: { month: string; amount: number }[]
  recentWorkOrders: {
    id: string
    orderNo: number
    driverName: string
    status: string
    departureKm: number
    estimatedDistance: number
    createdAt: string
    vehicle: { sn: number; model: string; licencePlate: string }
  }[]
  monthNames: string[]
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1']

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'مفتوح', variant: 'outline' },
  in_progress: { label: 'قيد التنفيذ', variant: 'secondary' },
  closed: { label: 'مغلق', variant: 'default' },
}

const formatNumber = (value: number | null | undefined) => Number(value ?? 0).toLocaleString('ar-SA')

export default function DashboardSection() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((d) => {
        // Ensure all required arrays exist with defaults
        const safeData = {
          ...d,
          fuelByBranch: d.fuelByBranch || [],
          vehicleTypeData: d.vehicleTypeData || [],
          monthlyTrend: d.monthlyTrend || [],
          recentWorkOrders: d.recentWorkOrders || [],
          monthNames: d.monthNames || ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
        }
        setData(safeData)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Dashboard fetch error:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (!data) return <div className="text-center py-10 text-slate-500">خطأ في تحميل البيانات</div>

  const formatMonth = (monthStr: string) => {
    const [y, m] = monthStr.split('-')
    const monthIdx = parseInt(m) - 1
    return data.monthNames[monthIdx] || m
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">إجمالي المركبات</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{data.totalVehicles}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Car className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">أوامر الشغل المفتوحة</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{data.openWorkOrders}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">تكلفة الوقود هذا الشهر</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {formatNumber(data.totalFuelCost)} ج.م
                </p>
                <p className="text-xs text-slate-400 mt-1">جنيه مصري</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Fuel className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">تنبيهات الصيانة</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{data.maintenanceAlerts}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel by Branch */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <Fuel className="w-4 h-4 text-emerald-500" />
              استهلاك الوقود حسب الفرع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.fuelByBranch} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="branch"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: number) => [`${formatNumber(value)} ج.م`, 'التكلفة']}
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Vehicles by Type Pie */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <Car className="w-4 h-4 text-emerald-500" />
              المركبات حسب النوع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.vehicleTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="type"
                    label={({ type, count }) => `${type} (${count})`}
                  >
                    {data.vehicleTypeData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'عدد المركبات']} />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            اتجاه إنفاق الوقود الشهري
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyTrend.map((m) => ({ ...m, monthLabel: formatMonth(m.month) }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => [`${formatNumber(value)} ج.م`, 'الإنفاق']}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#059669' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Work Orders */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-emerald-500" />
            أحدث أوامر الشغل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-right py-3 px-3 font-semibold text-slate-600">رقم الأمر</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600">المركبة</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600">السائق</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600">الحالة</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600">المسافة المقدرة</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {data.recentWorkOrders.map((wo) => {
                  const st = statusMap[wo.status] || statusMap.open
                  return (
                    <tr key={wo.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-mono text-slate-700">#{wo.orderNo}</td>
                      <td className="py-3 px-3 text-slate-600">
                        {wo.vehicle?.model} - {wo.vehicle?.licencePlate}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{wo.driverName}</td>
                      <td className="py-3 px-3">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{wo.estimatedDistance} كم</td>
                      <td className="py-3 px-3 text-slate-400 text-xs">
                        {new Date(wo.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                    </tr>
                  )
                })}
                {data.recentWorkOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      لا توجد أوامر شغل حالياً
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
