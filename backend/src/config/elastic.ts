import { Client } from '@elastic/elasticsearch';
import logger from '../utils/logger';

const ELASTIC_NODE = process.env.ELASTIC_NODE || 'http://localhost:9200';
const ELASTIC_USERNAME = process.env.ELASTIC_USERNAME;
const ELASTIC_PASSWORD = process.env.ELASTIC_PASSWORD;

// Elasticsearch client configuration
const elasticConfig = {
    node: ELASTIC_NODE,
    ...(ELASTIC_USERNAME && ELASTIC_PASSWORD && {
        auth: {
            username: ELASTIC_USERNAME,
            password: ELASTIC_PASSWORD,
        },
    }),
    // Connection settings
    requestTimeout: 60000,
    pingTimeout: 3000,
    maxRetries: 5,
    sniffOnStart: true,
    sniffOnConnectionFault: true,
    // SSL settings (if needed)
    tls: {
        rejectUnauthorized: false, // Set to true in production with proper certificates
    },
};

// Create Elasticsearch client
export const elasticClient = new Client(elasticConfig);

// Test connection function
export const testElasticConnection = async (): Promise<boolean> => {
    try {
        const response = await elasticClient.ping();
        logger.info('✅ Elasticsearch connection successful');
        return response;
    } catch (error) {
        logger.error('❌ Elasticsearch connection failed:', error);
        return false;
    }
};

// Get cluster info
export const getElasticInfo = async () => {
    try {
        const info = await elasticClient.info() as any;
        return {
            cluster_name: info.body.cluster_name,
            version: info.body.version,
            status: 'connected',
        };
    } catch (error) {
        logger.error('Failed to get Elasticsearch info:', error);
        return {
            status: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};

// Health check function
export const checkElasticHealth = async () => {
    try {
        const health = await elasticClient.cluster.health() as any;
        return {
            status: health.body.status,
            number_of_nodes: health.body.number_of_nodes,
            active_shards: health.body.active_shards,
            relocating_shards: health.body.relocating_shards,
            initializing_shards: health.body.initializing_shards,
            unassigned_shards: health.body.unassigned_shards,
        };
    } catch (error) {
        logger.error('Failed to check Elasticsearch health:', error);
        throw error;
    }
};

export default elasticClient;
