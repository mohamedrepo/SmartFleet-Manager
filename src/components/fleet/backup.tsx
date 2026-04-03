import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Database,
  HardDriveDownload,
  HardDriveUpload,
  Trash2,
  CheckCircle,
  AlertCircle,
  Upload,
  RefreshCcw,
  CalendarClock,
  Loader2,
  FileSpreadsheet,
  Car,
  Fuel,
  ClipboardList,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface BackupInfo {
  fileName: string
  size: number
  createdAt: string
  isAuto: boolean
}

interface DbStats {
  vehicles: number
  workOrders: number
  fuelTransactions: number
  maintenanceRecords: number
}

interface ImportResult {
  success: boolean
  message: string
  mode: string
  result: Record<string, { imported: number; skipped: number; errors: string[] }>
}

export default function BackupRestore() {
  const { toast } = useToast()

  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [stats, setStats] = useState<DbStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Import
  const [importOpen, setImportOpen] = useState(false)
  const [importMode, setImportMode] = useState('all')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/backup', { method: 'PUT' })
      const data = await res.json()
      setBackups(data.backups || [])
      setStats(data.stats)
    } catch {
      console.error('Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleManualBackup = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/backup')
      const data = await res.json()
      if (data.success) {
        toast({ title: 'تم إنشاء النسخة الاحتياطية', description: data.fileName })
        loadData()
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (fileName: string) => {
    setDeleting(fileName)
    try {
      const res = await fetch(`/api/backup?file=${encodeURIComponent(fileName)}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'تم حذف النسخة الاحتياطية' })
        loadData()
      } else {
        toast({ title: 'خطأ في الحذف', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', variant: 'destructive' })
    } finally {
      setDeleting(null)
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      toast({ title: 'يرجى اختيار ملف', variant: 'destructive' })
      return
    }
    setImporting(true)
    setImportResult(null)
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('mode', importMode)

      const res = await fetch('/api/import-data', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      setImportResult(data)

      if (data.success) {
        toast({ title: 'تم الاستيراد بنجاح' })
        loadData()
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setImporting(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 text-center">
              <Car className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-800">{stats.vehicles}</p>
              <p className="text-xs text-slate-500">مركبات</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 text-center">
              <ClipboardList className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-800">{stats.workOrders}</p>
              <p className="text-xs text-slate-500">أوامر شغل</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 text-center">
              <Fuel className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-800">{stats.fuelTransactions.toLocaleString()}</p>
              <p className="text-xs text-slate-500">حركات وقود</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 text-center">
              <Database className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-800">{stats.maintenanceRecords}</p>
              <p className="text-xs text-slate-500">سجلات صيانة</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <HardDriveDownload className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">نسخ احتياطي يدوي</h3>
                <p className="text-xs text-slate-500 mb-3">إنشاء نسخة احتياطية فورية من قاعدة البيانات</p>
                <Button
                  onClick={handleManualBackup}
                  disabled={creating}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs w-full sm:w-auto"
                >
                  {creating ? (
                    <><Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" /> جاري الإنشاء...</>
                  ) : (
                    <><HardDriveDownload className="w-3.5 h-3.5 ml-1" /> إنشاء نسخة الآن</>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/30 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <HardDriveUpload className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">استيراد من ملف إكسيل</h3>
                <p className="text-xs text-slate-500 mb-3">استيراد بيانات المركبات والوقود مع تجاهل المكرر</p>
                <Button
                  onClick={() => { setImportOpen(true); setImportResult(null); setImportFile(null) }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs w-full sm:w-auto"
                >
                  <Upload className="w-3.5 h-3.5 ml-1" /> استيراد بيانات
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto Backup Info */}
      <div className="bg-slate-800 rounded-lg p-4 flex items-center gap-3">
        <CalendarClock className="w-5 h-5 text-emerald-400 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-white">النسخ الاحتياطي التلقائي اليومي</p>
          <p className="text-xs text-slate-300">يتم إنشاء نسخة احتياطية تلقائياً يومياً عند الساعة 2:00 فجراً وحفظ آخر 30 نسخة</p>
        </div>
        <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
          <CheckCircle className="w-3 h-3 ml-1" />
          مفعّل
        </Badge>
      </div>

      {/* Backups List */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-400" />
            النسخ الاحتياطية المتاحة
            <Button variant="ghost" size="sm" onClick={loadData} className="mr-auto">
              <RefreshCcw className="w-3.5 h-3.5" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">لا توجد نسخ احتياطية</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {backups.map((b) => (
                <div key={b.fileName} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Database className={`w-4 h-4 ${b.isAuto ? 'text-purple-500' : 'text-emerald-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{b.fileName}</p>
                    <p className="text-xs text-slate-400">{formatDate(b.createdAt)} • {formatSize(b.size)}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${b.isAuto ? 'border-purple-200 text-purple-600 bg-purple-50' : 'border-emerald-200 text-emerald-600 bg-emerald-50'}`}>
                    {b.isAuto ? 'تلقائي' : 'يدوي'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                    onClick={() => handleDelete(b.fileName)}
                    disabled={deleting === b.fileName}
                  >
                    {deleting === b.fileName ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==================== IMPORT DIALOG ==================== */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-500" />
              استيراد بيانات من ملف إكسيل
            </DialogTitle>
          </DialogHeader>

          {!importResult ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                <p className="font-semibold mb-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> تنبيه مهم</p>
                <ul className="list-disc list-inside space-y-0.5 mr-4">
                  <li>يتم فحص كل سجل قبل استيراده لتجنب التكرار</li>
                  <li>المركبات يتم فحصها برقم (Sn) — لا يتم استيراد المكرر</li>
                  <li>حركات الوقود يتم فحصها بالمركبة + التاريخ + المبلغ + النوع</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">نوع البيانات المراد استيرادها</Label>
                <Select value={importMode} onValueChange={setImportMode}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل (مركبات + حركات وقود)</SelectItem>
                    <SelectItem value="vehicles">المركبات فقط</SelectItem>
                    <SelectItem value="fuel">حركات الوقود فقط</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">اختر ملف الإكسيل</Label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="import-file"
                  />
                  <label htmlFor="import-file" className="cursor-pointer">
                    {importFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-700">{importFile.name}</p>
                          <p className="text-xs text-slate-400">{(importFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-sm text-slate-500">اضغط لاختيار ملف .xlsx أو .xls</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700 font-medium">{importResult.message}</p>
              </div>

              {importResult.result.vehicles && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                      <Car className="w-3.5 h-3.5" /> المركبات
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-3 text-xs">
                    <div className="bg-emerald-50 rounded p-2 text-center">
                      <p className="text-lg font-bold text-emerald-600">{importResult.result.vehicles.imported}</p>
                      <p className="text-slate-500">تم استيراده</p>
                    </div>
                    <div className="bg-amber-50 rounded p-2 text-center">
                      <p className="text-lg font-bold text-amber-600">{importResult.result.vehicles.skipped}</p>
                      <p className="text-slate-500">مكرر (تم تجاهله)</p>
                    </div>
                  </div>
                  {importResult.result.vehicles.errors.length > 0 && (
                    <div className="border-t border-slate-200 px-3 py-2">
                      <p className="text-xs text-red-500">
                        {importResult.result.vehicles.errors.length} أخطاء
                      </p>
                    </div>
                  )}
                </div>
              )}

              {importResult.result.fuelTransactions && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5" /> حركات الوقود
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-3 text-xs">
                    <div className="bg-emerald-50 rounded p-2 text-center">
                      <p className="text-lg font-bold text-emerald-600">{importResult.result.fuelTransactions.imported}</p>
                      <p className="text-slate-500">تم استيراده</p>
                    </div>
                    <div className="bg-amber-50 rounded p-2 text-center">
                      <p className="text-lg font-bold text-amber-600">{importResult.result.fuelTransactions.skipped}</p>
                      <p className="text-slate-500">مكرر (تم تجاهله)</p>
                    </div>
                  </div>
                  {importResult.result.fuelTransactions.errors.length > 0 && (
                    <div className="border-t border-slate-200 px-3 py-2">
                      <p className="text-xs text-red-500">
                        {importResult.result.fuelTransactions.errors.length} أخطاء
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {!importResult ? (
              <>
                <Button variant="outline" onClick={() => setImportOpen(false)}>إلغاء</Button>
                <Button
                  onClick={handleImport}
                  disabled={importing || !importFile}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {importing ? (
                    <><Loader2 className="w-4 h-4 ml-1 animate-spin" /> جاري الاستيراد...</>
                  ) : (
                    <><Upload className="w-4 h-4 ml-1" /> بدء الاستيراد</>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={() => setImportOpen(false)}>إغلاق</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


