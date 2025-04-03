import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request, { params }) {
  const { clientId, taskId } = params;

  // Set headers for SSE
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Create a transform stream to handle the SSE events
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Create and return the response with the stream
  const response = new Response(stream.readable, { headers });

  // Helper to send SSE messages
  const sendEvent = async (data) => {
    try {
      await writer.write(
        new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
      );
    } catch (error) {
      console.error('Error sending SSE event:', error);
    }
  };

  // Connect to the backend SSE endpoint to proxy events
  const proxySSE = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const backendUrl = `${apiUrl}/uploads/sse/progress/${clientId}/${taskId}`;

      // Add auth token if available in the request
      const authHeader = request.headers.get('Authorization');
      const headers = {};
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      const eventSource = new EventSource(backendUrl);

      eventSource.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          await sendEvent(data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = async (error) => {
        console.error('SSE error:', error);
        await sendEvent({
          type: 'error',
          task_id: taskId,
          error: 'Connection to event source failed',
          timestamp: new Date().toISOString()
        });
        eventSource.close();
      };

      // Clean up when client disconnects
      response.signal.addEventListener('abort', () => {
        eventSource.close();
      });
    } catch (error) {
      console.error('Error setting up SSE proxy:', error);
      await sendEvent({
        type: 'error',
        task_id: taskId,
        error: 'Failed to connect to event source',
        timestamp: new Date().toISOString()
      });
      writer.close();
    }
  };

  // Start the SSE proxy without waiting
  proxySSE().catch(console.error);

  return response;
}