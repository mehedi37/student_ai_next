import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request, { params }) {
  // Fix: await params before destructuring
  const paramsObj = await params;
  const { clientId, taskId } = paramsObj;
  const encoder = new TextEncoder();

  // Get authentication token from cookies, headers or query params
  const cookieStore = cookies();
  const tokenFromCookie = cookieStore.get('access_token')?.value;
  const authHeader = request.headers.get('authorization');
  const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const url = new URL(request.url);
  const tokenFromQuery = url.searchParams.get('token');

  // Use the first available token
  const token = tokenFromHeader || tokenFromCookie || tokenFromQuery;

  // Create a TransformStream for sending SSE events
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Function to send SSE events
  const sendEvent = async (event, data) => {
    await writer.write(
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    );
  };

  // Function to close the stream
  const closeStream = async () => {
    await writer.close();
  };

  // Send immediate connection event
  sendEvent('connected', {
    clientId,
    taskId,
    timestamp: new Date().toISOString(),
    message: 'SSE connection established'
  });

  // Connect to the FastAPI backend for real-time updates
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const intervalId = setInterval(async () => {
    try {
      // Make a request to the FastAPI backend using the correct endpoint path
      // Include the authentication token in the request
      const headers = {
        'Accept': 'application/json'
      };

      // Add Authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiBaseUrl}/uploads/status/${taskId}?client_id=${clientId}`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch task status: ${response.status}`);
      }

      const data = await response.json();

      // Send progress event with the data
      await sendEvent('progress', data);

      // If the task is complete or failed, clear the interval
      if (data.status === 'completed' || data.status === 'failed' ||
          data.status === 'error' || data.status === 'cancelled') {
        clearInterval(intervalId);
        setTimeout(closeStream, 1000); // Wait 1 second before closing
      }
    } catch (error) {
      console.error('Error fetching task status:', error);
      await sendEvent('error', {
        error: 'Failed to fetch task status',
        details: error.message
      });
      clearInterval(intervalId);
      setTimeout(closeStream, 1000);
    }
  }, 1000); // Check every second

  // Set response headers for SSE
  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable buffering for Nginx
    }
  });
}