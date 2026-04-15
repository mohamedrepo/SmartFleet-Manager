# SmartFleet Manager - API Documentation

## Overview
SmartFleet Manager is a comprehensive fleet management system built with Next.js, Prisma (SQLite), and Electron. This document outlines the API routes and their functionality.

## Base URL
```
/api
```

---

## Vehicles

### GET /api/vehicles
Get paginated list of vehicles with optional filtering.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `search` (string) - Search by licencePlate, model, chassisNo, cardName, cardNo
- `branch` (string) - Filter by branch
- `type` (string) - Filter by vehicle type
- `fuel` (string) - Filter by fuel type

**Response:**
```json
{
  "vehicles": [...],
  "total": 100,
  "page": 1,
  "totalPages": 5
}
```

---

### GET /api/vehicles/:id
Get detailed vehicle information including related records.

**Response:**
```json
{
  "id": "...",
  "sn": 1,
  "type": "...",
  "model": "...",
  "licencePlate": "...",
  "workOrders": [...],
  "fuelTransactions": [...],
  "maintenanceRecords": [...],
  "tires": [...],
  "spareParts": [...],
  "_count": {...}
}
```

---

## Work Orders

### GET /api/work-orders
Get paginated list of work orders.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `status` (string) - Filter by status: open, in_progress, closed

**Response:**
```json
{
  "workOrders": [...],
  "total": 50,
  "page": 1,
  "totalPages": 3
}
```

---

### POST /api/work-orders
Create a new work order.

**Request Body:**
```json
{
  "vehicleId": "cuid",
  "driverName": "اسم السائق",
  "distributor": "الموزع",
  "departureBranch": "فرع الانطلاق",
  "destinationBranch": "الفرع الوجهة",
  "branch": "الفرع",
  "departureKm": 100000,
  "stops": "[]",
  "estimatedDistance": 150,
  "estimatedTime": "2 hours",
  "estimatedArrival": "10:00 AM",
  "status": "open",
  "notes": ""
}
```

---

### PATCH /api/work-orders/:id
Update a work order (close with return km).

**Request Body:**
```json
{
  "status": "closed",
  "returnKm": 100150,
  "notes": "ملاحظات"
}
```

---

## Fuel Transactions

### GET /api/fuel-transactions
Get fuel transactions with filtering and summary stats.

**Query Parameters:**
- `vehicleId` (string)
- `type` (string) - D (debit) or C (credit)
- `startDate` (ISO date)
- `endDate` (ISO date)
- `page` (number)
- `limit` (number)

**Response:**
```json
{
  "transactions": [...],
  "total": 500,
  "page": 1,
  "totalPages": 25,
  "totalPurchases": 150000,
  "totalPayments": 50000,
  "balance": 100000,
  "spendingPerVehicle": [...]
}
```

---

## Maintenance

### GET /api/maintenance
Get maintenance records.

**Query Parameters:**
- `vehicleId` (string)
- `page` (number)
- `limit` (number)

**Response:**
```json
{
  "records": [...],
  "total": 100,
  "page": 1,
  "totalPages": 5
}
```

---

### POST /api/maintenance
Create a maintenance record.

**Request Body:**
```json
{
  "vehicleId": "cuid",
  "type": "oil_change",
  "description": "تغيير زيت المحرك",
  "cost": 150,
  "kmAtService": 100000,
  "nextServiceKm": 105000,
  "serviceDate": "2024-01-01T00:00:00Z",
  "provider": "محطة الخدمة",
  "notes": ""
}
```

**Valid types:** oil_change, filter, belt, wash, lubrication, quick_service, other

---

## Tires

### GET /api/tires
Get tire records.

**Query Parameters:**
- `vehicleId` (string)
- `page` (number)
- `limit` (number)

---

### POST /api/tires
Create a tire record.

**Request Body:**
```json
{
  "vehicleId": "cuid",
  "position": "front_left",
  "brand": "Michelin",
  "size": "205/55R16",
  "installKm": 100000,
  "currentKm": 100500,
  "maxKm": 80000,
  "status": "active"
}
```

**Valid positions:** front_left, front_right, rear_left, rear_right, spare

---

## Spare Parts

### GET /api/spare-parts
Get spare parts records.

---

### POST /api/spare-parts
Create a spare part record.

**Request Body:**
```json
{
  "vehicleId": "cuid",
  "partName": "فلتر هواء",
  "quantity": 2,
  "unitCost": 50,
  "totalCost": 100,
  "supplier": "المورد",
  "installDate": "2024-01-01",
  "installKm": 100000,
  "expectedLife": "6 أشهر",
  "notes": ""
}
```

---

## Dashboard

### GET /api/dashboard
Get dashboard statistics and metrics.

