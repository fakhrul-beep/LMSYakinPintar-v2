import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;

// Tracking for connection errors to detect persistent issues
const connectionErrorTracker = {
  errors: [],
  THRESHOLD: 3,
  TIME_WINDOW: 5 * 60 * 1000, // 5 minutes
};

// Simulated Monitoring/Alerting Service
const reportToMonitoring = (type, data) => {
  const payload = {
    timestamp: new Date().toISOString(),
    type,
    app_version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev',
    ...data
  };
  
  // In a real app, this would be an API call to Sentry, Datadog, or a custom logs endpoint
  console.info(`[Monitoring Alert] ${type.toUpperCase()}:`, payload);
  
  // Example: If it's a persistent connection error, we could show a global alert
  if (type === 'persistent_connection_failure') {
    window.dispatchEvent(new CustomEvent('global-alert', { 
      detail: { type: 'error', message: 'Koneksi ke server bermasalah secara persisten.' } 
    }));
  }
};

const trackConnectionError = () => {
  const now = Date.now();
  connectionErrorTracker.errors.push(now);
  
  // Filter errors within the time window
  connectionErrorTracker.errors = connectionErrorTracker.errors.filter(
    timestamp => now - timestamp <= connectionErrorTracker.TIME_WINDOW
  );

  if (connectionErrorTracker.errors.length >= connectionErrorTracker.THRESHOLD) {
    reportToMonitoring('persistent_connection_failure', { 
      error_count: connectionErrorTracker.errors.length,
      window_ms: connectionErrorTracker.TIME_WINDOW
    });
    // Reset tracker to avoid repeated alerts too quickly
    connectionErrorTracker.errors = [];
  }
};

// Response interceptor for better error handling and retry mechanism
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error;
    
    // Check for network errors (no response from server)
    if (!error.response || error.code === 'ECONNABORTED') {
      trackConnectionError();
    }

    const isSchemaSyncError = error.response?.status === 503 && 
      (error.response?.data?.message?.toLowerCase().includes("sinkronisasi skema") || 
       error.response?.data?.message?.toLowerCase().includes("schema sync"));
    
    const isMissingTableError = error.response?.status === 500 && 
      (error.response?.data?.message?.toLowerCase().includes("could not find the table") || 
       error.response?.data?.message?.toLowerCase().includes("schema cache"));
    const isSchemaError = isSchemaSyncError || isMissingTableError;

    // If schema error, notify UI through custom event
    if (isSchemaError) {
      window.dispatchEvent(new CustomEvent('database-sync-status', { 
        detail: { 
          isSyncing: true, 
          message: isMissingTableError 
            ? "Database sedang menyegarkan struktur data. Silakan tunggu..." 
            : error.response.data.message 
        } 
      }));
    }
    
    // Only retry on network errors, 5xx server errors, or specific PostgREST schema errors
    const shouldRetry = !error.response || (error.response.status >= 500 && error.response.status <= 599) || isSchemaError;
    
    // If we should retry and haven't reached max retries, don't log the error yet
    if (shouldRetry && (!config || (config._retryCount || 0) < MAX_RETRIES)) {
      config._retryCount = (config._retryCount || 0) + 1;
      
      // Exponential backoff delay - use longer delay for schema synchronization errors
      const baseDelay = isSchemaError ? 3000 : INITIAL_DELAY;
      const delay = baseDelay * Math.pow(2, config._retryCount - 1);
      
      console.log(`[Retry ${config._retryCount}/${MAX_RETRIES}] Database sync in progress, retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        const result = await api(config);
        // If retry succeeds and it was a schema error, clear the syncing status
        if (isSchemaError) {
          window.dispatchEvent(new CustomEvent('database-sync-status', { 
            detail: { isSyncing: false } 
          }));
        }
        return result;
      } catch (retryError) {
        // If the retry itself fails, the interceptor will be called again recursively
        return Promise.reject(retryError);
      }
    }

    // If config does not exist or retry limit reached, or not a retryable error, proceed to final error handling
    if (isSchemaError) {
      window.dispatchEvent(new CustomEvent('database-sync-status', { 
        detail: { isSyncing: false } 
      }));
      // Suppress console.error for schema sync errors as they are handled via UI notifications
      console.warn("[Schema Sync] Final retry attempt failed or limit reached. User notified via UI.");
      
      // Report to monitoring
      reportToMonitoring('database_sync_timeout', {
        status: error.response?.status,
        retry_count: config?._retryCount || 0,
        url: config?.url
      });
    }

    let message = "Terjadi kesalahan pada koneksi jaringan";
 
     if (error.response) {
       // Server responded with a status code out of 2xx range
       const data = error.response.data;
       
       if (data.errors && Array.isArray(data.errors)) {
         // Format Zod validation errors: "Field: Message, Field2: Message2"
         message = data.errors.map(err => err.message).join(". ");
       } else {
         message = data.message || `Error: ${error.response.status}`;
       }
       
       // Only log critical errors to console.error, use warn for expected sync issues
       if (isSchemaError) {
         console.warn("Database sync still in progress after retries:", data);
       } else {
         console.error("Backend Error:", data);
       }
     } else if (error.request) {
       // Request was made but no response received (CORS or Network issue)
       message = "Tidak dapat terhubung ke server. Pastikan koneksi internet aktif dan server berjalan.";
       console.error("Network/CORS Error:", error.request);
     } else {
       // Something else happened
       message = error.message;
       console.error("Request Error:", error.message);
     }

     // Attach user-friendly message to error object
     error.friendlyMessage = message;
     return Promise.reject(error);
   }
);

export default api;
