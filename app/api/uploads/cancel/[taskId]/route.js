import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request, { params }) {
  // Fix: await params before destructuring
  const paramsObj = await params;
  const { taskId } = paramsObj;

  try {
    const body = await request.json();
    const clientId = body.client_id;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Get authentication token from cookies, headers or query params
    const cookieStore = cookies();
    const tokenFromCookie = cookieStore.get('access_token')?.value;
    const authHeader = request.headers.get('authorization');
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const url = new URL(request.url);
    const tokenFromQuery = url.searchParams.get('token');

    // Use the first available token
    const token = tokenFromHeader || tokenFromCookie || tokenFromQuery;

    // Connect to the FastAPI backend
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

    // Set up headers including Authorization if token is available
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Forward the cancellation request to the FastAPI backend using the correct endpoint path
    const response = await fetch(`${apiBaseUrl}/uploads/task/${taskId}`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ client_id: clientId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || 'Failed to cancel task' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error cancelling task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}