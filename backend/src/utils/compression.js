// ============================================
// Drishti Kavach — Data Compression Utility
// Compresses JSON data before storage to save space
// ============================================

const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);
const deflate = promisify(zlib.deflate);
const inflate = promisify(zlib.inflate);

// Compression algorithms with priority (better compression = higher priority)
const ALGORITHMS = {
  BROTLI: 'brotli',     // Best compression, slower
  GZIP: 'gzip',         // Good compression, balanced
  DEFLATE: 'deflate',   // Faster, less compression
};

// Default compression level (1-11 for brotli, 1-9 for gzip/deflate)
const DEFAULT_COMPRESSION_LEVEL = {
  [ALGORITHMS.BROTLI]: 6,
  [ALGORITHMS.GZIP]: 6,
  [ALGORITHMS.DEFLATE]: 6,
};

// Minimum size for compression (bytes)
const MIN_COMPRESSION_SIZE = 100;

// Maximum size for compression (bytes) - 10MB
const MAX_COMPRESSION_SIZE = 10 * 1024 * 1024;

/**
 * Check if data should be compressed based on size
 * @param {Buffer|string} data - Data to check
 * @returns {boolean} Whether to compress
 */
function shouldCompress(data) {
  const size = Buffer.byteLength(data);
  return size >= MIN_COMPRESSION_SIZE && size <= MAX_COMPRESSION_SIZE;
}

/**
 * Compress data using specified algorithm
 * @param {Buffer|string} data - Data to compress
 * @param {string} algorithm - Compression algorithm (brotli, gzip, deflate)
 * @param {Object} options - Compression options
 * @returns {Promise<Buffer>} Compressed data
 */
async function compressData(data, algorithm = ALGORITHMS.BROTLI, options = {}) {
  try {
    const input = typeof data === 'string' ? Buffer.from(data) : data;
    
    // Check if compression is needed
    if (!shouldCompress(input)) {
      return input;
    }
    
    const compressOptions = {
      level: options.level || DEFAULT_COMPRESSION_LEVEL[algorithm],
      ...options,
    };
    
    let compressed;
    switch (algorithm) {
      case ALGORITHMS.BROTLI:
        compressed = await brotliCompress(input, compressOptions);
        break;
      case ALGORITHMS.GZIP:
        compressed = await gzip(input, compressOptions);
        break;
      case ALGORITHMS.DEFLATE:
        compressed = await deflate(input, compressOptions);
        break;
      default:
        throw new Error(`Unsupported compression algorithm: ${algorithm}`);
    }
    
    // Return compressed data with algorithm header
    const header = Buffer.from(algorithm.charAt(0)); // Single byte header
    return Buffer.concat([header, compressed]);
    
  } catch (error) {
    console.error('Compression error:', error);
    // Return original data if compression fails
    return typeof data === 'string' ? Buffer.from(data) : data;
  }
}

/**
 * Decompress data
 * @param {Buffer} compressedData - Compressed data with header
 * @returns {Promise<Buffer>} Decompressed data
 */
async function decompressData(compressedData) {
  try {
    // Check if data is compressed (has header)
    if (!Buffer.isBuffer(compressedData) || compressedData.length < 2) {
      return compressedData;
    }
    
    const header = compressedData[0];
    const data = compressedData.slice(1);
    
    let decompressed;
    switch (String.fromCharCode(header)) {
      case 'b': // brotli
        decompressed = await brotliDecompress(data);
        break;
      case 'g': // gzip
        decompressed = await gunzip(data);
        break;
      case 'd': // deflate
        decompressed = await inflate(data);
        break;
      default:
        // No compression header, return as-is
        return compressedData;
    }
    
    return decompressed;
  } catch (error) {
    console.error('Decompression error:', error);
    // Return original data if decompression fails
    return compressedData;
  }
}

/**
 * Compress JSON data with metadata
 * @param {Object} jsonData - JSON object to compress
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Buffer>} Compressed JSON with metadata
 */
