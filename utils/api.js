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
    file: (fileData, clientId = null) => {
      if (!clientId) {
        console.warn('No client_id provided for file upload, this may cause issues');
      }

      let formData;
      // Handle different input types
      if (fileData instanceof FormData) {
        // If already a FormData, use it directly
        formData = fileData;
      } else {
        // Otherwise create a new FormData and append the file
        formData = new FormData();
        formData.append('file', fileData);
      }

      const endpoint = `/uploads/file${clientId ? `?client_id=${encodeURIComponent(clientId)}` : ''}`;

      return fetchAPI(endpoint, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, browser will set it with boundary
      });
    },

    youtube: (urlData, clientId = null) => {
      const endpoint = `/uploads/youtube${clientId ? `?client_id=${encodeURIComponent(clientId)}` : ''}`;

      // Format the request body according to the YouTubeUploadRequest schema
      let normalizedUrl = urlData;
      if (typeof urlData === 'string') {
        // Normalize YouTube URLs
        if (urlData.includes('youtu.be/')) {
          // Convert youtu.be format to full URL
          const videoId = urlData.split('youtu.be/')[1].split('?')[0];
          normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;
        }

        const requestBody = { url: normalizedUrl };
        return fetchAPI(endpoint, {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });
      }

      // Handle if urlData is already an object
      return fetchAPI(endpoint, {
        method: 'POST',
        body: JSON.stringify(urlData),
      });
    },

    status: (taskId) => fetchAPI(`/uploads/status/${taskId}`),
    documents: () => fetchAPI('/uploads/documents'),
    terminateTask: (taskId) => {
      if (!taskId) {
        return Promise.reject(new Error('No task ID provided'));
      }

      return fetchAPI(`/uploads/task/${taskId}`, {
        method: 'DELETE',
      }).then(response => {
        // Return a standardized response
        return {
          success: true,
          message: response.message || 'Task terminated successfully',
          ...response
        };
      }).catch(error => {
        console.error('Error terminating task:', error);
        throw error;
      });
    },
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
