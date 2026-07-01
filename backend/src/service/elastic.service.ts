import { elasticClient, testElasticConnection, getElasticInfo, esClient } from '../config/elastic';
import {
    bulkIndex,
    createIndexIfNotExists,
    ELASTIC_INDEXES,
    refreshIndex,
    indexDocument,
    deleteDocument,
    searchDocuments
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
const getTypeKeywords = (type: string): string => {
    switch (type) {
        case 'FNB':
            return 'makanan fnb resto kuliner restoran kafe cafe makan minum kulineran warung makan caffe food beverage culinary';
        case 'RETAIL':
            return 'toko ritel sejenisnya shop retail warung minimarket supermarket kelontong outlet retail butik boutique mart dagang jualan';
        case 'EVENT':
            return 'event acara tiket konser pameran seminar festival show pertunjukan gathering bazaar pasar malam';
        case 'SERVICE':
            return 'service layanan jasa salon bengkel spa barbershop cuci laundry klinik konsultasi rental sewa repair servis';
        case 'CUSTOM':
            return 'custom lainnya lain umum serbaguna';
        default:
            return '';
    }
};

/**
 * Reindex all data from database to Elasticsearch
 * This should be called after cleanup or for initial data sync
 */
export const reindexAllData = async (): Promise<void> => {
    try {
        logger.info('🔄 Starting full reindex...');

        // Reindex products
        logger.info('📦 Reindexing products...');
        const products = await db.product.findMany({
            include: {
                goods: true,
                service: true,
                category: true,
                outlet: {
                    include: {
                        business: true
                    }
                }
            }
        });

        if (products.length > 0) {
            const productDocs = products.map((product: any) => ({
                id: product.id,
                data: {
                    id: product.id,
                    name: product.name,
                    description: product.description || '',
                    price: product.goods?.sellingPrice || product.service?.sellingPrice || 0,
                    originalPrice: product.goods?.sellingPrice || product.service?.sellingPrice || 0,
                    type: product.type,
                    category: product.category?.name || '',
                    stock: product.goods?.currentStock || 0,
                    isActive: product.status === 'ACTIVE',
                    outletId: product.outletId,
                    outletName: product.outlet?.name || '',
                    businessId: product.outlet?.businessId || '',
                    businessName: product.outlet?.business?.name || '',
                    tags: [],
                    imageUrl: product.image || '',
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt,
                }
            }));
            await bulkIndex(ELASTIC_INDEXES.PRODUCTS, productDocs);
        }

        // Reindex outlets
        logger.info('🏪 Reindexing outlets...');
        const outlets = await db.outlet.findMany({
            include: {
                business: true,
                operatingHours: true,
            }
        });

        if (outlets.length > 0) {
            const outletDocs = outlets.map((outlet: any) => {
                const doc: any = {
                    id: outlet.id,
                    name: outlet.name,
                    description: outlet.description || '',
                    address: outlet.address || '',
                    latitude: outlet.latitude,
                    longitude: outlet.longitude,
                    businessId: outlet.businessId,
                    businessName: outlet.business?.name || '',
                    isActive: outlet.isOpen,
                    type: outlet.type,
                    typeKeywords: getTypeKeywords(outlet.type),
                    createdAt: outlet.createdAt,
                    updatedAt: outlet.updatedAt,
                };

                if (outlet.latitude !== null && outlet.longitude !== null) {
                    doc.location = {
                        lat: outlet.latitude,
                        lon: outlet.longitude,
                    };
                }

                if (outlet.operatingHours && outlet.operatingHours.length > 0) {
                    doc.operatingHours = outlet.operatingHours.map((oh: any) => ({
                        day: oh.dayOfWeek?.toString(),
                        openTime: oh.openTime,
                        closeTime: oh.closeTime,
                        isOpen: oh.isOpen,
                    }));
                }

                return {
                    id: outlet.id,
                    data: doc
                };
            });

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

import { db } from '../config/prisma';

export const syncProductToElastic = async (productId: string): Promise<void> => {
    try {
        const product = await db.product.findUnique({
            where: { id: productId },
            include: {
                goods: true,
                service: true,
                category: true,
                outlet: {
                    include: {
                        business: true
                    }
                }
            }
        });

        if (!product) return;

        const doc = {
            id: product.id,
            name: product.name,
            description: product.description || '',
            price: product.goods?.sellingPrice || product.service?.sellingPrice || 0,
            originalPrice: product.goods?.sellingPrice || product.service?.sellingPrice || 0,
            type: product.type,
            category: product.category?.name || '',
            stock: product.goods?.currentStock || 0,
            isActive: product.status === 'ACTIVE',
            outletId: product.outletId,
            outletName: product.outlet?.name || '',
            businessId: product.outlet?.businessId || '',
            businessName: product.outlet?.business?.name || '',
            tags: [],
            imageUrl: product.image || '',
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        };

        await indexDocument(ELASTIC_INDEXES.PRODUCTS, product.id, doc);
    } catch (error) {
        logger.error(`Failed to sync product ${productId} to Elasticsearch:`, error);
    }
};

export const deleteProductFromElastic = async (productId: string): Promise<void> => {
    try {
        await deleteDocument(ELASTIC_INDEXES.PRODUCTS, productId);
    } catch (error) {
        logger.error(`Failed to delete product ${productId} from Elasticsearch:`, error);
    }
};

export const syncOutletToElastic = async (outletId: string): Promise<void> => {
    try {
        const outlet = await db.outlet.findUnique({
            where: { id: outletId },
            include: {
                business: true,
                operatingHours: true,
            }
        });

        if (!outlet) return;

        const doc: any = {
            id: outlet.id,
            name: outlet.name,
            description: outlet.description || '',
            address: outlet.address || '',
            latitude: outlet.latitude,
            longitude: outlet.longitude,
            businessId: outlet.businessId,
            businessName: outlet.business?.name || '',
            isActive: outlet.isOpen,
            type: outlet.type,
            typeKeywords: getTypeKeywords(outlet.type),
            createdAt: outlet.createdAt,
            updatedAt: outlet.updatedAt,
        };

        if (outlet.latitude !== null && outlet.longitude !== null) {
            doc.location = {
                lat: outlet.latitude,
                lon: outlet.longitude,
            };
        }

        if (outlet.operatingHours && outlet.operatingHours.length > 0) {
            doc.operatingHours = outlet.operatingHours.map((oh: any) => ({
                day: oh.dayOfWeek?.toString(),
                openTime: oh.openTime,
                closeTime: oh.closeTime,
                isOpen: oh.isOpen,
            }));
        }

        await indexDocument(ELASTIC_INDEXES.OUTLETS, outlet.id, doc);
    } catch (error) {
        logger.error(`Failed to sync outlet ${outletId} to Elasticsearch:`, error);
    }
};

export const deleteOutletFromElastic = async (outletId: string): Promise<void> => {
    try {
        await deleteDocument(ELASTIC_INDEXES.OUTLETS, outletId);
    } catch (error) {
        logger.error(`Failed to delete outlet ${outletId} from Elasticsearch:`, error);
    }
};

export const searchProductsInElastic = async (
    name: string,
    outletId?: string
): Promise<string[]> => {
    try {
        const must: any[] = [
            {
                multi_match: {
                    query: name,
                    fields: ['name^3', 'name.autocomplete^2', 'description'],
                    fuzziness: 'AUTO',
                }
            }
        ];

        const filter: any[] = [
            { term: { isActive: true } }
        ];

        if (outletId) {
            filter.push({ term: { outletId } });
        }

        const query = {
            bool: { must, filter }
        };

        const result = await searchDocuments(ELASTIC_INDEXES.PRODUCTS, query, {
            size: 100,
            _source: false
        });

        return result.hits.map((hit: any) => hit._id);
    } catch (error) {
        logger.error(`Elasticsearch product search failed:`, error);
        return [];
    }
};

export const searchOutletsInElastic = async (
    name: string,
    take: number = 10,
    skip: number = 0
): Promise<{ ids: string[]; total: number }> => {
    try {
        const query = {
            bool: {
                must: [
                    {
                        multi_match: {
                            query: name,
                            fields: ['name^3', 'address', 'typeKeywords^2'],
                            fuzziness: 'AUTO',
                        }
                    }
                ]
            }
        };

        const result = await searchDocuments(ELASTIC_INDEXES.OUTLETS, query, {
            from: skip,
            size: take,
            _source: false
        });

        const ids = result.hits.map((hit: any) => hit._id);
        const total = typeof result.total === 'number' ? result.total : result.total?.value || 0;

        return { ids, total };
    } catch (error) {
        logger.error(`Elasticsearch outlet search failed:`, error);
        return { ids: [], total: 0 };
    }
};

export class ElasticService {
    async indexOutlet(outlet: Outlet) {
        await syncOutletToElastic(outlet.id);
    }
}