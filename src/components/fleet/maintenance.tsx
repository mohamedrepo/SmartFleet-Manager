'use client'

import React, { useEffect, useState, useCallback } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Wrench,
  CircleDot,
  Settings,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Vehicle {
  id: string
  sn: number
  model: string
  licencePlate: string
}

interface MaintenanceRecord {
  id: string
  vehicleId: string
  type: string
  description: string
  cost: number
  kmAtService: number
  nextServiceKm: number | null
  serviceDate: string
  provider: string | null
  notes: string | null
  vehicle: { sn: number; model: string; licencePlate: string }
}

interface Tire {
  id: string
  vehicleId: string
  position: string
  brand: string | null
  size: string | null
  installDate: string
  installKm: number
  currentKm: number
  maxKm: number | null
  status: string
  vehicle: { sn: number; model: string; licencePlate: string }
}

interface SparePart {
  id: string
  vehicleId: string
  partName: string
  quantity: number
  unitCost: number
  totalCost: number
  supplier: string | null
  installDate: string
  installKm: number | null
  expectedLife: string | null
  notes: string | null
  vehicle: { sn: number; model: string; licencePlate: string }
}

const maintenanceTypes = [
  { value: 'oil_change', label: 'تغيير زيت' },
  { value: 'filter', label: 'فلتر' },
  { value: 'belt', label: 'حزام' },
  { value: 'wash', label: 'غسيل' },
  { value: 'lubrication', label: 'تزييت' },
  { value: 'quick_service', label: 'صيانة سريعة' },
  { value: 'other', label: 'أخرى' },
]

const tirePositions = [
  { value: 'front_right', label: 'أمامي يمين' },
  { value: 'front_left', label: 'أمامي يسار' },
  { value: 'rear_right', label: 'خلفي يمين' },
  { value: 'rear_left', label: 'خلفي يسار' },
  { value: 'spare', label: 'احتياطي' },
]

const tireStatusMap: Record<string, string> = {
  active: 'نشط',
  rotated: 'مُدار',
  replaced: 'مُستبدل',
}

const maintenanceTypeLabels: Record<string, string> = {
  oil_change: 'تغيير زيت',
  filter: 'فلتر',
  belt: 'حزام',
  wash: 'غسيل',
  lubrication: 'تزييت',
  quick_service: 'صيانة سريعة',
  other: 'أخرى',
}

