import { z } from 'zod';

// Common schemas
const cuidSchema = z.string().min(1, 'Invalid ID format');
const positiveNumber = z.number().positive('Must be greater than 0');
const nonNegativeNumber = z.number().nonnegative('Cannot be negative');

// Vehicle schemas
export const createVehicleSchema = z.object({
  sn: z.number().positive('رقم المركبة مطلوب'),
  type: z.string().min(1, 'نوع المركبة مطلوب'),
  model: z.string().min(1, 'موديل المركبة مطلوب'),
  licencePlate: z.string().min(1, 'لوحة الترخيص مطلوبة'),
  licenceNo: z.number().int(),
  year: z.number().int().min(1900).max(2100),
  chassisNo: z.string().min(1, 'رقم الهيكل مطلوب'),
  engineSn: z.string().min(1, 'رقم المحرك مطلوب'),
  fuel: z.string().min(1, 'نوع الوقود مطلوب'),
  allocations: z.number(),
  tankCapacity: z.number().positive('السعة يجب أن تكون موجبة'),
  fuelRate: z.number().nonnegative(),
  branch: z.string().min(1, 'الفرع مطلوب'),
  cardName: z.string(),
  cardNo: z.string(),
});

// Work Order schemas
export const createWorkOrderSchema = z.object({
  vehicleId: z.string().min(1),
  driverName: z.string().min(2).max(100),
  distributor: z.string().max(100).optional().default(''),
  departureBranch: z.string().optional().default(''),
  destinationBranch: z.string().optional().default(''),
  branch: z.string().optional().default(''),
  departureKm: z.coerce.number().nonnegative().default(0),
  stops: z.union([z.string(), z.array(z.unknown())]).transform((val) =>
    typeof val === 'string' ? val : JSON.stringify(val ?? [])
  ).default('[]'),
  estimatedDistance: z.coerce.number().nonnegative().default(0),
  estimatedFuel: z.coerce.number().nonnegative().default(0),
  estimatedTime: z.string().optional().default(''),
  estimatedArrival: z.string().optional().default(''),
  status: z.enum(['open', 'in_progress', 'closed']).optional().default('open'),
  notes: z.string().optional().default(''),
});

export const updateWorkOrderSchema = createWorkOrderSchema.partial().extend({
  id: cuidSchema,
  returnKm: z.number().nonnegative().optional(),
  returnDate: z.string().datetime().optional(),
  status: z.enum(['open', 'in_progress', 'closed']).optional(),
});

// Fuel Transaction schemas
export const createFuelTransactionSchema = z.object({
  vehicleId: cuidSchema,
  cardNumber: z.string().min(1),
  cardName: z.string().min(1),
  onlineBalance: z.number(),
  transactionDate: z.string().datetime(),
  description: z.string(),
  amount: positiveNumber,
  type: z.enum(['D', 'C']),
});

// Maintenance Record schemas
export const createMaintenanceRecordSchema = z.object({
  vehicleId: cuidSchema,
  type: z.enum(['oil_change', 'filter', 'belt', 'wash', 'lubrication', 'quick_service', 'other']),
  description: z.string().min(1),
  cost: positiveNumber,
  kmAtService: z.number(),
  nextServiceKm: z.number().optional(),
  serviceDate: z.string().datetime().optional(),
  provider: z.string().optional(),
  notes: z.string().optional(),
});

// Tire schemas
export const createTireSchema = z.object({
  vehicleId: cuidSchema,
  position: z.enum(['front_left', 'front_right', 'rear_left', 'rear_right', 'spare']),
  brand: z.string().optional(),
  size: z.string().optional(),
  installKm: z.number(),
  currentKm: z.number(),
  maxKm: z.number().optional(),
  status: z.enum(['active', 'rotated', 'replaced']).optional().default('active'),
});

// Spare Part schemas
export const createSparePartSchema = z.object({
  vehicleId: cuidSchema,
  partName: z.string().min(1),
  quantity: z.number().int().positive(),
  unitCost: positiveNumber,
  totalCost: positiveNumber,
  supplier: z.string().optional(),
  installDate: z.string().datetime().optional(),
  installKm: z.number().optional(),
  expectedLife: z.string().optional(),
  notes: z.string().optional(),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const searchParamsSchema = z.object({
  search: z.coerce.string().max(200).optional(),
  branch: z.coerce.string().optional(),
  status: z.coerce.string().optional(),
  type: z.coerce.string().optional(),
  fuel: z.coerce.string().optional(),
});

// Combine pagination with search
export const listQuerySchema = paginationSchema.merge(searchParamsSchema).passthrough();