async function compressJson(jsonData, metadata = {}) {
  try {
    const jsonString = JSON.stringify(jsonData);
    const dataToCompress = {
      data: jsonData,
      metadata: {
        ...metadata,
        originalSize: Buffer.byteLength(jsonString),
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    };
    
    const compressed = await compressData(JSON.stringify(dataToCompress));
    
    // Calculate compression ratio
    const compressedSize = compressed.length;
    const originalSize = Buffer.byteLength(jsonString);
    const ratio = originalSize > 0 ? (compressedSize / originalSize) * 100 : 0;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📦 Compression: ${originalSize} → ${compressedSize} bytes (${ratio.toFixed(1)}%)`);
    }
    
    return compressed;
  } catch (error) {
    console.error('JSON compression error:', error);
    // Fallback to uncompressed JSON
    return Buffer.from(JSON.stringify(jsonData));
  }
}

/**
 * Decompress JSON data
 * @param {Buffer} compressedData - Compressed JSON data
 * @returns {Promise<Object>} Decompressed JSON object
 */
async function decompressJson(compressedData) {
  try {
    const decompressed = await decompressData(compressedData);
    const jsonString = decompressed.toString('utf8');
    const parsed = JSON.parse(jsonString);
    
    // Check if it's our compressed format
    if (parsed.data && parsed.metadata) {
      return parsed.data;
    }
    
    // Return as-is if not our format
    return parsed;
  } catch (error) {
    console.error('JSON decompression error:', error);
    // Try to parse as regular JSON
    try {
      return JSON.parse(compressedData.toString('utf8'));
    } catch {
      throw new Error('Failed to decompress JSON data');
    }
  }
}

/**
 * Compress database fields in an object
 * @param {Object} dataObject - Object containing data to compress
 * @param {Array<string>} fields - Field names to compress
 * @returns {Promise<Object>} Object with compressed fields
 */
async function compressObjectFields(dataObject, fields = ['data', 'details', 'settings']) {
  const result = { ...dataObject };
  
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'object') {
      try {
        const compressed = await compressJson(result[field]);
        result[`${field}_compressed`] = compressed.toString('base64');
        result[`${field}_algorithm`] = ALGORITHMS.BROTLI;
        delete result[field]; // Remove uncompressed field
      } catch (error) {
        console.error(`Failed to compress field ${field}:`, error);
        // Keep original field if compression fails
      }
    }
  }
  
  return result;
}

/**
 * Decompress database fields in an object
 * @param {Object} dataObject - Object with compressed fields
 * @returns {Promise<Object>} Object with decompressed fields
 */
async function decompressObjectFields(dataObject) {
  const result = { ...dataObject };
  
  // Find compressed fields
  const compressedFields = Object.keys(result)
    .filter(key => key.endsWith('_compressed'))
    .map(key => key.replace('_compressed', ''));
  
  for (const field of compressedFields) {
    const compressedKey = `${field}_compressed`;
    const algorithmKey = `${field}_algorithm`;
    
    if (result[compressedKey]) {
      try {
        const compressedBuffer = Buffer.from(result[compressedKey], 'base64');
        const decompressed = await decompressJson(compressedBuffer);
        result[field] = decompressed;
        
        // Remove compressed metadata
        delete result[compressedKey];
        if (result[algorithmKey]) delete result[algorithmKey];
      } catch (error) {
        console.error(`Failed to decompress field ${field}:`, error);
        // Keep compressed data if decompression fails
      }
    }
  }
  
  return result;
}

/**
 * Estimate compression savings
 * @param {Object} data - Data to analyze
 * @returns {Object} Compression statistics
 */
async function analyzeCompression(data) {
  const jsonString = JSON.stringify(data);
  const originalSize = Buffer.byteLength(jsonString);
  
  const results = {};
  
  for (const algorithm of Object.values(ALGORITHMS)) {
    try {
      const compressed = await compressData(jsonString, algorithm);
      const compressedSize = compressed.length;
      const ratio = (compressedSize / originalSize) * 100;
      const savings = 100 - ratio;
      
      results[algorithm] = {
        originalSize,
        compressedSize,
        ratio: ratio.toFixed(2) + '%',
        savings: savings.toFixed(2) + '%',
        bytesSaved: originalSize - compressedSize,
      };
    } catch (error) {
      results[algorithm] = { error: error.message };
    }
  }
  
  return {
    originalSize,
    bestAlgorithm: Object.keys(results).reduce((best, algo) => {
      if (!results[best]?.compressedSize) return algo;
      if (!results[algo]?.compressedSize) return best;
      return results[algo].compressedSize < results[best].compressedSize ? algo : best;
    }),
    algorithms: results,
  };
}

module.exports = {
  ALGORITHMS,
  shouldCompress,
  compressData,
  decompressData,
  compressJson,
  decompressJson,
  compressObjectFields,
  decompressObjectFields,
  analyzeCompression,
  DEFAULT_COMPRESSION_LEVEL,
  MIN_COMPRESSION_SIZE,
  MAX_COMPRESSION_SIZE,
};