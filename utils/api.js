const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * Fetch wrapper for API calls
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Default headers
  const headers = {
    ...options.headers,
  };

  // Add Content-Type only if not FormData (browser will set it for FormData)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add auth token if available
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include', // Include cookies in all requests
  };

  try {
    const response = await fetch(url, config);

    // If response is not ok, throw error
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        status: response.status,
        message: response.statusText
      }));
      throw new Error(errorData.detail || errorData.message || `API request failed with status ${response.status}`);
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
    file: (file, clientId = null) => {
      if (!clientId) {
        console.warn('No client_id provided for file upload, this may cause issues');
      }

      const formData = new FormData();
      formData.append('file', file);

      // Ensure client_id is always included in the URL
      const endpoint = `/uploads/file${clientId ? `?client_id=${encodeURIComponent(clientId)}` : ''}`;

      return fetchAPI(endpoint, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header for FormData, browser will set it with boundary
      });
    },

    youtube: (url, clientId = null) => {
      if (!clientId) {
        console.warn('No client_id provided for YouTube upload, this may cause issues');
      }

      const endpoint = `/uploads/youtube${clientId ? `?client_id=${encodeURIComponent(clientId)}` : ''}`;

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
