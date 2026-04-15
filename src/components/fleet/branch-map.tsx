'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Truck, Fuel, Wrench, ClipboardList } from 'lucide-react'
import dynamic from 'next/dynamic'

interface BranchData {
  id: string
  name: string
  latitude: number
  longitude: number
  address?: string
  phoneNumber?: string
  managerName?: string
  vehicleCount: number
  fuelCost: number
  maintenanceCost: number
  maintenanceCount: number
  openWorkOrders: number
  totalWorkOrders: number
}

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)
const HeatmapLayer = dynamic(
  () => import('react-leaflet-heatmap-layer-v3').then((mod) => mod.HeatmapLayer),
  { ssr: false }
) as React.ComponentType<{
  points: number[][]
  longitudeExtractor: (p: number[]) => number
  latitudeExtractor: (p: number[]) => number
  intensityExtractor: (p: number[]) => number
  radius: number
  blur: number
  max: number
  gradient: Record<number, string>
}>

export default function BranchMap() {
  const [branches, setBranches] = useState<BranchData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<BranchData | null>(null)

  useEffect(() => {
    fetch('/api/branches')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBranches(data)
        } else {
          setError(data.error || 'فشل تحميل البيانات')
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error loading branches:', err)
        setError('خطأ في تحميل بيانات الفروع')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الخريطة...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-red-600 text-center mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-500 text-white py-2 rounded"
            >
              إعادة محاولة
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!branches.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <MapPin className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600">لا توجد فروع مسجلة حالياً</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate bounds for map to fit all markers
  const maxVehicleCount = Math.max(...branches.map((b) => b.vehicleCount), 1)

  // Heatmap data: [lat, lng, intensity]
  const heatmapData = branches.map((branch) => [
    branch.latitude,
    branch.longitude,
    (branch.vehicleCount / maxVehicleCount) * 1.0,
  ])

  // Center map on average coordinates
  const avgLat = branches.reduce((sum, b) => sum + b.latitude, 0) / branches.length
  const avgLng = branches.reduce((sum, b) => sum + b.longitude, 0) / branches.length

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'bg-blue-100'
    if (intensity < 0.33) return 'bg-green-200'
    if (intensity < 0.66) return 'bg-yellow-200'
    return 'bg-red-200'
  }

  const getIntensityLabel = (count: number) => {
    if (count === 0) return 'منخفض'
    if (count < maxVehicleCount / 3) return 'متوسط'
    if (count < (maxVehicleCount * 2) / 3) return 'مرتفع'
    return 'عالي جداً'
  }

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="bg-white p-4 border-b shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">خريطة الفروع الجغرافية</h1>
          <p className="text-gray-600">
            عرض جميع الفروع والمحطات مع عدد المركبات والوقود والصيانة
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-4 p-4">
        {/* Map */}
        <div className="flex-1">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              {typeof window !== 'undefined' && (
                <MapContainer
                  center={[avgLat, avgLng]}
                  zoom={5}
                  className="h-full w-full"
                  style={{ height: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />

                  {/* Heatmap Layer */}
                  {heatmapData.length > 0 && (
                    <HeatmapLayer
                      points={heatmapData}
                      longitudeExtractor={(p) => p[1]}
                      latitudeExtractor={(p) => p[0]}
                      intensityExtractor={(p) => p[2]}
                      radius={50}
                      blur={15}
                      max={1.0}
                      gradient={{
                        0.25: 'green',
                        0.55: 'yellow',
                        0.75: 'orange',
                        1.0: 'red',
                      }}
                    />
                  )}

                  {/* Markers */}
                  {branches.map((branch) => (
                    <Marker
                      key={branch.id}
                      position={[branch.latitude, branch.longitude]}
                      eventHandlers={{
                        click: () => setSelectedBranch(branch),
                      }}
                    >
                      <Popup>
                        <div className="text-sm font-semibold mb-2">{branch.name}</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <Truck size={14} className="inline mr-1" />
                            {branch.vehicleCount} مركبة
                          </div>
                          <div>
                            <ClipboardList size={14} className="inline mr-1" />
                            {branch.openWorkOrders} مفتوح
                          </div>
                          <div>
                            <Fuel size={14} className="inline mr-1" />
                            {branch.fuelCost.toLocaleString('ar-SA')} ر.س
                          </div>
                          <div>
                            <Wrench size={14} className="inline mr-1" />
                            {branch.maintenanceCount} صيانة
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Branch Details Sidebar */}
        <div className="w-80 max-h-screen overflow-y-auto">
          {selectedBranch ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <MapPin size={20} className="text-blue-600" />
                  {selectedBranch.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedBranch.address && (
                  <div>
                    <p className="text-sm text-gray-600">العنوان</p>
                    <p className="font-semibold">{selectedBranch.address}</p>
                  </div>
                )}
                {selectedBranch.phoneNumber && (
                  <div>
                    <p className="text-sm text-gray-600">رقم الهاتف</p>
                    <p className="font-semibold">{selectedBranch.phoneNumber}</p>
                  </div>
                )}
                {selectedBranch.managerName && (
                  <div>
                    <p className="text-sm text-gray-600">مدير الفرع</p>
                    <p className="font-semibold">{selectedBranch.managerName}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">الإحصائيات</h3>

                  <div className="space-y-3">
                    {/* Vehicles */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-2 text-sm">
                          <Truck size={16} className="text-blue-600" />
                          عدد المركبات
                        </span>
                        <Badge variant="outline">{selectedBranch.vehicleCount}</Badge>
                      </div>
                      <div
                        className={`h-2 rounded-full ${getIntensityColor(selectedBranch.vehicleCount)}`}
                      ></div>
                      <p className="text-xs text-gray-500 mt-1">
                        {getIntensityLabel(selectedBranch.vehicleCount)}
                      </p>
                    </div>

                    {/* Fuel */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-2 text-sm">
                          <Fuel size={16} className="text-orange-600" />
                          التكلفة هذا الشهر
                        </span>
                        <Badge variant="outline">
                          {selectedBranch.fuelCost.toLocaleString('ar-SA')}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">تكلفة الوقود والتزود</p>
                    </div>

                    {/* Maintenance */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-2 text-sm">
                          <Wrench size={16} className="text-red-600" />
                          الصيانة هذا الشهر
                        </span>
                        <Badge variant="outline">
                          {selectedBranch.maintenanceCost.toLocaleString('ar-SA')}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {selectedBranch.maintenanceCount} عملية صيانة
                      </p>
                    </div>

                    {/* Work Orders */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-2 text-sm">
                          <ClipboardList size={16} className="text-green-600" />
                          طلبات العمل
                        </span>
                        <Badge variant="outline">
                          {selectedBranch.openWorkOrders}/{selectedBranch.totalWorkOrders}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {selectedBranch.openWorkOrders} مفتوحة من أصل{' '}
                        {selectedBranch.totalWorkOrders}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-600">
                <MapPin size={32} className="mx-auto mb-3 text-gray-400" />
                <p>انقر على أي علامة على الخريطة لعرض التفاصيل</p>
              </CardContent>
            </Card>
          )}

          {/* Branch List */}
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold text-sm px-2">جميع الفروع</h3>
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => setSelectedBranch(branch)}
                className={`w-full text-right p-2 rounded-lg border transition-colors ${
                  selectedBranch?.id === branch.id
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold text-sm">{branch.name}</div>
                <div className="text-xs text-gray-600 mt-1">
                  <span className="inline-block mr-2">
                    {branch.vehicleCount} مركبة
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-white text-xs ${getIntensityColor(
                      branch.vehicleCount
                    ).replace('bg-', 'bg-')}`}
                  >
                    {getIntensityLabel(branch.vehicleCount)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