export default function MaintenanceSection() {
  const { toast } = useToast()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  // Maintenance state
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [maintPage, setMaintPage] = useState(1)
  const [maintTotal, setMaintTotal] = useState(0)
  const [maintTotalPages, setMaintTotalPages] = useState(1)
  const [maintLoading, setMaintLoading] = useState(true)
  const [maintCreateOpen, setMaintCreateOpen] = useState(false)
  const [maintForm, setMaintForm] = useState({
    vehicleId: '', type: '', description: '', cost: '',
    kmAtService: '', nextServiceKm: '', serviceDate: '',
    provider: '', notes: '',
  })
  const [maintSubmitting, setMaintSubmitting] = useState(false)

  // Tires state
  const [tires, setTires] = useState<Tire[]>([])
  const [tirePage, setTirePage] = useState(1)
  const [tireTotal, setTireTotal] = useState(0)
  const [tireTotalPages, setTireTotalPages] = useState(1)
  const [tireLoading, setTireLoading] = useState(true)
  const [tireCreateOpen, setTireCreateOpen] = useState(false)
  const [tireForm, setTireForm] = useState({
    vehicleId: '', position: '', brand: '', size: '',
    installKm: '', currentKm: '', maxKm: '', status: 'active', installDate: '',
  })
  const [tireSubmitting, setTireSubmitting] = useState(false)

  // Spare parts state
  const [spareParts, setSpareParts] = useState<SparePart[]>([])
  const [partPage, setPartPage] = useState(1)
  const [partTotal, setPartTotal] = useState(0)
  const [partTotalPages, setPartTotalPages] = useState(1)
  const [partLoading, setPartLoading] = useState(true)
  const [partCreateOpen, setPartCreateOpen] = useState(false)
  const [partForm, setPartForm] = useState({
    vehicleId: '', partName: '', quantity: '1', unitCost: '',
    totalCost: '', supplier: '', installDate: '', installKm: '',
    expectedLife: '', notes: '',
  })
  const [partSubmitting, setPartSubmitting] = useState(false)

  const limit = 15

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch('/api/vehicles?limit=200')
      const data = await res.json()
      setVehicles(data.vehicles || [])
    } catch (err) {
      console.error(err)
    }
  }, [])

  const fetchMaintenance = useCallback(async () => {
    setMaintLoading(true)
    try {
      const res = await fetch(`/api/maintenance?page=${maintPage}&limit=${limit}`)
      const data = await res.json()
      setMaintenanceRecords(data.records || [])
      setMaintTotal(data.total)
      setMaintTotalPages(data.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setMaintLoading(false)
    }
  }, [maintPage])

  const fetchTires = useCallback(async () => {
    setTireLoading(true)
    try {
      const res = await fetch(`/api/tires?page=${tirePage}&limit=${limit}`)
      const data = await res.json()
      setTires(data.tires || [])
      setTireTotal(data.total)
      setTireTotalPages(data.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setTireLoading(false)
    }
  }, [tirePage])

  const fetchParts = useCallback(async () => {
    setPartLoading(true)
    try {
      const res = await fetch(`/api/spare-parts?page=${partPage}&limit=${limit}`)
      const data = await res.json()
      setSpareParts(data.parts || [])
      setPartTotal(data.total)
      setPartTotalPages(data.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setPartLoading(false)
    }
  }, [partPage])

  useEffect(() => { fetchVehicles() }, [fetchVehicles])
  useEffect(() => { fetchMaintenance() }, [fetchMaintenance])
  useEffect(() => { fetchTires() }, [fetchTires])
  useEffect(() => { fetchParts() }, [fetchParts])

  // Create maintenance
  const handleCreateMaintenance = async () => {
    if (!maintForm.vehicleId || !maintForm.type || !maintForm.description) {
      toast({ title: 'خطأ', description: 'يرجى تعبئة الحقول المطلوبة', variant: 'destructive' })
      return
    }
    setMaintSubmitting(true)
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maintForm),
      })
      if (res.ok) {
        toast({ title: 'تم إضافة سجل الصيانة بنجاح' })
        setMaintCreateOpen(false)
        setMaintForm({ vehicleId: '', type: '', description: '', cost: '', kmAtService: '', nextServiceKm: '', serviceDate: '', provider: '', notes: '' })
        fetchMaintenance()
      } else {
        const err = await res.json()
        toast({ title: 'خطأ', description: err.error, variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setMaintSubmitting(false)
    }
  }

  // Create tire
  const handleCreateTire = async () => {
    if (!tireForm.vehicleId || !tireForm.position) {
      toast({ title: 'خطأ', description: 'يرجى تعبئة الحقول المطلوبة', variant: 'destructive' })
      return
    }
    setTireSubmitting(true)
    try {
      const res = await fetch('/api/tires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tireForm),
      })
      if (res.ok) {
        toast({ title: 'تم إضافة الإطار بنجاح' })
        setTireCreateOpen(false)
        setTireForm({ vehicleId: '', position: '', brand: '', size: '', installKm: '', currentKm: '', maxKm: '', status: 'active', installDate: '' })
        fetchTires()
      } else {
        const err = await res.json()
        toast({ title: 'خطأ', description: err.error, variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setTireSubmitting(false)
    }
  }

  // Create spare part
  const handleCreatePart = async () => {
    if (!partForm.vehicleId || !partForm.partName) {
      toast({ title: 'خطأ', description: 'يرجى تعبئة الحقول المطلوبة', variant: 'destructive' })
      return
    }
    setPartSubmitting(true)
    try {
      const res = await fetch('/api/spare-parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partForm),
      })
      if (res.ok) {
        toast({ title: 'تم إضافة قطعة الغيار بنجاح' })
        setPartCreateOpen(false)
        setPartForm({ vehicleId: '', partName: '', quantity: '1', unitCost: '', totalCost: '', supplier: '', installDate: '', installKm: '', expectedLife: '', notes: '' })
        fetchParts()
      } else {
        const err = await res.json()
        toast({ title: 'خطأ', description: err.error, variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setPartSubmitting(false)
    }
  }

  const Pagination = ({ current, total, onChange }: { current: number; total: number; onChange: (p: number) => void }) => (
    total > 1 ? (
      <div className="flex items-center justify-center gap-2 py-4 border-t border-slate-100">
        <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => onChange(current - 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <span className="text-sm text-slate-600 px-3">صفحة {current} من {total}</span>
        <Button variant="outline" size="sm" disabled={current >= total} onClick={() => onChange(current + 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    ) : null
  )

  return (
    <div className="space-y-4">
      <Tabs defaultValue="maintenance" dir="rtl">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="maintenance" className="gap-1.5">
            <Wrench className="w-4 h-4" />
            جدول الصيانة
          </TabsTrigger>
          <TabsTrigger value="tires" className="gap-1.5">
            <CircleDot className="w-4 h-4" />
            الإطارات
          </TabsTrigger>
          <TabsTrigger value="parts" className="gap-1.5">
            <Settings className="w-4 h-4" />
            قطع الغيار
          </TabsTrigger>
        </TabsList>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{maintTotal} سجل صيانة</p>
            <Button onClick={() => setMaintCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-4 h-4 ml-2" /> إضافة سجل
            </Button>
          </div>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">التاريخ</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">المركبة</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">النوع</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">الوصف</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">التكلفة</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">عداد الخدمة</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">الخدمة التالية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintLoading ? (
                      <tr><td colSpan={7} className="text-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto" /></td></tr>
                    ) : maintenanceRecords.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-10 text-slate-400">لا توجد سجلات صيانة</td></tr>
                    ) : maintenanceRecords.map((r) => (
                      <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                        <td className="py-3 px-3 text-slate-500 text-xs">{new Date(r.serviceDate).toLocaleDateString('ar-SA')}</td>
                        <td className="py-3 px-3 text-slate-600">#{r.vehicle?.sn} - {r.vehicle?.licencePlate}</td>
                        <td className="py-3 px-3">
                          <Badge variant="outline" className="text-xs">{maintenanceTypeLabels[r.type] || r.type}</Badge>
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate">{r.description}</td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{r.cost.toLocaleString()} ج.م</td>
                        <td className="py-3 px-3 text-slate-500">{r.kmAtService.toLocaleString()} كم</td>
                        <td className="py-3 px-3 text-slate-500">{r.nextServiceKm ? `${r.nextServiceKm.toLocaleString()} كم` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination current={maintPage} total={maintTotalPages} onChange={setMaintPage} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tires Tab */}
        <TabsContent value="tires" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{tireTotal} إطار</p>
            <Button onClick={() => setTireCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-4 h-4 ml-2" /> إضافة إطار
            </Button>
          </div>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">المركبة</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">الموقع</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">الماركة</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">المقاس</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">عداد التركيب</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">الحالي</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">الأقصى</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tireLoading ? (
                      <tr><td colSpan={8} className="text-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto" /></td></tr>
                    ) : tires.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-10 text-slate-400">لا توجد إطارات</td></tr>
                    ) : tires.map((t) => {
                      const usage = t.maxKm ? ((t.currentKm - t.installKm) / t.maxKm) * 100 : 0
                      return (
                        <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                          <td className="py-3 px-3 text-slate-600">#{t.vehicle?.sn} - {t.vehicle?.licencePlate}</td>
                          <td className="py-3 px-3 text-slate-600">{tirePositions.find((p) => p.value === t.position)?.label || t.position}</td>
                          <td className="py-3 px-3 text-slate-600">{t.brand || '-'}</td>
                          <td className="py-3 px-3 text-slate-500">{t.size || '-'}</td>
                          <td className="py-3 px-3 font-mono text-slate-500">{t.installKm.toLocaleString()}</td>
                          <td className="py-3 px-3 font-mono text-slate-500">{t.currentKm.toLocaleString()}</td>
                          <td className="py-3 px-3 font-mono text-slate-500">{t.maxKm?.toLocaleString() || '-'}</td>
                          <td className="py-3 px-3">
                            <Badge
                              variant={usage > 80 ? 'destructive' : usage > 60 ? 'secondary' : 'default'}
                              className="text-xs"
                            >
                              {tireStatusMap[t.status] || t.status}
                            </Badge>
                            {t.maxKm && (
                              <span className="text-xs text-slate-400 mr-1">({Math.round(usage)}%)</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination current={tirePage} total={tireTotalPages} onChange={setTirePage} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spare Parts Tab */}
        <TabsContent value="parts" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{partTotal} قطعة غيار</p>
            <Button onClick={() => setPartCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-4 h-4 ml-2" /> إضافة قطعة غيار
            </Button>
          </div>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">التاريخ</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">المركبة</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">اسم القطعة</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">الكمية</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">تكلفة الوحدة</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">الإجمالي</th>
                      <th className="text-right py-3 px-3 font-semibold text-slate-600 text-xs">المورد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partLoading ? (
                      <tr><td colSpan={7} className="text-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto" /></td></tr>
                    ) : spareParts.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-10 text-slate-400">لا توجد قطع غيار</td></tr>
                    ) : spareParts.map((p) => (
                      <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                        <td className="py-3 px-3 text-slate-500 text-xs">{new Date(p.installDate).toLocaleDateString('ar-SA')}</td>
                        <td className="py-3 px-3 text-slate-600">#{p.vehicle?.sn} - {p.vehicle?.licencePlate}</td>
                        <td className="py-3 px-3 text-slate-700 font-medium">{p.partName}</td>
                        <td className="py-3 px-3 text-slate-600">{p.quantity}</td>
                        <td className="py-3 px-3 text-slate-500">{p.unitCost.toLocaleString()} ج.م</td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{p.totalCost.toLocaleString()} ج.م</td>
                        <td className="py-3 px-3 text-slate-500">{p.supplier || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination current={partPage} total={partTotalPages} onChange={setPartPage} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Maintenance Dialog */}
      <Dialog open={maintCreateOpen} onOpenChange={setMaintCreateOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">إضافة سجل صيانة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>المركبة *</Label>
              <Select value={maintForm.vehicleId} onValueChange={(v) => setMaintForm({ ...maintForm, vehicleId: v })}>
                <SelectTrigger><SelectValue placeholder="اختر المركبة" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>#{v.sn} - {v.model} ({v.licencePlate})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>نوع الصيانة *</Label>
                <Select value={maintForm.type} onValueChange={(v) => setMaintForm({ ...maintForm, type: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                  <SelectContent>
                    {maintenanceTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>التكلفة (ج.م)</Label>
                <Input type="number" value={maintForm.cost} onChange={(e) => setMaintForm({ ...maintForm, cost: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الوصف *</Label>
              <Input value={maintForm.description} onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>عداد الخدمة (كم)</Label>
                <Input type="number" value={maintForm.kmAtService} onChange={(e) => setMaintForm({ ...maintForm, kmAtService: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>عداد الخدمة التالية (كم)</Label>
                <Input type="number" value={maintForm.nextServiceKm} onChange={(e) => setMaintForm({ ...maintForm, nextServiceKm: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>تاريخ الخدمة</Label>
                <Input type="date" value={maintForm.serviceDate} onChange={(e) => setMaintForm({ ...maintForm, serviceDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>مقدم الخدمة</Label>
                <Input value={maintForm.provider} onChange={(e) => setMaintForm({ ...maintForm, provider: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea value={maintForm.notes} onChange={(e) => setMaintForm({ ...maintForm, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaintCreateOpen(false)}>إلغاء</Button>
            <Button onClick={handleCreateMaintenance} disabled={maintSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {maintSubmitting ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Tire Dialog */}
      <Dialog open={tireCreateOpen} onOpenChange={setTireCreateOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">إضافة إطار</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>المركبة *</Label>
              <Select value={tireForm.vehicleId} onValueChange={(v) => setTireForm({ ...tireForm, vehicleId: v })}>
                <SelectTrigger><SelectValue placeholder="اختر المركبة" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>#{v.sn} - {v.model} ({v.licencePlate})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>الموقع *</Label>
                <Select value={tireForm.position} onValueChange={(v) => setTireForm({ ...tireForm, position: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر الموقع" /></SelectTrigger>
                  <SelectContent>
                    {tirePositions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select value={tireForm.status} onValueChange={(v) => setTireForm({ ...tireForm, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="rotated">مُدار</SelectItem>
                    <SelectItem value="replaced">مُستبدل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>الماركة</Label>
                <Input value={tireForm.brand} onChange={(e) => setTireForm({ ...tireForm, brand: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>المقاس</Label>
                <Input value={tireForm.size} onChange={(e) => setTireForm({ ...tireForm, size: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>عداد التركيب</Label>
                <Input type="number" value={tireForm.installKm} onChange={(e) => setTireForm({ ...tireForm, installKm: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>عداد الحالي</Label>
                <Input type="number" value={tireForm.currentKm} onChange={(e) => setTireForm({ ...tireForm, currentKm: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>الحد الأقصى (كم)</Label>
                <Input type="number" value={tireForm.maxKm} onChange={(e) => setTireForm({ ...tireForm, maxKm: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>تاريخ التركيب</Label>
              <Input type="date" value={tireForm.installDate} onChange={(e) => setTireForm({ ...tireForm, installDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTireCreateOpen(false)}>إلغاء</Button>
            <Button onClick={handleCreateTire} disabled={tireSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {tireSubmitting ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Spare Part Dialog */}
      <Dialog open={partCreateOpen} onOpenChange={setPartCreateOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">إضافة قطعة غيار</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>المركبة *</Label>
              <Select value={partForm.vehicleId} onValueChange={(v) => setPartForm({ ...partForm, vehicleId: v })}>
                <SelectTrigger><SelectValue placeholder="اختر المركبة" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>#{v.sn} - {v.model} ({v.licencePlate})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>اسم القطعة *</Label>
              <Input value={partForm.partName} onChange={(e) => setPartForm({ ...partForm, partName: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>الكمية</Label>
                <Input type="number" value={partForm.quantity} onChange={(e) => setPartForm({ ...partForm, quantity: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>تكلفة الوحدة</Label>
                <Input type="number" value={partForm.unitCost} onChange={(e) => {
                  const uc = parseFloat(e.target.value) || 0
                  const q = parseInt(partForm.quantity) || 1
                  setPartForm({ ...partForm, unitCost: e.target.value, totalCost: String(uc * q) })
                }} />
              </div>
              <div className="space-y-2">
                <Label>الإجمالي</Label>
                <Input type="number" value={partForm.totalCost} onChange={(e) => setPartForm({ ...partForm, totalCost: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>المورد</Label>
                <Input value={partForm.supplier} onChange={(e) => setPartForm({ ...partForm, supplier: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>تاريخ التركيب</Label>
                <Input type="date" value={partForm.installDate} onChange={(e) => setPartForm({ ...partForm, installDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>عداد التركيب (كم)</Label>
                <Input type="number" value={partForm.installKm} onChange={(e) => setPartForm({ ...partForm, installKm: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>العمر المتوقع</Label>
                <Input value={partForm.expectedLife} onChange={(e) => setPartForm({ ...partForm, expectedLife: e.target.value })} placeholder="مثال: 50000 كم" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea value={partForm.notes} onChange={(e) => setPartForm({ ...partForm, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPartCreateOpen(false)}>إلغاء</Button>
            <Button onClick={handleCreatePart} disabled={partSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {partSubmitting ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
