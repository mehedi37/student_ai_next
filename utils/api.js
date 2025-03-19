const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * Fetch wrapper for API calls
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // If response is not ok, throw error
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'API request failed');
    }

    // Return JSON data or empty object if no content
    if (response.status === 204) return {};
    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}

export const api = {
  // Auth endpoints
  auth: {
    register: (data) => fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    login: (data) => fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    logout: () => fetchAPI('/auth/logout', {
      method: 'POST',
    }),
    refreshToken: () => fetchAPI('/auth/token/refresh', {
      method: 'POST',
    }),
    getProfile: () => fetchAPI('/auth/user/me'),
  },

  // Chat endpoint
  chat: {
    send: (data) => fetchAPI('/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // Upload endpoints
  uploads: {
    file: (file, clientId) => {
      const formData = new FormData();
      formData.append('file', file);

      const url = clientId ?
        `/uploads/file?client_id=${encodeURIComponent(clientId)}` :
        '/uploads/file';

      return fetchAPI(url, {
        method: 'POST',
        headers: {
          // Remove Content-Type to let the browser set it with boundary
          'Content-Type': undefined,
        },
        body: formData,
      });
    },
    youtube: (url, clientId) => {
      const endpoint = clientId ?
        `/uploads/youtube?client_id=${encodeURIComponent(clientId)}` :
        '/uploads/youtube';

      return fetchAPI(endpoint, {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
    },
    status: (taskId) => fetchAPI(`/uploads/status/${taskId}`),
    documents: () => fetchAPI('/uploads/documents'),
    terminateTask: (taskId) => fetchAPI(`/uploads/task/${taskId}`, {
      method: 'DELETE',
    }),
  },

  // Sessions endpoints
  sessions: {
    list: (limit = 20) => fetchAPI(`/sessions/?limit=${limit}`),
    get: (sessionId) => fetchAPI(`/sessions/${sessionId}`),
    delete: (sessionId) => fetchAPI(`/sessions/${sessionId}`, {
      method: 'DELETE',
    }),
    deleteAll: () => fetchAPI('/sessions/', {
      method: 'DELETE',
    }),
  },

  // Health check
  health: () => fetchAPI('/health'),
};
