import { elasticClient } from '../config/elastic';
import logger from './pino.logger';

// Index names
export const ELASTIC_INDEXES = {
    PRODUCTS: 'products',
    OUTLETS: 'outlets',
    ORDERS: 'orders',
    BUSINESSES: 'businesses',
} as const;

// Common Elasticsearch utilities

/**
 * Create index with mapping if it doesn't exist
 */
export const createIndexIfNotExists = async (
    indexName: string,
    mappings: any,
    settings?: any
): Promise<void> => {
    try {
        const exists = await elasticClient.indices.exists({ index: indexName });

        if (!exists) {
            const indexConfig: any = {
                index: indexName,
                body: {
                    mappings,
                },
            };

            if (settings) {
                indexConfig.body.settings = settings;
            }

            await elasticClient.indices.create(indexConfig);
            logger.info(`✅ Created Elasticsearch index: ${indexName}`);
        } else {
            logger.info(`ℹ️ Index ${indexName} already exists`);
        }
    } catch (error) {
        logger.error(`❌ Failed to create index ${indexName}:`, error);
        throw error;
    }
};

/**
 * Delete index
 */
export const deleteIndex = async (indexName: string): Promise<void> => {
    try {
        await elasticClient.indices.delete({ index: indexName });
        logger.info(`✅ Deleted Elasticsearch index: ${indexName}`);
    } catch (error: any) {
        if (error?.meta?.statusCode === 404) {
            logger.info(`ℹ️ Index ${indexName} does not exist`);
        } else {
            logger.error(`❌ Failed to delete index ${indexName}:`, error);
            throw error;
        }
    }
};

/**
 * Index a document
 */
export const indexDocument = async (
    indexName: string,
    documentId: string,
    document: any
): Promise<void> => {
    try {
        await elasticClient.index({
            index: indexName,
            id: documentId,
            body: document,
        });
        logger.debug(`✅ Indexed document ${documentId} in ${indexName}`);
    } catch (error) {
        logger.error(`❌ Failed to index document ${documentId} in ${indexName}:`, error);
        throw error;
    }
};

/**
 * Update a document
 */
export const updateDocument = async (
    indexName: string,
    documentId: string,
    updates: any
): Promise<void> => {
    try {
        await elasticClient.update({
            index: indexName,
            id: documentId,
            body: {
                doc: updates,
            },
        });
        logger.debug(`✅ Updated document ${documentId} in ${indexName}`);
    } catch (error) {
        logger.error(`❌ Failed to update document ${documentId} in ${indexName}:`, error);
        throw error;
    }
};

/**
 * Delete a document
 */
export const deleteDocument = async (
    indexName: string,
    documentId: string
): Promise<void> => {
    try {
        await elasticClient.delete({
            index: indexName,
            id: documentId,
        });
        logger.debug(`✅ Deleted document ${documentId} from ${indexName}`);
    } catch (error: any) {
        if (error.meta?.statusCode === 404) {
            logger.debug(`ℹ️ Document ${documentId} not found in ${indexName}`);
        } else {
            logger.error(`❌ Failed to delete document ${documentId} from ${indexName}:`, error);
            throw error;
        }
    }
};

/**
 * Search documents with query
 */
export const searchDocuments = async (
    indexName: string,
    query: any,
    options: {
        from?: number;
        size?: number;
        sort?: any[];
        _source?: string[] | boolean;
    } = {}
): Promise<any> => {
    try {
        const searchParams: any = {
            index: indexName,
            body: {
                query,
            },
        };

        if (options.from !== undefined) searchParams.from = options.from;
        if (options.size !== undefined) searchParams.size = options.size;
        if (options.sort) searchParams.body.sort = options.sort;
        if (options._source !== undefined) searchParams._source = options._source;

        const response = await elasticClient.search(searchParams);
        return {
            hits: (response as any).hits.hits,
            total: (response as any).hits.total,
            took: (response as any).took,
            aggregations: (response as any).aggregations,
        };
    } catch (error) {
        logger.error(`❌ Search failed in ${indexName}:`, error);
        throw error;
    }
};

/**
 * Get document by ID
 */
export const getDocument = async (
    indexName: string,
    documentId: string,
    _source?: string[] | boolean
): Promise<any> => {
    try {
        const params: any = {
            index: indexName,
            id: documentId,
        };

        if (_source !== undefined) params._source = _source;

        const response = await elasticClient.get(params);
        return (response as any)._source ? response : null;
    } catch (error: any) {
        if (error?.meta?.statusCode === 404) {
            return null;
        }
        logger.error(`❌ Failed to get document ${documentId} from ${indexName}:`, error);
        throw error;
    }
};

/**
 * Bulk index documents
 */
export const bulkIndex = async (
    indexName: string,
    documents: Array<{ id: string; data: any }>
): Promise<void> => {
    try {
        const body = documents.flatMap(doc => [
            { index: { _index: indexName, _id: doc.id } },
            doc.data,
        ]);

        const response = await elasticClient.bulk({ body });

        if ((response as any).errors) {
            const failedItems = (response as any).items.filter((item: any) => item.index?.error);
            logger.warn(`⚠️ ${failedItems.length} documents failed to index in ${indexName}`);
        } else {
            logger.info(`✅ Successfully indexed ${documents.length} documents in ${indexName}`);
        }
    } catch (error) {
        logger.error(`❌ Bulk index failed for ${indexName}:`, error);
        throw error;
    }
};

/**
 * Refresh index
 */
export const refreshIndex = async (indexName: string): Promise<void> => {
    try {
        await elasticClient.indices.refresh({ index: indexName });
        logger.debug(`✅ Refreshed index ${indexName}`);
    } catch (error) {
        logger.error(`❌ Failed to refresh index ${indexName}:`, error);
        throw error;
    }
};

/**
 * Create alias for index
 */
export const createAlias = async (
    indexName: string,
    aliasName: string
): Promise<void> => {
    try {
        await elasticClient.indices.putAlias({
            index: indexName,
            name: aliasName,
        });
        logger.info(`✅ Created alias ${aliasName} for index ${indexName}`);
    } catch (error) {
        logger.error(`❌ Failed to create alias ${aliasName}:`, error);
        throw error;
    }
};

/**
 * Reindex data from one index to another
 * Note: This function needs proper type definitions
 */
export const reindex = async (
    sourceIndex: string,
    targetIndex: string
): Promise<void> => {
    try {
        // Temporarily disabled due to TypeScript issues
        // Will implement with proper types later
        logger.warn(`⚠️ Reindex from ${sourceIndex} to ${targetIndex} is temporarily disabled`);
    } catch (error) {
        logger.error(`❌ Reindex failed from ${sourceIndex} to ${targetIndex}:`, error);
        throw error;
    }
};
