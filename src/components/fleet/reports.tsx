'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  Fuel,
  TrendingUp,
  Wrench,
  BarChart3,
  Download,
} from 'lucide-react'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#e11d48']

interface FuelConsumptionItem {
  vehicleId: string
  sn: number
  model: string
  licencePlate: string
  branch: string
  fuel: string
  kmReading: number
  totalFuelCost: number
  estimatedLiters: number
  kmPerLiter: number
  fuelRate: number
  transactionCount: number
}

interface DeviationItem {
  orderNo: number
  vehicle: { sn: number; model: string; licencePlate: string; branch: string }
  driverName: string
  branch: string
  departureKm: number
  returnKm: number | null
  estimatedDistance: number
  actualDistance: number | null
  distanceDeviation: number | null
  deviationPercent: number
  departureDate: string
  returnDate: string | null
}

interface MaintenanceCostItem {
  vehicleId: string
  vehicle: { sn: number; model: string; licencePlate: string; branch: string } | null
  totalCost: number
  recordCount: number
}

interface MaintenanceTypeItem {
  type: string
  typeLabel: string
  totalCost: number
  recordCount: number
}

export default function ReportsSection() {
  // Fuel consumption report
  const [fuelData, setFuelData] = useState<FuelConsumptionItem[]>([])
  const [fuelLoading, setFuelLoading] = useState(true)
  const [fuelError, setFuelError] = useState<string | null>(null)

  // Distance deviation report
  const [deviationData, setDeviationData] = useState<DeviationItem[]>([])
  const [deviationSummary, setDeviationSummary] = useState({
    totalOrders: 0,
    totalEstimated: 0,
    totalActual: 0,
    totalDeviation: 0,
    avgDeviationPercent: 0,
  })
  const [deviationLoading, setDeviationLoading] = useState(true)

  // Maintenance cost report
  const [maintCostData, setMaintCostData] = useState<MaintenanceCostItem[]>([])
  const [maintTypeData, setMaintTypeData] = useState<MaintenanceTypeItem[]>([])
  const [maintSummary, setMaintSummary] = useState({
    totalCost: 0,
    vehicleCount: 0,
    totalRecords: 0,
  })
  const [maintLoading, setMaintLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchFuelData = useCallback(async () => {
    setFuelLoading(true)
    setFuelError(null)
    try {
      const res = await fetch('/api/reports/fuel-consumption')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`)
      }

      if (!Array.isArray(data)) {
        throw new Error('Invalid fuel report response')
      }

      setFuelData(data)
    } catch (err: any) {
      console.error(err)
      setFuelError(err?.message || 'خطأ في تحميل تقرير الوقود')
      setFuelData([])
    } finally {
      setFuelLoading(false)
    }
  }, [])

  const fetchDeviationData = useCallback(async () => {
    setDeviationLoading(true)
    try {
      const res = await fetch('/api/reports/distance-deviation')
      const data = await res.json()
      setDeviationData(data.report || [])
      setDeviationSummary(data.summary || { totalOrders: 0, totalEstimated: 0, totalActual: 0, totalDeviation: 0, avgDeviationPercent: 0 })
    } catch (err) {
      console.error(err)
    } finally {
      setDeviationLoading(false)
    }
  }, [])

  const fetchMaintCostData = useCallback(async () => {
    setMaintLoading(true)
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    try {
      const res = await fetch(`/api/reports/maintenance-cost?${params}`)
      const data = await res.json()
      setMaintCostData(data.report || [])
      setMaintTypeData(data.typeReport || [])
      setMaintSummary(data.summary || { totalCost: 0, vehicleCount: 0, totalRecords: 0 })
    } catch (err) {
      console.error(err)
    } finally {
      setMaintLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => { fetchFuelData() }, [fetchFuelData])
  useEffect(() => { fetchDeviationData() }, [fetchDeviationData])
  useEffect(() => { fetchMaintCostData() }, [fetchMaintCostData])

  // Chart data
  const topFuelConsumers = Array.isArray(fuelData)
    ? fuelData.slice(0, 10).map((v) => ({
        name: `#${v.sn}`,
        cost: v.totalFuelCost,
        kmPerLiter: v.kmPerLiter,
      }))
    : []

  const topMaintSpenders = maintCostData.slice(0, 10).map((v) => ({
    name: v.vehicle ? `#${v.vehicle.sn}` : 'غير معروف',
    cost: Math.round(v.totalCost),
  }))

  return (
    <div className="space-y-4">
      <Tabs defaultValue="fuel" dir="rtl">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="fuel" className="gap-1.5">
            <Fuel className="w-4 h-4" />
            استهلاك الوقود
          </TabsTrigger>
          <TabsTrigger value="deviation" className="gap-1.5">
            <TrendingUp className="w-4 h-4" />
            انحراف المسافة
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-1.5">
            <Wrench className="w-4 h-4" />
            تكاليف الصيانة
          </TabsTrigger>
        </TabsList>

        {/* Fuel Consumption Report */}
        <TabsContent value="fuel" className="space-y-4 mt-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                أعلى 10 مركبات استهلاكاً للوقود
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topFuelConsumers} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      formatter={(value: number, name: string) => {
                        if (name === 'cost') return [`${value.toLocaleString()} ج.م`, 'التكلفة']
                        if (name === 'kmPerLiter') return [value, 'كم/لتر']
                        return [value]
                      }}
                    />
                    <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} name="cost" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">#</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">المركبة</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">اللوحة</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">الفرع</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">العداد</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">تكلفة الوقود</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">الليترات المقدرة</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">كم/لتر</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">عدد المعاملات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fuelLoading ? (
                      <tr><td colSpan={9} className="text-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto" /></td></tr>
                    ) : fuelData.length === 0 ? (
                      <tr><td colSpan={9} className="text-center py-10 text-slate-400">لا توجد بيانات</td></tr>
                    ) : fuelData.map((v, i) => (
                      <tr key={v.vehicleId} className="border-b border-slate-100 hover:bg-slate-50/80">
                        <td className="py-3 px-3 text-slate-400">{i + 1}</td>
                        <td className="py-3 px-3 text-slate-700 font-medium">#{v.sn} - {v.model}</td>
                        <td className="py-3 px-3 text-slate-600">{v.licencePlate}</td>
                        <td className="py-3 px-3 text-slate-500">{v.branch}</td>
                        <td className="py-3 px-3 font-mono text-slate-600">{v.kmReading.toLocaleString()}</td>
                        <td className="py-3 px-3 font-semibold text-red-600">{v.totalFuelCost.toLocaleString()} ج.م</td>
                        <td className="py-3 px-3 text-slate-500">{v.estimatedLiters.toLocaleString()} لتر</td>
                        <td className="py-3 px-3">
                          <Badge variant={v.kmPerLiter > 10 ? 'default' : v.kmPerLiter > 5 ? 'secondary' : 'destructive'} className="text-xs">
                            {v.kmPerLiter} كم/لتر
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{v.transactionCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distance Deviation Report */}
        <TabsContent value="deviation" className="space-y-4 mt-4">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-slate-800">{deviationSummary.totalOrders}</p>
                <p className="text-xs text-slate-500 mt-1">أوامر مكتملة</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-slate-800">{deviationSummary.totalEstimated.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">إجمالي المقدر (كم)</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-slate-800">{deviationSummary.totalActual.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">إجمالي الفعلي (كم)</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${deviationSummary.avgDeviationPercent > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {deviationSummary.avgDeviationPercent}%
                </p>
                <p className="text-xs text-slate-500 mt-1">متوسط الانحراف</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          {deviationData.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  مقارنة المسافة المقدرة vs الفعلية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={deviationData.slice(0, 15).map((d) => ({
                        name: `#${d.orderNo}`,
                        estimated: d.estimatedDistance,
                        actual: d.actualDistance || 0,
                        deviation: d.distanceDeviation || 0,
                      }))}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                      <Legend />
                      <Bar dataKey="estimated" fill="#10b981" radius={[2, 2, 0, 0]} name="المقدرة" />
                      <Bar dataKey="actual" fill="#3b82f6" radius={[2, 2, 0, 0]} name="الفعلي" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">#</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">المركبة</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">السائق</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">المقدرة</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">الفعلية</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">الانحراف</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">النسبة</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deviationLoading ? (
                      <tr><td colSpan={8} className="text-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto" /></td></tr>
                    ) : deviationData.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-10 text-slate-400">لا توجد أوامر مكتملة</td></tr>
                    ) : deviationData.map((d, i) => (
                      <tr key={d.orderNo} className="border-b border-slate-100 hover:bg-slate-50/80">
                        <td className="py-3 px-3 text-slate-400">{i + 1}</td>
                        <td className="py-3 px-3 text-slate-700">#{d.vehicle?.sn} - {d.vehicle?.licencePlate}</td>
                        <td className="py-3 px-3 text-slate-600">{d.driverName}</td>
                        <td className="py-3 px-3 text-slate-500">{d.estimatedDistance.toLocaleString()} كم</td>
                        <td className="py-3 px-3 text-slate-600">{(d.actualDistance || 0).toLocaleString()} كم</td>
                        <td className={`py-3 px-3 font-semibold ${(d.distanceDeviation || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {(d.distanceDeviation || 0) > 0 ? '+' : ''}{(d.distanceDeviation || 0).toLocaleString()} كم
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={d.deviationPercent > 10 ? 'destructive' : d.deviationPercent > 0 ? 'secondary' : 'default'} className="text-xs">
                            {d.deviationPercent > 0 ? '+' : ''}{d.deviationPercent}%
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-xs">
                          {new Date(d.departureDate).toLocaleDateString('ar-SA')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Cost Report */}
        <TabsContent value="maintenance" className="space-y-4 mt-4">
          {/* Date filters */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">من تاريخ</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-sm w-[160px]" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">إلى تاريخ</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-sm w-[160px]" />
                </div>
                <Button variant="outline" size="sm" onClick={() => { setStartDate(''); setEndDate('') }} className="text-xs">
                  مسح الفلاتر
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">إجمالي التكاليف</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{maintSummary.totalCost.toLocaleString()} ج.م</p>
                    <p className="text-xs text-slate-400">جنيه مصري</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">عدد المركبات</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{maintSummary.vehicleCount}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Fuel className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">إجمالي السجلات</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{maintSummary.totalRecords}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost by Vehicle */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-700">تكاليف الصيانة لكل مركبة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topMaintSpenders} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        formatter={(value: number) => [`${value.toLocaleString()} ج.م`, 'التكلفة']}
                      />
                      <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Cost by Type Pie */}
            {maintTypeData.length > 0 && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-700">تكاليف حسب نوع الصيانة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={maintTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="totalCost"
                          nameKey="typeLabel"
                          label={({ typeLabel, percent }) => `${typeLabel} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {maintTypeData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value.toLocaleString()} ج.م`, 'التكلفة']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Table */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">#</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">المركبة</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">اللوحة</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">الفرع</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">الإجمالي</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">عدد السجلات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintLoading ? (
                      <tr><td colSpan={6} className="text-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto" /></td></tr>
                    ) : maintCostData.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-slate-400">لا توجد بيانات</td></tr>
                    ) : maintCostData.map((v, i) => (
                      <tr key={v.vehicleId} className="border-b border-slate-100 hover:bg-slate-50/80">
                        <td className="py-3 px-3 text-slate-400">{i + 1}</td>
                        <td className="py-3 px-3 text-slate-700 font-medium">#{v.vehicle?.sn} - {v.vehicle?.model}</td>
                        <td className="py-3 px-3 text-slate-600">{v.vehicle?.licencePlate || '-'}</td>
                        <td className="py-3 px-3 text-slate-500">{v.vehicle?.branch || '-'}</td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{Math.round(v.totalCost).toLocaleString()} ج.م</td>
                        <td className="py-3 px-3 text-slate-500">{v.recordCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
