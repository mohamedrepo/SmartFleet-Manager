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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, Car, Filter, ChevronLeft, ChevronRight, Info, X } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface Vehicle {
  id: string
  sn: number
  type: string
  model: string
  licencePlate: string
  licenceNo: number
  year: number
  chassisNo: string
  engineSn: string
  fuel: string
  allocations: number
  tankCapacity: number
  kmReading: number
  fuelRate: number
  branch: string
  cardName: string
  cardNo: string
  openingBalance: number
  _count?: {
    workOrders: number
    fuelTransactions: number
    maintenanceRecords: number
    tires: number
    spareParts: number
  }
  workOrders?: any[]
  fuelTransactions?: any[]
  maintenanceRecords?: any[]
  tires?: any[]
  spareParts?: any[]
}

interface VehicleListResponse {
  vehicles: Vehicle[]
  total: number
  page: number
  totalPages: number
}

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [fuelFilter, setFuelFilter] = useState('')
  const [branches, setBranches] = useState<string[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const limit = 15

  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    if (branchFilter) params.set('branch', branchFilter)
    if (typeFilter) params.set('type', typeFilter)
    if (fuelFilter) params.set('fuel', fuelFilter)

    try {
      const res = await fetch(`/api/vehicles?${params}`)
      const data: VehicleListResponse = await res.json()
      if (data.vehicles && Array.isArray(data.vehicles)) {
        setVehicles(data.vehicles)
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 1)
      } else {
        setVehicles([])
        setTotal(0)
        setTotalPages(1)
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err)
      setVehicles([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, search, branchFilter, typeFilter, fuelFilter])

  const fetchFilters = useCallback(async () => {
    try {
      const res = await fetch('/api/vehicles?limit=200')
      const data: VehicleListResponse = await res.json()
      if (data.vehicles && Array.isArray(data.vehicles)) {
        const b = [...new Set(data.vehicles.map((v) => v.branch).filter(Boolean))].sort()
        const t = [...new Set(data.vehicles.map((v) => v.type).filter(Boolean))].sort()
        setBranches(b)
        setTypes(t)
      }
    } catch (err) {
      console.error('Error fetching filters:', err)
    }
  }, [])

  useEffect(() => {
    fetchVehicles()
  }, [fetchVehicles])

  useEffect(() => {
    fetchFilters()
  }, [fetchFilters])

  const openVehicleDetail = async (vehicleId: string) => {
    setDetailLoading(true)
    setDetailOpen(true)
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`)
      const data = await res.json()
      setSelectedVehicle(data)
    } catch (err) {
      console.error(err)
    } finally {
      setDetailLoading(false)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setBranchFilter('')
    setTypeFilter('')
    setFuelFilter('')
    setPage(1)
  }

  const hasFilters = search || branchFilter || typeFilter || fuelFilter

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-600">البحث والتصفية</span>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-red-500 mr-auto">
                <X className="w-3 h-3 ml-1" /> مسح الفلاتر
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="بحث بلوحة، موديل، هيكل..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pr-9 text-sm"
              />
            </div>
            <Select value={branchFilter} onValueChange={(v) => { setBranchFilter(v === '__all__' ? '' : v); setPage(1) }}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="كل الفروع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">كل الفروع</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === '__all__' ? '' : v); setPage(1) }}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="كل الأنواع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">كل الأنواع</SelectItem>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={fuelFilter} onValueChange={(v) => { setFuelFilter(v === '__all__' ? '' : v); setPage(1) }}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="كل أنواع الوقود" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">كل أنواع الوقود</SelectItem>
                <SelectItem value="بنزين">بنزين</SelectItem>
                <SelectItem value="ديزل">ديزل</SelectItem>
                <SelectItem value="كهربائي">كهربائي</SelectItem>
                <SelectItem value="هايبرد">هايبرد</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          إجمالي النتائج: <span className="font-bold text-slate-700">{total}</span> مركبة
        </p>
      </div>

      {/* Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs">#</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs">رقم المركبة</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs">النوع</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs">الموديل</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs">رقم اللوحة</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs">الوقود</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs">الفرع</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs">العداد</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto" />
                    </td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400">
                      لا توجد مركبات
                    </td>
                  </tr>
                ) : (
                  vehicles.map((v, i) => (
                    <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-400">{(page - 1) * limit + i + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{v.sn}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs">{v.type}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{v.model}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{v.licencePlate}</td>
                      <td className="py-3 px-4 text-slate-500">{v.fuel}</td>
                      <td className="py-3 px-4 text-slate-500">{v.branch}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{v.kmReading.toLocaleString()} كم</td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openVehicleDetail(v.id)}
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="text-sm text-slate-600 px-3">
                صفحة {page} من {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Car className="w-5 h-5 text-emerald-500" />
              تفاصيل المركبة
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : selectedVehicle ? (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['رقم المركبة', selectedVehicle.sn],
                  ['النوع', selectedVehicle.type],
                  ['الموديل', selectedVehicle.model],
                  ['رقم اللوحة', selectedVehicle.licencePlate],
                  ['رقم الرخصة', selectedVehicle.licenceNo],
                  ['سنة الصنع', selectedVehicle.year],
                  ['رقم الهيكل', selectedVehicle.chassisNo],
                  ['رقم المحرك', selectedVehicle.engineSn],
                  ['نوع الوقود', selectedVehicle.fuel],
                  ['سعة الخزان', `${selectedVehicle.tankCapacity} لتر`],
                  ['قراءة العداد', `${selectedVehicle.kmReading.toLocaleString()} كم`],
                  ['معدل الاستهلاك', `${selectedVehicle.fuelRate} كم/لتر`],
                  ['الفرع', selectedVehicle.branch],
                  ['اسم البطاقة', selectedVehicle.cardName],
                  ['رقم البطاقة', selectedVehicle.cardNo],
                  ['الرصيد الافتتاحي', selectedVehicle.openingBalance?.toLocaleString() + ' ج.م'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">{label}</p>
                    <p className="text-sm font-medium text-slate-700">{value}</p>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Counts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{selectedVehicle._count?.workOrders || selectedVehicle.workOrders?.length || 0}</p>
                  <p className="text-xs text-blue-500 mt-1">أوامر الشغل</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{selectedVehicle._count?.fuelTransactions || selectedVehicle.fuelTransactions?.length || 0}</p>
                  <p className="text-xs text-amber-500 mt-1">معاملات الوقود</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{selectedVehicle._count?.maintenanceRecords || selectedVehicle.maintenanceRecords?.length || 0}</p>
                  <p className="text-xs text-emerald-500 mt-1">سجلات الصيانة</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">{selectedVehicle._count?.tires || selectedVehicle.tires?.length || 0}</p>
                  <p className="text-xs text-purple-500 mt-1">الإطارات</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-10 text-slate-400">لم يتم العثور على بيانات المركبة</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
