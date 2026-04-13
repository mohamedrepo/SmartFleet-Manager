'use client'

import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
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
}

interface VehicleListResponse {
  vehicles: Vehicle[]
  total: number
  page: number
  totalPages: number
}

interface VehicleDetailResponse extends Vehicle {
  workOrders?: any[]
  fuelTransactions?: any[]
  maintenanceRecords?: any[]
  tires?: any[]
  spareParts?: any[]
}

const LIMIT = 15

async function fetchVehicles(
  page: number,
  search: string,
  branch: string,
  type: string,
  fuel: string
): Promise<VehicleListResponse> {
  const params = new URLSearchParams({ 
    page: String(page), 
    limit: String(LIMIT) 
  })
  if (search) params.set('search', search)
  if (branch) params.set('branch', branch)
  if (type) params.set('type', type)
  if (fuel) params.set('fuel', fuel)

  const res = await fetch(`/api/vehicles?${params}`)
  if (!res.ok) throw new Error('Failed to fetch vehicles')
  return res.json()
}

async function fetchVehicleDetail(vehicleId: string): Promise<VehicleDetailResponse> {
  const res = await fetch(`/api/vehicles/${vehicleId}`)
  if (!res.ok) throw new Error('Failed to fetch vehicle details')
  return res.json()
}

async function fetchFilterOptions(): Promise<{ branches: string[]; types: string[] }> {
  const res = await fetch(`/api/vehicles?limit=200`)
  if (!res.ok) throw new Error('Failed to fetch filter options')
  const data: VehicleListResponse = await res.json()
  
  const branches = [...new Set<string>(
    data.vehicles.map((v) => v.branch).filter(Boolean)
  )].sort()
  const types = [...new Set<string>(
    data.vehicles.map((v) => v.type).filter(Boolean)
  )].sort()
  
  return { branches, types }
}

export default function VehicleManagement() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [fuelFilter, setFuelFilter] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Fetch vehicles with React Query - automatic caching & deduplication
  const {
    data: vehicleData,
    isLoading,
    error: vehicleError,
  } = useQuery({
    queryKey: ['vehicles', { page, search, branchFilter, typeFilter, fuelFilter }],
    queryFn: () =>
      fetchVehicles(page, search, branchFilter, typeFilter, fuelFilter),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime)
  })

  // Fetch filter options
  const { data: filterData } = useQuery({
    queryKey: ['vehicleFilters'],
    queryFn: fetchFilterOptions,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  })

  // Fetch selected vehicle details
  const {
    data: selectedVehicle,
    isLoading: detailLoading,
  } = useQuery({
    queryKey: ['vehicle', selectedVehicleId],
    queryFn: () => selectedVehicleId ? fetchVehicleDetail(selectedVehicleId) : null,
    enabled: selectedVehicleId !== null,
    staleTime: 1000 * 60 * 5,
  })

  // Computed values
  const vehicles = vehicleData?.vehicles || []
  const total = vehicleData?.total || 0
  const totalPages = vehicleData?.totalPages || 1
  const branches = filterData?.branches || []
  const types = filterData?.types || []
  const hasFilters = search || branchFilter || typeFilter || fuelFilter

  const handleOpenDetail = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId)
    setDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setDetailOpen(false)
    setSelectedVehicleId(null)
  }

  const clearFilters = () => {
    setSearch('')
    setBranchFilter('')
    setTypeFilter('')
    setFuelFilter('')
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-600">البحث والتصفية</span>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-red-500 mr-auto"
              >
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
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pr-9 text-sm"
              />
            </div>
            <Select
              value={branchFilter}
              onValueChange={(v) => {
                setBranchFilter(v === '__all__' ? '' : v)
                setPage(1)
              }}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="كل الفروع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">كل الفروع</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v === '__all__' ? '' : v)
                setPage(1)
              }}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="كل الأنواع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">كل الأنواع</SelectItem>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={fuelFilter}
              onValueChange={(v) => {
                setFuelFilter(v === '__all__' ? '' : v)
                setPage(1)
              }}
            >
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

      {/* Error message */}
      {vehicleError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-red-600">حدث خطأ في تحميل المركبات. يرجى المحاولة لاحقاً.</p>
          </CardContent>
        </Card>
      )}

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
                {isLoading ? (
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
                    <tr
                      key={v.id}
                      className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-400">{(page - 1) * LIMIT + i + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{v.sn}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs">
                          {v.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{v.model}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{v.licencePlate}</td>
                      <td className="py-3 px-4 text-slate-500">{v.fuel}</td>
                      <td className="py-3 px-4 text-slate-500">{v.branch}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {v.kmReading.toLocaleString()} كم
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetail(v.id)}
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
      <Dialog open={detailOpen} onOpenChange={handleCloseDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailLoading ? 'جاري التحميل...' : `تفاصيل المركبة - ${selectedVehicle?.licencePlate}`}
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
            </div>
          ) : selectedVehicle ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold text-slate-700 mb-3">المعلومات الأساسية</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs">رقم المركبة</p>
                    <p className="font-medium text-slate-700">{selectedVehicle.sn}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">النوع</p>
                    <p className="font-medium text-slate-700">{selectedVehicle.type}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">الموديل</p>
                    <p className="font-medium text-slate-700">{selectedVehicle.model}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">السنة</p>
                    <p className="font-medium text-slate-700">{selectedVehicle.year}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">رقم اللوحة</p>
                    <p className="font-medium text-slate-700">{selectedVehicle.licencePlate}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">الفرع</p>
                    <p className="font-medium text-slate-700">{selectedVehicle.branch}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Technical Info */}
              <div>
                <h3 className="font-semibold text-slate-700 mb-3">المعلومات التقنية</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs">رقم الهيكل</p>
                    <p className="font-mono text-slate-700 text-xs">{selectedVehicle.chassisNo}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">رقم المحرك</p>
                    <p className="font-mono text-slate-700 text-xs">{selectedVehicle.engineSn}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">نوع الوقود</p>
                    <p className="font-medium text-slate-700">{selectedVehicle.fuel}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">سعة الخزان</p>
                    <p className="font-medium text-slate-700">{selectedVehicle.tankCapacity} لتر</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">العداد</p>
                    <p className="font-mono text-slate-700">{selectedVehicle.kmReading.toLocaleString()} كم</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">متوسط الاستهلاك اليومي</p>
                    <p className="font-medium text-slate-700">{selectedVehicle.fuelRate} لتر</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Card Info */}
              <div>
                <h3 className="font-semibold text-slate-700 mb-3">بيانات البطاقة</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs">اسم البطاقة</p>
                    <p className="font-medium text-slate-700">{selectedVehicle.cardName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">رقم البطاقة</p>
                    <p className="font-mono text-slate-700">{selectedVehicle.cardNo}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">الرصيد الافتتاحي</p>
                    <p className="font-medium text-slate-700">
                      {selectedVehicle.openingBalance.toLocaleString()} ر.س
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
