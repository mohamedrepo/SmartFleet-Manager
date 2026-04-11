'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChevronLeft,
  ChevronRight,
  Fuel,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowUpRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface FuelTransaction {
  id: string
  vehicleId: string
  cardNumber: string
  cardName: string
  onlineBalance: number
  transactionDate: string
  description: string
  amount: number
  type: string
  vehicle: { sn: number; model: string; licencePlate: string; branch: string }
}

interface FuelData {
  transactions: FuelTransaction[]
  total: number
  page: number
  totalPages: number
  totalPurchases: number
  totalPayments: number
  balance: number
  spendingPerVehicle: {
    vehicleId: string
    vehicle: { sn: number; model: string; licencePlate: string } | null
    amount: number
  }[]
}

const defaultFuelData: FuelData = {
  transactions: [],
  total: 0,
  page: 1,
  totalPages: 1,
  totalPurchases: 0,
  totalPayments: 0,
  balance: 0,
  spendingPerVehicle: [],
}

export default function FuelMonitoring() {
  const [data, setData] = useState<FuelData>(defaultFuelData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [limit] = useState(15)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (vehicleFilter) params.set('vehicleId', vehicleFilter)
    if (typeFilter) params.set('type', typeFilter)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)

    try {
      const res = await fetch(`/api/fuel-transactions?${params}`)
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`)
      }

      if (typeof json !== 'object' || Array.isArray(json)) {
        throw new Error('Invalid fuel transactions response')
      }

      setData({
        transactions: Array.isArray(json.transactions) ? json.transactions : [],
        total: Number(json.total ?? 0),
        page: Number(json.page ?? 1),
        totalPages: Number(json.totalPages ?? 1),
        totalPurchases: Number(json.totalPurchases ?? 0),
        totalPayments: Number(json.totalPayments ?? 0),
        balance: Number(json.balance ?? 0),
        spendingPerVehicle: Array.isArray(json.spendingPerVehicle)
          ? json.spendingPerVehicle.map((item: any) => ({
              vehicleId: item.vehicleId,
              vehicle: item.vehicle ?? null,
              amount: Number(item.amount ?? 0),
            }))
          : [],
      })
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'خطأ في تحميل بيانات الوقود')
      setData(defaultFuelData)
    } finally {
      setLoading(false)
    }
  }, [page, vehicleFilter, typeFilter, startDate, endDate])

  useEffect(() => { fetchData() }, [fetchData])

  const clearFilters = () => {
    setVehicleFilter('')
    setTypeFilter('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const hasFilters = vehicleFilter || typeFilter || startDate || endDate

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 px-4">
        <div className="max-w-xl w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-700">خطأ في تحميل بيانات الوقود</p>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <button
            onClick={fetchData}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">إجمالي المشتريات</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {(data.totalPurchases ?? 0).toLocaleString('ar-SA')} ج.م
                </p>
                <p className="text-xs text-slate-400">جنيه مصري</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">إجمالي المدفوعات</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {(data.totalPayments ?? 0).toLocaleString('ar-SA')} ج.م
                </p>
                <p className="text-xs text-slate-400">جنيه مصري</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">الرصيد المتبقي</p>
                <p className={`text-2xl font-bold mt-1 ${(data.balance ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {(data.balance ?? 0).toLocaleString('ar-SA')} ج.م
                </p>
                <p className="text-xs text-slate-400">جنيه مصري</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Fuel className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart: Top 10 spending */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            إنفاق الوقود لكل مركبة (أعلى 10)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(data.spendingPerVehicle || []).map((s) => ({
                  name: s.vehicle ? `${s.vehicle.sn}` : 'غير معروف',
                  amount: Math.round(s.amount),
                  plate: s.vehicle?.licencePlate || '',
                }))}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'amount') return [`${value.toLocaleString()} ج.م`, 'المبلغ']
                    return [value]
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]?.payload?.plate) {
                      return `مركبة #${label} - ${payload[0].payload.plate}`
                    }
                    return `مركبة #${label}`
                  }}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">رقم المركبة</label>
              <Input
                value={vehicleFilter}
                onChange={(e) => { setVehicleFilter(e.target.value); setPage(1) }}
                placeholder="ابحث بمعرف المركبة..."
                className="text-sm w-[200px]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">نوع المعاملة</label>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === '__all__' ? '' : v); setPage(1) }}>
                <SelectTrigger className="text-sm w-[150px]">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">الكل</SelectItem>
                  <SelectItem value="D">مشتريات (مدين)</SelectItem>
                  <SelectItem value="C">مدفوعات (دائن)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">من تاريخ</label>
              <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1) }} className="text-sm w-[160px]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">إلى تاريخ</label>
              <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1) }} className="text-sm w-[160px]" />
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500 text-xs">
                مسح الفلاتر
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">التاريخ</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">المركبة</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">رقم البطاقة</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">الوصف</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">المبلغ</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">النوع</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">الرصيد</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto" />
                    </td>
                  </tr>
                ) : (data.transactions || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">لا توجد معاملات</td>
                  </tr>
                ) : (
                  (data.transactions || []).map((t) => (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                      <td className="py-3 px-3 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(t.transactionDate).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        #{t.vehicle?.sn} - {t.vehicle?.licencePlate}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono">{t.cardNumber}</td>
                      <td className="py-3 px-3 text-slate-500 max-w-[200px] truncate">{t.description}</td>
                      <td className={`py-3 px-3 font-semibold ${t.type === 'D' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {t.type === 'D' ? '+' : '-'}{t.amount.toLocaleString()} ج.م
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={t.type === 'D' ? 'destructive' : 'default'} className="text-xs">
                          {t.type === 'D' ? 'مشتريات' : 'مدفوعات'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{t.onlineBalance.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4 border-t border-slate-100">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="text-sm text-slate-600 px-3">صفحة {data.page} من {data.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