**Response:**
```json
{
  "totalVehicles": 50,
  "openWorkOrders": 10,
  "totalFuelCost": 75000,
  "maintenanceAlerts": 5,
  "fuelByBranch": [...],
  "vehicleTypeData": [...],
  "monthlyTrend": [...],
  "recentWorkOrders": [...],
  "monthNames": ["يناير", ...]
}
```

---

## Branches

### GET /api/branches
Get branch data with aggregated metrics.

**Response:**
```json
[
  {
    "id": "...",
    "name": "الرياض",
    "latitude": 24.7136,
    "longitude": 46.6753,
    "address": "...",
    "phoneNumber": "...",
    "managerName": "...",
    "vehicleCount": 20,
    "fuelCost": 15000,
    "maintenanceCost": 2000,
    "maintenanceCount": 5,
    "openWorkOrders": 2,
    "totalWorkOrders": 10
  }
]
```

---

## Reports

### GET /api/reports/fuel-consumption
Get fuel consumption report per vehicle.

---

### GET /api/reports/maintenance-cost
Get maintenance cost report.

**Query Parameters:**
- `startDate` (ISO date)
- `endDate` (ISO date)

**Response:**
```json
{
  "report": [...],
  "typeReport": [...],
  "summary": {
    "totalCost": 50000,
    "vehicleCount": 20,
    "totalRecords": 100
  }
}
```

---

### GET /api/reports/distance-deviation
Get distance deviation report for closed work orders.

**Response:**
```json
{
  "report": [...],
  "summary": {
    "totalOrders": 50,
    "totalEstimated": 7500,
    "totalActual": 7800,
    "totalDeviation": 300,
    "avgDeviationPercent": 4
  }
}
```

---

## Backup

### GET /api/backup
Create a manual database backup.

**Response:**
```json
{
  "success": true,
  "message": "تم إنشاء النسخة الاحتياطية بنجاح",
  "fileName": "backup-20240101-120000.db",
  "size": 1024000,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

---

### PUT /api/backup
List backups and database stats.

**Response:**
```json
{
  "backups": [...],
  "stats": {
    "vehicles": 50,
    "workOrders": 100,
    "fuelTransactions": 500,
    "maintenanceRecords": 200
  }
}
```

---

### DELETE /api/backup?file=filename
Delete a backup file.

---

## Import Data

### POST /api/import-data
Import data from Excel files.

**Form Data:**
- `file` (File) - Excel file (.xlsx)
- `mode` (string) - "all", "vehicles", or "fuel"

**Response:**
```json
{
  "success": true,
  "message": "تم استيراد البيانات بنجاح",
  "mode": "all",
  "result": {
    "vehicles": { "imported": 10, "skipped": 2, "errors": [] },
    "fuelTransactions": { "imported": 100, "skipped": 5, "errors": [] }
  }
}
```

---

## Geocoding

### GET /api/geocode?q=search query
Search for locations using OpenStreetMap Nominatim.

**Response:**
```json
{
  "results": [
    {
      "placeId": "...",
      "displayName": "الرياض، المملكة العربية السعودية",
      "lat": 24.7136,
      "lon": 46.6753,
      "type": "city",
      "class": "place"
    }
  ]
}
```

---

## Route Calculation

### POST /api/route
Calculate route distance and time between multiple points.

**Request Body:**
```json
{
  "points": [
    { "lat": 24.7136, "lon": 46.6753, "name": "الرياض" },
    { "lat": 21.5433, "lon": 39.1727, "name": "جدة" }
  ],
  "returnPoint": { "lat": 24.7136, "lon": 46.6753, "name": "الرياض" }
}
```

**Response:**
```json
{
  "outboundDistance": 870,
  "outboundDuration": 1044,
  "outboundTime": "17 س 24 د",
  "outboundArrival": "ص 03:24",
  "returnDistance": 870,
  "returnDuration": 1044,
  "returnTime": "17 س 24 د",
  "returnArrival": "ص 03:48",
  "totalDistance": 1740,
  "totalDuration": 2088,
  "totalTime": "34 س 48 د",
  "totalArrival": "ص 03:48",
  "hasReturn": true,
  "segments": [...]
}
```

---

## Database Setup

### GET /api/db-setup
Initialize database tables if they don't exist.

---

## Seed Branches

### GET /api/seed-branches
Seed default branch data (Saudi Arabia branches).

---

## Error Responses

All endpoints may return error responses:

**400 Bad Request:**
```json
{
  "error": "فشل التحقق من البيانات",
  "requestId": "uuid",
  "fields": { "fieldName": "خطأ في الحقل" }
}
```

**404 Not Found:**
```json
{
  "error": "المركبة غير موجودة",
  "requestId": "uuid"
}
```

**500 Internal Server Error:**
```json
{
  "error": "حدث خطأ في المعالجة",
  "requestId": "uuid"
}
```

---

## Notes
- All dates in requests should be ISO 8601 format
- Pagination uses 1-based page numbers
- Default limit is 20, maximum is 100
- Arabic error messages are used throughout