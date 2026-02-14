import logger from './logger.js';

/**
 * Utility to execute Supabase queries with intelligent retry logic for schema cache issues.
 * @param {Function} queryFn - Function that returns a Supabase query promise
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {string} options.context - Context for logging (e.g., 'createStudent')
 * @param {Array<string>} options.retryableMessages - Custom error messages that should trigger a retry
 * @returns {Promise<Object>} - Supabase response { data, error }
 */
export const withRetry = async (queryFn, { 
  maxRetries = 3, 
  initialDelay = 1000, 
  context = 'Supabase Query',
  retryableMessages = []
} = {}) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await queryFn();
      if (!result) {
        throw new Error("Query function returned undefined or null result");
      }
      const { data, error } = result;

      // Check for RPC internal errors returned in data (status: error)
      const isInternalError = data && data.status === 'error';
      const errorMessage = isInternalError ? data.message : (error ? error.message : '');

      if (error || isInternalError) {
        // PGRST204: Schema cache mismatch
        // PGRST202: Could not find the function in the schema cache
        const retryableCodes = ['PGRST204', 'PGRST202'];
        
        const shouldRetry = (error && retryableCodes.includes(error.code)) || 
                          retryableMessages.some(msg => errorMessage.includes(msg));
        
        if (shouldRetry) {
          lastError = error || data;
          const delay = initialDelay * Math.pow(2, i);
          
          logger.warn({
            message: `Retryable error detected in ${context}. Retrying...`,
            attempt: i + 1,
            maxRetries,
            delay: `${delay}ms`,
            error: errorMessage,
            timestamp: new Date().toISOString()
          });

          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        return { data, error };
      }
      
      return { data, error: null };
    } catch (err) {
      if (err.code === 'PGRST204' || err.message?.includes('PGRST204')) {
        lastError = err;
        const delay = initialDelay * Math.pow(2, i);
        
        logger.warn({
          message: `Unexpected exception with PGRST204 in ${context}. Retrying...`,
          attempt: i + 1,
          maxRetries,
          delay: `${delay}ms`,
          error: err.message,
          timestamp: new Date().toISOString()
        });

        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      throw err;
    }
  }

  return { data: null, error: lastError };
};
