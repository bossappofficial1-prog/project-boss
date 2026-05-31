import { elasticClient, testElasticConnection, getElasticInfo, esClient } from '../config/elastic';
import {
    bulkIndex,
    createIndexIfNotExists,
    ELASTIC_INDEXES,
    refreshIndex
} from '../utils/elastic.utils';
import {
    PRODUCT_INDEX_MAPPING,
    OUTLET_INDEX_MAPPING,
    ORDER_INDEX_MAPPING,
    BUSINESS_INDEX_MAPPING
} from '../config/elastic-mappings';
import logger from '../utils/pino.logger';
import { getAllOutletsService } from './outlet.service';
import { Outlet } from '@prisma/client';

/**
 * Initialize Elasticsearch connection and create required indices
 */
export const initializeElasticsearch = async (): Promise<void> => {
    try {
        logger.info('🚀 Initializing Elasticsearch...');

        // Test connection
        const isConnected = await testElasticConnection();
        if (!isConnected) {
            logger.error('❌ Failed to connect to Elasticsearch');
            return;
        }

        // Get cluster info
        const info = await getElasticInfo();
        logger.info(`📊 Connected to Elasticsearch cluster: ${info.cluster_name} (${info.version})`);

        // Create indices with mappings
        await Promise.all([
            createIndexIfNotExists(
                ELASTIC_INDEXES.PRODUCTS,
                PRODUCT_INDEX_MAPPING.mappings,
                PRODUCT_INDEX_MAPPING.settings
            ),
            createIndexIfNotExists(
                ELASTIC_INDEXES.OUTLETS,
                OUTLET_INDEX_MAPPING.mappings,
                OUTLET_INDEX_MAPPING.settings
            ),
            createIndexIfNotExists(
                ELASTIC_INDEXES.ORDERS,
                ORDER_INDEX_MAPPING.mappings,
                ORDER_INDEX_MAPPING.settings
            ),
            createIndexIfNotExists(
                ELASTIC_INDEXES.BUSINESSES,
                BUSINESS_INDEX_MAPPING.mappings,
                BUSINESS_INDEX_MAPPING.settings
            ),
        ]);

        logger.info('✅ Elasticsearch initialization completed successfully');
    } catch (error) {
        logger.error('❌ Failed to initialize Elasticsearch:', error);
        // Don't throw error to prevent app from crashing
        // Elasticsearch is optional for basic functionality
    }
};

/**
 * Health check for Elasticsearch
 */
export const checkElasticsearchHealth = async (): Promise<{
    status: string;
    indices: string[];
    cluster_health?: any;
}> => {
    try {
        // Check cluster health
        const healthResponse = await elasticClient.cluster.health();
        const health = healthResponse as any;

        // Get list of indices
        const indicesResponse = await elasticClient.cat.indices({ format: 'json' });
        const indices = (indicesResponse as any).map((index: any) => index.index);

        return {
            status: 'healthy',
            indices,
            cluster_health: {
                status: health.status,
                number_of_nodes: health.number_of_nodes,
                active_shards: health.active_shards,
            },
        };
    } catch (error) {
        logger.error('❌ Elasticsearch health check failed:', error);
        return {
            status: 'unhealthy',
            indices: [],
        };
    }
};

/**
 * Clean up all indices (for development/testing)
 */
export const cleanupElasticsearchIndices = async (): Promise<void> => {
    try {
        logger.info('🧹 Cleaning up Elasticsearch indices...');

        const indices = Object.values(ELASTIC_INDEXES);

        for (const index of indices) {
            try {
                await elasticClient.indices.delete({ index });
                logger.info(`✅ Deleted index: ${index}`);
            } catch (error: any) {
                if (error?.meta?.statusCode === 404) {
                    logger.info(`ℹ️ Index ${index} does not exist`);
                } else {
                    logger.error(`❌ Failed to delete index ${index}:`, error);
                }
            }
        }

        logger.info('✅ Elasticsearch cleanup completed');
    } catch (error) {
        logger.error('❌ Failed to cleanup Elasticsearch:', error);
        throw error;
    }
};

/**
 * Reindex all data from database to Elasticsearch
 * This should be called after cleanup or for initial data sync
 */
export const reindexAllData = async (): Promise<void> => {
    try {
        logger.info('🔄 Starting full reindex...');

        // Import services dynamically to avoid circular dependencies
        // Note: getAllOrdersService doesn't exist, we'll implement it later if needed

        // Reindex products
        logger.info('📦 Reindexing products...');
        // TODO: Implement getAllProductsService or use existing services
        logger.info('⚠️ Product reindexing skipped - implement getAllProductsService first');

        // Reindex outlets
        logger.info('🏪 Reindexing outlets...');
        const outletsResult = await getAllOutletsService();
        if (outletsResult && outletsResult.outlets && outletsResult.outlets.length > 0) {
            const outletDocs = outletsResult.outlets.map((outlet: any) => ({
                id: outlet.id,
                data: {
                    id: outlet.id,
                    name: outlet.name,
                    description: outlet.description,
                    address: outlet.address,
                    location: {
                        lat: outlet.latitude,
                        lon: outlet.longitude,
                    },
                    latitude: outlet.latitude,
                    longitude: outlet.longitude,
                    businessId: outlet.businessId,
                    businessName: outlet.business?.name,
                    isActive: outlet.isActive,
                    createdAt: outlet.createdAt,
                    updatedAt: outlet.updatedAt,
                }
            }));

            await bulkIndex(ELASTIC_INDEXES.OUTLETS, outletDocs);
        }

        // Refresh indices
        await refreshIndex(ELASTIC_INDEXES.PRODUCTS);
        await refreshIndex(ELASTIC_INDEXES.OUTLETS);

        logger.info('✅ Full reindex completed');
    } catch (error) {
        logger.error('❌ Failed to reindex data:', error);
        throw error;
    }
};

export class ElasticService {
    async indexOutlet(outlet: Outlet) {
        await esClient.index({
            index: `outlets`,
            id: outlet.id.toString(),
            document: outlet
        })
    }
}