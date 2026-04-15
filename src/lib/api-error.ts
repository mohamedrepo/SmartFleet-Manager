import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public context?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(
  error: unknown,
  context: string,
  defaultMessage: string = 'حدث خطأ في المعالجة'
) {
  const requestId = crypto.randomUUID();

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const issues = (error as unknown as { issues?: unknown[] })?.issues || [];
    const fieldErrors: Record<string, string> = {};
    
    for (const issue of issues) {
      if (issue && typeof issue === 'object' && 'path' in issue && 'message' in issue) {
        const path = (issue.path as (string | number)[]).join('.');
        fieldErrors[path] = String(issue.message);
      }
    }

    console.warn(
      `[${requestId}][${context}] Validation error:`,
      JSON.stringify(fieldErrors)
    );

    return NextResponse.json(
      {
        error: 'فشل التحقق من البيانات',
        requestId,
        fields: fieldErrors,
      },
      { status: 400 }
    );
  }

  // Handle custom API errors
  if (error instanceof ApiError) {
    console.warn(
      `[${requestId}][${context}][${error.statusCode}]`,
      error.message
    );

    return NextResponse.json(
      {
        error: error.message,
        requestId,
      },
      { status: error.statusCode }
    );
  }

  // Handle standard errors
  if (error instanceof Error) {
    console.error(
      `[${requestId}][${context}]`,
      error.name,
      error.message
    );

    // Don't expose internal error details in production
    return NextResponse.json(
      {
        error: defaultMessage,
        requestId,
      },
      { status: 500 }
    );
  }

  // Handle unknown errors
  console.error(`[${requestId}][${context}]`, 'Unknown error:', error);

  return NextResponse.json(
    {
      error: defaultMessage,
      requestId,
    },
    { status: 500 }
  );
}

export function createErrorResponse(
  statusCode: number,
  message: string,
  requestId: string
) {
  return NextResponse.json(
    {
      error: message,
      requestId,
    },
    { status: statusCode }
  );
}
