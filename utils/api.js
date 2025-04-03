const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * Fetch wrapper for API calls
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Default headers
  const headers = {
    ...options.headers,
    // Add Origin header to help server determine the correct CORS response
    'Origin': typeof window !== 'undefined' ? window.location.origin : 'https://student-ai-next.vercel.app'
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
    mode: 'cors', // Explicitly set CORS mode
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
    loginOAuth: (formData) => fetchAPI('/auth/login/oauth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(formData),
    }),
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
    file: (fileData) => fetchAPI('/uploads/file', {
      method: 'POST',
      body: fileData,
    }),

    youtube: (urlData) => fetchAPI('/uploads/youtube', {
      method: 'POST',
      body: JSON.stringify(urlData),
    }),

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
    create: () => fetchAPI('/sessions/', {
      method: 'POST',
    }),
    delete: (sessionId) => fetchAPI(`/sessions/${sessionId}`, {
      method: 'DELETE',
    }),
    deleteAll: () => fetchAPI('/sessions/', {
      method: 'DELETE',
    }),
  },

  // Quiz endpoints
  quizzes: {
    list: (page = 1, pageSize = 10, topic = null) => {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });

      if (topic) {
        params.append('topic', topic);
      }

      return fetchAPI(`/quizzes/?${params.toString()}`);
    },
    get: (quizId) => fetchAPI(`/quizzes/${quizId}`),
    delete: (quizId) => fetchAPI(`/quizzes/${quizId}`, {
      method: 'DELETE',
    }),
    submit: (data) => fetchAPI('/quizzes/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // Health check
  health: () => fetchAPI('/health'),

  // User session data
  user: {
    getSessionData: () => fetchAPI('/user/session'),
  },

  // System endpoints (admin only)
  system: {
    getStatus: () => fetchAPI('/system/status'),
    getAlerts: (count = 10, level = null) => {
      const params = new URLSearchParams({ count });
      if (level) params.append('level', level);
      return fetchAPI(`/system/alerts?${params}`);
    },
    performAction: (action, parameters = null) => {
      return fetchAPI('/system/action', {
        method: 'POST',
        body: JSON.stringify({ action, parameters }),
      });
    },
    getPerformanceMetrics: () => fetchAPI('/system/performance/metrics'),
  },

  // Diagnostic endpoints (admin/debugging)
  diagnostics: {
    semantic: {
      analyze: (query) => fetchAPI('/diagnostics/semantic/analyze', {
        method: 'POST',
        body: JSON.stringify({ query }),
      }),
      batchAnalyze: (data) => fetchAPI('/diagnostics/semantic/batch-analyze', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      getModelsStatus: () => fetchAPI('/diagnostics/semantic/models'),
      clearCaches: () => fetchAPI('/diagnostics/semantic/clear-caches', {
        method: 'POST',
      }),
    },
    gpu: {
      getMemory: () => fetchAPI('/diagnostics/gpu/memory'),
    },
    embeddings: {
      getOptimalBatches: () => fetchAPI('/diagnostics/embeddings/optimal-batches'),
    },
    performance: {
      runBenchmark: () => fetchAPI('/diagnostics/performance/benchmark', {
        method: 'POST',
      }),
    },
  },

  // Embedding service
  embeddings: {
    getStatus: () => fetchAPI('/embeddings/status'),
  },
};
