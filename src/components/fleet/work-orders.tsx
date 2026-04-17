'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Trash2,
  CheckCircle,
  MapPin,
  Search,
  Route,
  Clock,
  Navigation,
  Loader2,
  MapPinned,
  ArrowRightLeft,
  Info,
  RotateCcw,
  ArrowDown,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WorkOrder {
  id: string
  orderNo: number
  vehicleId: string
  driverName: string
  distributor: string
  departureBranch: string
  destinationBranch: string
  branch: string
  departureKm: number
  stops: string
  estimatedDistance: number
  estimatedFuel: number
  estimatedTime: string
  estimatedArrival: string
  returnKm: number | null
  actualDistance: number | null
  distanceDeviation: number | null
  status: string
  departureDate: string
  returnDate: string | null
  notes: string
  vehicle: { sn: number; model: string; licencePlate: string; branch: string }
}

interface Vehicle {
  id: string
  sn: number
  model: string
  licencePlate: string
  kmReading: number
  fuelRate: number
  branch: string
}

interface StopPoint {
  name: string
  lat: number
  lon: number
  displayName: string
}

interface SearchResult {
  placeId: number
  displayName: string
  lat: number
  lon: number
  type: string
  class: string
}

interface RouteSegment {
  from: string
  to: string
  distanceKm: number
  durationMin: number
  type: 'outbound' | 'return'
}

interface RouteResult {
  outboundDistance: number
  outboundDuration: number
  outboundTime: string
  outboundArrival: string
  returnDistance: number
  returnDuration: number
  returnTime: string
  returnArrival: string
  totalDistance: number
  totalDuration: number
  totalTime: string
  totalArrival: string
  hasReturn: boolean
  segments: RouteSegment[]
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'مفتوح', variant: 'outline' },
  in_progress: { label: 'قيد التنفيذ', variant: 'secondary' },
  closed: { label: 'مغلق', variant: 'default' },
}

const BRANCHES = [
  'السيارات', 'المشتريات', 'العطاءات', 'البيع الرئيسي',
  'القاهره الكبرى', 'أسيوط', 'العامريه', 'الاميريه', 'السكرتاريه العامه',
]

