import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Sample branches with coordinates (Saudi Arabia as example - customize with your actual branches)
const sampleBranches = [
  {
    name: 'الرياض',
    latitude: 24.7136,
    longitude: 46.6753,
    address: 'حي الملز، الرياض',
    phoneNumber: '+966112345678',
    managerName: 'محمد أحمد'
  },
  {
    name: 'جدة',
    latitude: 21.5433,
    longitude: 39.1727,
    address: 'حي الشرفية، جدة',
    phoneNumber: '+966122345678',
    managerName: 'علي محمد'
  },
  {
    name: 'الدمام',
    latitude: 26.3954,
    longitude: 50.1955,
    address: 'حي الخليج، الدمام',
    phoneNumber: '+966132345678',
    managerName: 'سارة خالد'
  },
  {
    name: 'الأحساء',
    latitude: 25.4167,
    longitude: 49.5833,
    address: 'الهفوف، الأحساء',
    phoneNumber: '+966135345678',
    managerName: 'فاطمة عبدالله'
  },
  {
    name: 'مكة',
    latitude: 21.4367,
    longitude: 39.8167,
    address: 'حي الشرفية، مكة',
    phoneNumber: '+966125345678',
    managerName: 'يوسف سالم'
  },
  {
    name: 'المدينة',
    latitude: 24.4672,
    longitude: 39.5936,
    address: 'حي النوارة، المدينة',
    phoneNumber: '+966148345678',
    managerName: 'نور الدين أحمد'
  },
];

export async function GET() {
  try {
    // Check if branches already exist
    const existingBranches = await db.branch.findMany();
    
    if (existingBranches.length > 0) {
      return NextResponse.json({
        message: 'البيانات موجودة بالفعل',
        branchCount: existingBranches.length,
        branches: existingBranches,
      });
    }

    // Create branches
    const createdBranches = await Promise.all(
      sampleBranches.map((branch) =>
        db.branch.create({
          data: branch,
        })
      )
    );

    return NextResponse.json({
      message: 'تم إنشاء الفروع بنجاح',
      branchCount: createdBranches.length,
      branches: createdBranches,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'خطأ في إضافة بيانات الفروع', details: String(error) },
      { status: 500 }
    );
  }
}
