import BranchMap from '@/components/fleet/branch-map'

export const metadata = {
  title: 'خريطة الفروع | SmartFleet Manager',
  description: 'عرض الفروع والمحطات على خريطة جغرافية مع الإحصائيات',
}

export default function MapPage() {
  return <BranchMap />
}