function GeocodeInput({
  value,
  onChange,
  placeholder,
  label,
  index,
  isReturn,
}: {
  value: StopPoint
  onChange: (val: StopPoint) => void
  placeholder: string
  label?: string
  index: number
  isReturn?: boolean
}) {
  const [query, setQuery] = useState(value.name || '')
  const [results, setResults] = useState<SearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value.name || '')
  }, [value.name])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = useCallback((text: string) => {
    setQuery(text)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)

    if (text.trim().length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    setSearching(true)
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(text)}`)
        const data = await res.json()
        setResults(data.results || [])
        setShowDropdown(data.results?.length > 0)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }, [])

  const selectResult = (r: SearchResult) => {
    const shortName = r.displayName.split(',').slice(0, 2).join(',')
    setQuery(shortName)
    onChange({ name: shortName, lat: r.lat, lon: r.lon, displayName: r.displayName })
    setShowDropdown(false)
    setResults([])
  }

  return (
    <div className="space-y-1" ref={containerRef}>
      {label && (
        <Label className="text-xs text-slate-500 flex items-center gap-1">
          {isReturn ? (
            <RotateCcw className="w-3 h-3 text-purple-500" />
          ) : index === 0 ? (
            <MapPinned className="w-3 h-3 text-emerald-500" />
          ) : (
            <MapPin className="w-3 h-3 text-amber-500" />
          )}
          {label}
        </Label>
      )}
      <div className="relative">
        <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="pr-8 text-sm"
        />
        {searching && (
          <Loader2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 animate-spin" />
        )}
        {value.lat > 0 && value.lon > 0 && !searching && (
          <MapPin className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isReturn ? 'text-purple-500' : 'text-emerald-500'}`} />
        )}

        {showDropdown && results.length > 0 && (
          <div className="absolute top-full mt-1 right-0 left-0 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-56 overflow-y-auto">
            {results.map((r) => (
              <button
                key={r.placeId}
                type="button"
                className="w-full text-right px-3 py-2 text-sm hover:bg-emerald-50 border-b border-slate-100 last:border-0 transition-colors"
                onClick={() => selectResult(r)}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-slate-700 truncate">{r.displayName.split(',').slice(0, 2).join(',')}</p>
                    <p className="text-xs text-slate-400 truncate">{r.displayName}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function WorkOrders() {
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  // Create form
  const [createOpen, setCreateOpen] = useState(false)
  const [formVehicleId, setFormVehicleId] = useState('')
  const [formDriverName, setFormDriverName] = useState('')
  const [formDistributor, setFormDistributor] = useState('')
  const [formDepartureBranch, setFormDepartureBranch] = useState('')
  const [formDestinationBranch, setFormDestinationBranch] = useState('')
  const [formDepartureKm, setFormDepartureKm] = useState('')
  const [formStops, setFormStops] = useState<StopPoint[]>([{ name: '', lat: 0, lon: 0, displayName: '' }])
  const [formEstimatedDistance, setFormEstimatedDistance] = useState('')
  const [formEstimatedFuel, setFormEstimatedFuel] = useState('')
  const [formEstimatedTime, setFormEstimatedTime] = useState('')
  const [formEstimatedArrival, setFormEstimatedArrival] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null)
  const [routeError, setRouteError] = useState('')

  // Close form
  const [closeOrderId, setCloseOrderId] = useState<string | null>(null)
  const [closeReturnKm, setCloseReturnKm] = useState('')
  const [closing, setClosing] = useState(false)

  const { toast } = useToast()
  const limit = 15

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (statusFilter) params.set('status', statusFilter)
    try {
      const res = await fetch(`/api/work-orders?${params}`)
      const data = await res.json()
      setOrders(data.workOrders || [])
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch('/api/vehicles?limit=200')
      const data = await res.json()
      setVehicles(data.vehicles || [])
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])
  useEffect(() => { fetchVehicles() }, [fetchVehicles])

  const selectedVehicle = vehicles.find((v) => v.id === formVehicleId)

  useEffect(() => {
    if (selectedVehicle?.branch && !formDepartureBranch) {
      setFormDepartureBranch(selectedVehicle.branch)
    }
  }, [selectedVehicle, formDepartureBranch])

  // Auto-calculate route (outbound + return) when stops change
  const calculateRoute = useCallback(async () => {
    const validStops = formStops.filter(s => s.lat > 0 && s.lon > 0)
    if (validStops.length < 2) {
      setRouteResult(null)
      setFormEstimatedDistance('')
      setFormEstimatedTime('')
      setFormEstimatedArrival('')
      setRouteError('')
      return
    }

    setCalculating(true)
    setRouteError('')
    try {
      const points = validStops.map(s => ({
        lat: s.lat,
        lon: s.lon,
        name: s.name,
      }))

      // Return point is the first stop (departure point)
      const returnPoint = validStops.length >= 2 ? {
        lat: validStops[0].lat,
        lon: validStops[0].lon,
        name: validStops[0].name,
      } : undefined

      const res = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points, returnPoint }),
      })

      if (!res.ok) {
        throw new Error('فشل حساب المسار')
      }

      const data = await res.json()
      setRouteResult(data)
      const totalDistance = data.totalDistance || 0
      setFormEstimatedDistance(String(totalDistance))
      
      // Calculate estimated fuel consumption: distance / vehicle fuel rate
      const fuelRate = selectedVehicle?.fuelRate || 0
      const estimatedFuel = fuelRate > 0 ? Math.round((totalDistance / fuelRate) * 100) / 100 : 0
      setFormEstimatedFuel(String(estimatedFuel))
      
      setFormEstimatedTime(data.totalTime)
      setFormEstimatedArrival(data.totalArrival)
    } catch {
      setRouteError('تعذر حساب المسار. تأكد من صحة النقاط المحددة.')
      setRouteResult(null)
    } finally {
      setCalculating(false)
    }
  }, [formStops])

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateRoute()
    }, 600)
    return () => clearTimeout(timer)
  }, [formStops, calculateRoute])

  const updateStop = (idx: number, val: StopPoint) => {
    const newStops = [...formStops]
    newStops[idx] = val
    setFormStops(newStops)
  }

  const addStop = () => {
    setFormStops([...formStops, { name: '', lat: 0, lon: 0, displayName: '' }])
  }

  const removeStop = (idx: number) => {
    if (formStops.length <= 1) return
    setFormStops(formStops.filter((_, i) => i !== idx))
  }

  const handleDestinationBranchSelect = (branch: string) => {
    setFormDestinationBranch(branch)
    const lastStop = formStops[formStops.length - 1]
    if (lastStop && !lastStop.name) {
      const newStops = [...formStops]
      newStops[newStops.length - 1] = { ...lastStop, name: branch }
      setFormStops(newStops)
    }
  }

  const handleCreate = async () => {
    if (!formVehicleId || !formDriverName) {
      toast({ title: 'خطأ', description: 'يرجى تعبئة الحقول المطلوبة (المركبة والسائق)', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const stopsFiltered = formStops.filter(s => s.name.trim())
      const stopsData = stopsFiltered.map(s => ({
        name: s.name,
        lat: s.lat,
        lon: s.lon,
        displayName: s.displayName,
      }))

      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: formVehicleId,
          driverName: formDriverName,
          distributor: formDistributor,
          departureBranch: formDepartureBranch,
          destinationBranch: formDestinationBranch,
          branch: formDestinationBranch || formDepartureBranch,
          departureKm: formDepartureKm,
          stops: stopsData,
          estimatedDistance: formEstimatedDistance,
          estimatedFuel: formEstimatedFuel,
          estimatedTime: formEstimatedTime,
          estimatedArrival: formEstimatedArrival,
          status: 'open',
          notes: formNotes,
        }),
      })
      if (res.ok) {
        toast({ title: 'تم إنشاء أمر الشغل بنجاح' })
        setCreateOpen(false)
        resetForm()
        fetchOrders()
      } else {
        const err = await res.json()
        toast({ title: 'خطأ', description: err.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = async () => {
    if (!closeOrderId || !closeReturnKm) return
    setClosing(true)
    try {
      const res = await fetch(`/api/work-orders/${closeOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed', returnKm: closeReturnKm }),
      })
      if (res.ok) {
        toast({ title: 'تم إغلاق أمر الشغل بنجاح' })
        setCloseOrderId(null)
        setCloseReturnKm('')
        fetchOrders()
      } else {
        toast({ title: 'خطأ في إغلاق أمر الشغل', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setClosing(false)
    }
  }

  const handleStartProgress = async (id: string) => {
    try {
      const res = await fetch(`/api/work-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      })
      if (res.ok) {
        toast({ title: 'تم تحديث حالة أمر الشغل' })
        fetchOrders()
      }
    } catch {
      toast({ title: 'خطأ', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setFormVehicleId('')
    setFormDriverName('')
    setFormDistributor('')
    setFormDepartureBranch('')
    setFormDestinationBranch('')
    setFormDepartureKm('')
    setFormStops([{ name: '', lat: 0, lon: 0, displayName: '' }])
    setFormEstimatedDistance('')
    setFormEstimatedTime('')
    setFormEstimatedArrival('')
    setFormNotes('')
    setRouteResult(null)
    setRouteError('')
  }

  const parseStops = (stopsStr: string): StopPoint[] => {
    try {
      const parsed = JSON.parse(stopsStr)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const formatSegmentDuration = (mins: number) => {
    if (mins > 60) return `${Math.floor(mins / 60)}س ${mins % 60}د`
    return `${mins} د`
  }

  const outboundSegments = routeResult?.segments.filter(s => s.type === 'outbound') || []
  const returnSegments = routeResult?.segments.filter(s => s.type === 'return') || []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === '__all__' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-[160px] text-sm">
              <SelectValue placeholder="كل الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">كل الحالات</SelectItem>
              <SelectItem value="open">مفتوح</SelectItem>
              <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
              <SelectItem value="closed">مغلق</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-slate-500">{total} أمر شغل</p>
        </div>
        <Button onClick={() => { resetForm(); setCreateOpen(true) }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 ml-2" />
          أمر شغل جديد
        </Button>
      </div>

      {/* Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">#</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">رقم الأمر</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">المركبة</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">السائق</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">من فرع</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">إلى فرع</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">المسافة المقدرة</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">الحالة</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">التاريخ</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-10">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto" />
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-10 text-slate-400">
                      لا توجد أوامر شغل
                    </td>
                  </tr>
                ) : (
                  orders.map((wo, i) => {
                    const st = statusMap[wo.status] || statusMap.open
                    return (
                      <tr key={wo.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                        <td className="py-3 px-3 text-slate-400">{(page - 1) * limit + i + 1}</td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-700">#{wo.orderNo}</td>
                        <td className="py-3 px-3 text-slate-600">
                          {wo.vehicle?.model} - {wo.vehicle?.licencePlate}
                        </td>
                        <td className="py-3 px-3 text-slate-600">{wo.driverName}</td>
                        <td className="py-3 px-3 text-slate-500 text-xs">{wo.departureBranch || '-'}</td>
                        <td className="py-3 px-3 text-slate-500 text-xs">{wo.destinationBranch || wo.branch}</td>
                        <td className="py-3 px-3 text-slate-600">
                          <div className="flex flex-col">
                            <span>{wo.estimatedDistance ? `${wo.estimatedDistance} كم` : '-'}</span>
                            {wo.estimatedFuel > 0 && (
                              <span className="text-xs text-amber-600">وقود: {wo.estimatedFuel} لتر</span>
                            )}
                            {wo.actualDistance ? (
                              <span className={`text-xs ${wo.distanceDeviation && wo.distanceDeviation > 20 ? 'text-red-500 font-medium' : 'text-emerald-600'}`}>
                                فعلي: {wo.actualDistance} كم
                                {wo.distanceDeviation !== null && wo.distanceDeviation !== 0 && (
                                  <span> ({wo.distanceDeviation > 0 ? '+' : ''}{wo.distanceDeviation.toFixed(1)})</span>
                                )}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-xs">
                          {new Date(wo.departureDate).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            {wo.status === 'open' && (
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs"
                                onClick={() => handleStartProgress(wo.id)}>بدء</Button>
                            )}
                            {wo.status === 'in_progress' && (
                              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs"
                                onClick={() => setCloseOrderId(wo.id)}>
                                <CheckCircle className="w-4 h-4 ml-1" /> إغلاق
                              </Button>
                            )}
                            {wo.status === 'closed' && (
                              <span className="text-xs text-slate-400">مكتمل</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4 border-t border-slate-100">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="text-sm text-slate-600 px-3">صفحة {page} من {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==================== CREATE DIALOG ==================== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-500" />
              إنشاء أمر شغل جديد
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* === Basic Info === */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-slate-400" />
                البيانات الأساسية
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">المركبة *</Label>
                  <Select value={formVehicleId} onValueChange={(v) => {
                    setFormVehicleId(v)
                    const veh = vehicles.find((ve) => ve.id === v)
                    if (veh) {
                      setFormDepartureKm(String(veh.kmReading))
                      if (!formDepartureBranch) setFormDepartureBranch(veh.branch)
                    }
                  }}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="اختر المركبة" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          #{v.sn} - {v.model} ({v.licencePlate})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">اسم السائق *</Label>
                  <Input value={formDriverName} onChange={(e) => setFormDriverName(e.target.value)} placeholder="اسم السائق" className="text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">الموزع</Label>
                  <Input value={formDistributor} onChange={(e) => setFormDistributor(e.target.value)} placeholder="اسم الموزع" className="text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">عداد المغادرة (كم)</Label>
                  <Input type="number" value={formDepartureKm} onChange={(e) => setFormDepartureKm(e.target.value)} placeholder="0" className="text-sm" />
                </div>
              </div>
            </div>

            {/* === Branches === */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                الفروع
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    فرع المغادرة (الصادر)
                  </Label>
                  <Select value={formDepartureBranch} onValueChange={setFormDepartureBranch}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="اختر فرع المغادرة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">بدون فرع</SelectItem>
                      {BRANCHES.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    فرع الوصول (الوارد)
                  </Label>
                  <Select value={formDestinationBranch} onValueChange={handleDestinationBranchSelect}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="اختر فرع الوصول" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">بدون فرع</SelectItem>
                      {BRANCHES.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* === Route / Stops === */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Route className="w-4 h-4 text-slate-400" />
                  مسار الرحلة ونقاط التوقف
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addStop} className="text-xs border-dashed">
                  <Plus className="w-3 h-3 ml-1" /> إضافة محطة
                </Button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  اكتب اسم الموقع واختر النتيجة من القائمة المنسدلة للبحث في الخرائط.
                  النقطة الأولى هي نقطة الانطلاق والنقطة الأخيرة هي نقطة الوصول.
                  سيتم حساب المسافة والزمن تلقائياً لرحلة <strong>الذهاب والعودة</strong> إلى فرع المغادرة.
                </span>
              </div>

              {/* Stops list */}
              <div className="space-y-3">
                {formStops.map((stop, idx) => {
                  const isFirst = idx === 0
                  const isLast = idx === formStops.length - 1 && formStops.length > 1
                  return (
                    <div key={idx} className="flex items-start gap-2 bg-white border border-slate-200 rounded-lg p-3">
                      {/* Step indicator */}
                      <div className="flex flex-col items-center shrink-0 pt-5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          isFirst ? 'bg-emerald-500' :
                          isLast ? 'bg-blue-500' : 'bg-amber-500'
                        }`}>
                          {isFirst ? <MapPinned className="w-3.5 h-3.5" /> :
                           isLast ? <Navigation className="w-3.5 h-3.5" /> :
                           idx + 1}
                        </div>
                        {idx < formStops.length - 1 && (
                          <div className="w-0.5 h-8 bg-slate-200" />
                        )}
                      </div>

                      {/* Input */}
                      <div className="flex-1 min-w-0">
                        <GeocodeInput
                          value={stop}
                          onChange={(val) => updateStop(idx, val)}
                          placeholder={
                            isFirst ? 'نقطة الانطلاق (ابحث عن الموقع...)' :
                            isLast ? 'نقطة الوصول (ابحث عن الموقع...)' :
                            `محطة توقف ${idx} (ابحث عن الموقع...)`
                          }
                          label={
                            isFirst ? 'نقطة الانطلاق' :
                            isLast ? 'نقطة الوصول' :
                            `محطة توقف ${idx}`
                          }
                          index={idx}
                        />
                      </div>

                      {/* Remove button */}
                      {formStops.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStop(idx)}
                          className="text-red-400 hover:text-red-600 shrink-0 mt-5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Auto return indicator */}
              {formStops.length >= 2 && formStops[0].lat > 0 && formStops[formStops.length - 1].lat > 0 && (
                <div className="flex items-start gap-2 bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-purple-500">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <Label className="text-xs text-purple-600 flex items-center gap-1 mb-1">
                      <RotateCcw className="w-3 h-3" />
                      العودة إلى نقطة الانطلاق (تلقائي)
                    </Label>
                    <p className="text-xs text-purple-500">
                      {formStops[formStops.length - 1].name} ← {formStops[0].name}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* === Route Summary === */}
            {(calculating || routeResult || routeError) && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-slate-400" />
                  ملخص المسار (ذهاب وعودة)
                </h3>

                {calculating && (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                    جاري حساب المسار (ذهاب وعودة)...
                  </div>
                )}

                {routeError && !calculating && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-600">
                    {routeError}
                  </div>
                )}

                {routeResult && !calculating && (
                  <>
                    {/* === Outbound & Return cards side by side === */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Outbound (ذهاب) */}
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <ArrowDown className="w-4 h-4 text-emerald-600 rotate-180" />
                          <span className="text-sm font-semibold text-emerald-700">رحلة الذهاب</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xl font-bold text-slate-800">{routeResult.outboundDistance}</p>
                            <p className="text-xs text-slate-500">كم</p>
                          </div>
                          <div>
                            <p className="text-xl font-bold text-slate-800">{routeResult.outboundTime}</p>
                            <p className="text-xs text-slate-500">زمن الذهاب</p>
                          </div>
                        </div>
                        <p className="text-xs text-emerald-600 mt-2">
                          الوصول المتوقع: {routeResult.outboundArrival}
                        </p>
                      </div>

                      {/* Return (عودة) */}
                      <div className="bg-purple-50/70 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <RotateCcw className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-semibold text-purple-700">رحلة العودة</span>
                        </div>
                        {routeResult.hasReturn ? (
                          <>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xl font-bold text-slate-800">{routeResult.returnDistance}</p>
                                <p className="text-xs text-slate-500">كم</p>
                              </div>
                              <div>
                                <p className="text-xl font-bold text-slate-800">{routeResult.returnTime}</p>
                                <p className="text-xs text-slate-500">زمن العودة</p>
                              </div>
                            </div>
                            <p className="text-xs text-purple-600 mt-2">
                              العودة المتوقعة: {routeResult.returnArrival}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-slate-400">نقطة الوصول هي نفس نقطة الانطلاق</p>
                        )}
                      </div>
                    </div>

                    {/* === Total (الإجمالي) === */}
                    <div className="bg-slate-800 rounded-lg p-4">
                      <div className="flex items-center justify-around text-white">
                        <div className="text-center">
                          <Route className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                          <p className="text-2xl font-bold">{routeResult.totalDistance}</p>
                          <p className="text-xs text-slate-300">كم إجمالي (ذهاب + عودة)</p>
                        </div>
                        <div className="w-px h-12 bg-slate-600" />
                        <div className="text-center">
                          <Clock className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                          <p className="text-2xl font-bold">{routeResult.totalTime}</p>
                          <p className="text-xs text-slate-300">زمن إجمالي</p>
                        </div>
                        <div className="w-px h-12 bg-slate-600" />
                        <div className="text-center">
                          <Navigation className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                          <p className="text-2xl font-bold">{routeResult.totalArrival}</p>
                          <p className="text-xs text-slate-300">العودة المتوقعة</p>
                        </div>
                      </div>
                    </div>

                    {/* === Segments detail === */}
                    {routeResult.segments.length > 1 && (
                      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-2 bg-slate-50">
                          <p className="text-xs font-semibold text-slate-600">تفاصيل المقاطع</p>
                        </div>
                        {outboundSegments.map((seg, idx) => (
                          <div key={`out-${idx}`} className="flex items-center gap-3 px-4 py-2 border-t border-slate-100 text-xs">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-slate-600 truncate max-w-[100px]">{seg.from}</span>
                            <ArrowRightLeft className="w-3 h-3 text-emerald-400 shrink-0 rotate-180" />
                            <span className="text-slate-600 truncate max-w-[100px]">{seg.to}</span>
                            <span className="mr-auto font-medium text-slate-700 shrink-0">{seg.distanceKm} كم</span>
                            <span className="text-slate-500 shrink-0">{formatSegmentDuration(seg.durationMin)}</span>
                          </div>
                        ))}
                        {returnSegments.map((seg, idx) => (
                          <div key={`ret-${idx}`} className="flex items-center gap-3 px-4 py-2 border-t border-purple-100 bg-purple-50/50 text-xs">
                            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                              <RotateCcw className="w-2.5 h-2.5" />
                            </span>
                            <span className="text-purple-700 truncate max-w-[100px]">{seg.from}</span>
                            <ArrowRightLeft className="w-3 h-3 text-purple-400 shrink-0 rotate-180" />
                            <span className="text-purple-700 truncate max-w-[100px]">{seg.to}</span>
                            <span className="mr-auto font-medium text-purple-700 shrink-0">{seg.distanceKm} كم</span>
                            <span className="text-purple-500 shrink-0">{formatSegmentDuration(seg.durationMin)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* === Notes === */}
            <div className="space-y-1">
              <Label className="text-xs">ملاحظات</Label>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="ملاحظات إضافية..." rows={2} className="text-sm" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm() }}>إلغاء</Button>
            <Button onClick={handleCreate} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {submitting ? 'جاري الإنشاء...' : 'إنشاء أمر الشغل'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== CLOSE DIALOG ==================== */}
      <Dialog open={!!closeOrderId} onOpenChange={() => setCloseOrderId(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">إغلاق أمر الشغل</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">أدخل قراءة العداد عند العودة لحساب المسافة الفعلية ومقارنتها بالمسافة المقدرة (ذهاب وعودة).</p>
            <div className="space-y-2">
              <Label>عداد العودة (كم)</Label>
              <Input type="number" value={closeReturnKm} onChange={(e) => setCloseReturnKm(e.target.value)} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOrderId(null)}>إلغاء</Button>
            <Button onClick={handleClose} disabled={closing || !closeReturnKm} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {closing ? 'جاري الإغلاق...' : 'تأكيد الإغلاق'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
