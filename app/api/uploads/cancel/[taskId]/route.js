import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  // Fix the NextJS App Router parameter access
  const taskId = params.taskId;

  try {
    // Get the request body for client_id
    const body = await request.json();
    const clientId = body.client_id;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Forward the cancellation request to the backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const cancelUrl = `${apiUrl}/uploads/task/${taskId}`;

    // Get auth token from original request headers
    const authHeader = request.headers.get('Authorization');
    const headers = {
      'Content-Type': 'application/json'
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    try {
      // Send DELETE request to backend
      const response = await fetch(cancelUrl, {
        method: 'DELETE',
        headers,
        // Include client_id if available
        ...(clientId && { body: JSON.stringify({ client_id: clientId }) })
      });

      // Forward the response from the backend
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json(
        {
          error: 'Could not connect to backend server',
          details: fetchError.message,
          url: cancelUrl
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error cancelling task:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel task' },
      { status: 500 }
    );
  }
}