import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { clientId } = params;

  try {
    // Verify this is a WebSocket request
    const upgrade = request.headers.get('upgrade');
    const connection = request.headers.get('connection');

    if (!upgrade || upgrade.toLowerCase() !== 'websocket') {
      return new NextResponse('Expected WebSocket connection', { status: 400 });
    }

    if (!connection || !connection.toLowerCase().includes('upgrade')) {
      return new NextResponse('Expected WebSocket connection upgrade', { status: 400 });
    }

    // Log the WebSocket connection
    console.log(`WebSocket connection established for client: ${clientId}`);

    // This is critical - we need to let the runtime know we're a WebSocket
    // by explicitly setting these response headers. Without them, the WebSocket
    // handshake will fail.
    const res = new NextResponse(null, {
      status: 101,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Accept': request.headers.get('sec-websocket-key')
      }
    });

    return res;
  } catch (error) {
    console.error('Error handling WebSocket connection:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}