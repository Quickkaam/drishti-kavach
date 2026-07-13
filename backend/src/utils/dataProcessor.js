// ============================================
// Drishti Kavach — Data Processing Utility
// Combines compression and encryption for optimal storage
// ============================================

const compression = require('./compression');
const encryption = require('./encryption');

// Sensitive field patterns (case-insensitive)
const SENSITIVE_FIELD_PATTERNS = [
  /password/i,
  /secret/i,
  /key/i,
  /token/i,
  /auth/i,
  /credential/i,
  /private/i,
  /ssn/i,
  /pan/i,
  /aadhaar/i,
  /credit.?card/i,
  /cvv/i,
  /pin/i,
];

// Large data field patterns that benefit from compression
const LARGE_DATA_FIELD_PATTERNS = [
  /data/i,
  /details/i,
  /payload/i,
  /content/i,
  /body/i,
  /message/i,
  /log/i,
  /event/i,
  /trace/i,
  /debug/i,
];

/**
 * Process data for storage (encrypt + compress)
 * @param {Object} data - Data to process
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processed data
 */
async function processForStorage(data, options = {}) {
  const result = { ...data };
  const metadata = {
    processing: {
      timestamp: new Date().toISOString(),
      version: '1.0',
      operations: [],
    },
  };
  
  try {
    // Step 1: Identify and encrypt sensitive fields
    const sensitiveFields = identifySensitiveFields(result);
    if (sensitiveFields.length > 0) {
      const encryptionOptions = {
        algorithm: options.encryptionAlgorithm || encryption.DEFAULT_ALGORITHM,
        ...options.encryption,
      };
      
      for (const field of sensitiveFields) {
        if (result[field] !== undefined && result[field] !== null) {
          try {
            const encrypted = await encryption.encryptData(String(result[field]), encryptionOptions);
            result[`${field}_encrypted`] = encrypted;
            delete result[field];
            
            metadata.processing.operations.push({
              type: 'encryption',
              field,
              algorithm: encrypted.algorithm,
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            console.error(`Failed to encrypt field ${field}:`, error);
            // Remove field if encryption fails
            delete result[field];
            metadata.processing.errors = metadata.processing.errors || [];
            metadata.processing.errors.push({
              field,
              operation: 'encryption',
              error: error.message,
            });
          }
        }
      }
    }
    
    // Step 2: Identify and compress large data fields
    const compressibleFields = identifyCompressibleFields(result);
    if (compressibleFields.length > 0) {
      const compressionOptions = {
        algorithm: options.compressionAlgorithm || compression.ALGORITHMS.BROTLI,
        level: options.compressionLevel || 6,
        ...options.compression,
      };
      
      for (const field of compressibleFields) {
        if (result[field] && typeof result[field] === 'object') {
          try {
            const fieldData = result[field];
            const shouldCompress = compression.shouldCompress(JSON.stringify(fieldData));
            
            if (shouldCompress) {
              const compressed = await compression.compressJson(fieldData, {
                field,
                algorithm: compressionOptions.algorithm,
              });
              
              result[`${field}_compressed`] = compressed.toString('base64');
              result[`${field}_algorithm`] = compressionOptions.algorithm;
              delete result[field];
              
              metadata.processing.operations.push({
                type: 'compression',
                field,
                algorithm: compressionOptions.algorithm,
                originalSize: Buffer.byteLength(JSON.stringify(fieldData)),
                compressedSize: compressed.length,
                timestamp: new Date().toISOString(),
              });
            }
          } catch (error) {
            console.error(`Failed to compress field ${field}:`, error);
            metadata.processing.errors = metadata.processing.errors || [];
            metadata.processing.errors.push({
              field,
              operation: 'compression',
              error: error.message,
            });
          }
        }
      }
    }
    
    // Step 3: Add processing metadata
    result._processing_metadata = metadata;
    
    // Step 4: Calculate and add storage statistics
    const stats = await calculateStorageStats(result);
    result._storage_stats = stats;
    
    return result;
    
  } catch (error) {
    console.error('Data processing error:', error);
    throw new Error(`Failed to process data for storage: ${error.message}`);
  }
}

/**
 * Restore processed data
 * @param {Object} processedData - Processed data
 * @param {Object} options - Restoration options
 * @returns {Promise<Object>} Restored data
 */
async function restoreFromStorage(processedData, options = {}) {
  const result = { ...processedData };
  
  try {
    // Remove metadata fields
    delete result._processing_metadata;
    delete result._storage_stats;
    
    // Step 1: Decompress compressed fields
    const compressedFields = Object.keys(result)
      .filter(key => key.endsWith('_compressed'))
      .map(key => key.replace('_compressed', ''));
    
    for (const field of compressedFields) {
      const compressedKey = `${field}_compressed`;
      const algorithmKey = `${field}_algorithm`;
      
      if (result[compressedKey]) {
        try {
          const compressedBuffer = Buffer.from(result[compressedKey], 'base64');
          const decompressed = await compression.decompressJson(compressedBuffer);
          result[field] = decompressed;
          
          // Remove compression metadata
          delete result[compressedKey];
          if (result[algorithmKey]) delete result[algorithmKey];
        } catch (error) {
          console.error(`Failed to decompress field ${field}:`, error);
          // Keep field as null if decompression fails
          result[field] = null;
        }
      }
    }
    
    // Step 2: Decrypt encrypted fields
    const encryptedFields = Object.keys(result)
      .filter(key => key.endsWith('_encrypted') && typeof result[key] === 'object')
      .map(key => key.replace('_encrypted', ''));
    
    for (const field of encryptedFields) {
      const encryptedKey = `${field}_encrypted`;
      
      try {
        const encryptedData = result[encryptedKey];
        const decryptedBuffer = await encryption.decryptData(encryptedData, options);
        result[field] = decryptedBuffer.toString('utf8');
        
        // Remove encryption metadata
        delete result[encryptedKey];
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
        // Keep field as null if decryption fails
        result[field] = null;
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('Data restoration error:', error);
    throw new Error(`Failed to restore data from storage: ${error.message}`);
  }
}

/**
 * Identify sensitive fields in an object
 * @param {Object} data - Data object
 * @returns {Array<string>} List of sensitive field names
 */
function identifySensitiveFields(data) {
  const fields = [];
  
  for (const key in data) {
    if (typeof key === 'string') {
      for (const pattern of SENSITIVE_FIELD_PATTERNS) {
        if (pattern.test(key)) {
          fields.push(key);
          break;
        }
      }
    }
  }
  
  return [...new Set(fields)]; // Remove duplicates
}

/**
 * Identify compressible fields in an object
 * @param {Object} data - Data object
 * @returns {Array<string>} List of compressible field names
 */
function identifyCompressibleFields(data) {
  const fields = [];
  
  for (const key in data) {
    if (typeof key === 'string') {
      // Check if field matches large data patterns
      for (const pattern of LARGE_DATA_FIELD_PATTERNS) {
        if (pattern.test(key) && data[key] && typeof data[key] === 'object') {
          fields.push(key);
          break;
        }
      }
    }
  }
  
  return [...new Set(fields)]; // Remove duplicates
}

/**
 * Calculate storage statistics
 * @param {Object} data - Data object
 * @returns {Promise<Object>} Storage statistics
 */
async function calculateStorageStats(data) {
  try {
    const originalJson = JSON.stringify(data);
    const originalSize = Buffer.byteLength(originalJson);
    
    // Calculate compressed size
    let compressedSize = originalSize;
    try {
      const compressed = await compression.compressData(originalJson);
      compressedSize = compressed.length;
    } catch (error) {
      // Use original size if compression fails
    }
    
    // Count encrypted fields
    const encryptedFields = Object.keys(data).filter(key => 
      key.endsWith('_encrypted') && typeof data[key] === 'object'
    ).length;
    
    // Count compressed fields
    const compressedFields = Object.keys(data).filter(key => 
      key.endsWith('_compressed') && typeof data[key] === 'string'
    ).length;
    
    // Calculate savings
    const savings = originalSize > 0 ? ((originalSize - compressedSize) / originalSize) * 100 : 0;
    
    return {
      originalSize,
      compressedSize,
      savings: savings.toFixed(2) + '%',
      bytesSaved: originalSize - compressedSize,
      encryptedFields,
      compressedFields,
      totalFields: Object.keys(data).length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Storage stats calculation error:', error);
    return {
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Optimize database record
 * @param {Object} record - Database record
 * @param {Object} schema - Table schema information
 * @returns {Promise<Object>} Optimized record
 */
async function optimizeDatabaseRecord(record, schema = {}) {
  const optimized = { ...record };
  
  // Apply schema-specific optimizations
  if (schema.sensitiveFields) {
    for (const field of schema.sensitiveFields) {
      if (optimized[field] !== undefined && optimized[field] !== null) {
        try {
          const encrypted = await encryption.encryptData(String(optimized[field]));
          optimized[`${field}_encrypted`] = encrypted;
          delete optimized[field];
        } catch (error) {
          console.error(`Failed to encrypt schema field ${field}:`, error);
          delete optimized[field];
        }
      }
    }
  }
  
  if (schema.compressibleFields) {
    for (const field of schema.compressibleFields) {
      if (optimized[field] && typeof optimized[field] === 'object') {
        try {
          const compressed = await compression.compressJson(optimized[field]);
          optimized[`${field}_compressed`] = compressed.toString('base64');
          optimized[`${field}_algorithm`] = compression.ALGORITHMS.BROTLI;
          delete optimized[field];
        } catch (error) {
          console.error(`Failed to compress schema field ${field}:`, error);
        }
      }
    }
  }
  
  return optimized;
}

/**
 * Restore database record
 * @param {Object} record - Optimized database record
 * @param {Object} schema - Table schema information
 * @returns {Promise<Object>} Restored record
 */
async function restoreDatabaseRecord(record, schema = {}) {
  const restored = { ...record };
  
  // Restore schema fields
  if (schema.sensitiveFields) {
    for (const field of schema.sensitiveFields) {
      const encryptedKey = `${field}_encrypted`;
      if (restored[encryptedKey]) {
        try {
          const decrypted = await encryption.decryptData(restored[encryptedKey]);
          restored[field] = decrypted.toString('utf8');
          delete restored[encryptedKey];
        } catch (error) {
          console.error(`Failed to decrypt schema field ${field}:`, error);
          restored[field] = null;
        }
      }
    }
  }
  
  if (schema.compressibleFields) {
    for (const field of schema.compressibleFields) {
      const compressedKey = `${field}_compressed`;
      const algorithmKey = `${field}_algorithm`;
      
      if (restored[compressedKey]) {
        try {
          const compressedBuffer = Buffer.from(restored[compressedKey], 'base64');
          const decompressed = await compression.decompressJson(compressedBuffer);
          restored[field] = decompressed;
          
          delete restored[compressedKey];
          if (restored[algorithmKey]) delete restored[algorithmKey];
        } catch (error) {
          console.error(`Failed to decompress schema field ${field}:`, error);
          restored[field] = null;
        }
      }
    }
  }
  
  return restored;
}

/**
 * Create database schema definitions with optimization hints
 * @returns {Object} Schema definitions
 */
function getDatabaseSchemas() {
  return {
    users: {
      sensitiveFields: ['password_hash', 'email', 'last_ip'],
      compressibleFields: [],
    },
    websites: {
      sensitiveFields: ['api_key'],
      compressibleFields: ['settings', 'ai_analysis_result'],
    },
    events: {
      sensitiveFields: [],
      compressibleFields: ['event_data', 'details'],
    },
    security_events: {
      sensitiveFields: ['user_ip', 'user_agent'],
      compressibleFields: ['payload', 'details', 'investigation_notes', 'resolution_notes'],
    },
    form_submissions: {
      sensitiveFields: ['email', 'phone', 'name'],
      compressibleFields: ['data', 'message'],
    },
    ip_intel_cache: {
      sensitiveFields: [],
      compressibleFields: ['details'],
    },
    ai_decisions: {
      sensitiveFields: [],
      compressibleFields: ['reasoning', 'action_result'],
    },
    audit_logs: {
      sensitiveFields: ['ip_address'],
      compressibleFields: ['details'],
    },
    // Default schema for unknown tables
    default: {
      sensitiveFields: [],
      compressibleFields: ['data', 'details', 'settings', 'payload', 'content'],
    },
  };
}

module.exports = {
  processForStorage,
  restoreFromStorage,
  identifySensitiveFields,
  identifyCompressibleFields,
  calculateStorageStats,
  optimizeDatabaseRecord,
  restoreDatabaseRecord,
  getDatabaseSchemas,
  SENSITIVE_FIELD_PATTERNS,
  LARGE_DATA_FIELD_PATTERNS,
};