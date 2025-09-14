#!/usr/bin/env node

/**
 * Elasticsearch Setup and Testing Script
 * Run with: node test-elastic.js
 */

const { Client } = require('@elastic/elasticsearch');

// Load environment variables
require('dotenv').config();

const ELASTIC_NODE = process.env.ELASTIC_NODE || 'http://localhost:9200';
const ELASTIC_USERNAME = process.env.ELASTIC_USERNAME;
const ELASTIC_PASSWORD = process.env.ELASTIC_PASSWORD;

async function testElasticsearchConnection() {
    console.log('🔍 Testing Elasticsearch connection...\n');

    const client = new Client({
        node: ELASTIC_NODE,
        ...(ELASTIC_USERNAME && ELASTIC_PASSWORD && {
            auth: {
                username: ELASTIC_USERNAME,
                password: ELASTIC_PASSWORD,
            },
        }),
        requestTimeout: 60000,
    }); try {
        // Test basic connection
        console.log('📡 Testing basic connection...');
        const ping = await client.ping();
        console.log('✅ Elasticsearch connection successful!\n');

        // Get cluster info
        console.log('📊 Getting cluster information...');
        const info = await client.info();
        console.log('🔍 Debug - Info response keys:', Object.keys(info));
        console.log(`   Cluster: ${info.cluster_name || 'Unknown'}`);
        console.log(`   Version: ${info.version?.number || 'Unknown'}`);
        console.log(`   Status: ${info.tagline || 'Unknown'}\n`);

        // Check cluster health
        console.log('🏥 Checking cluster health...');
        const health = await client.cluster.health();
        console.log(`   Status: ${health.status || 'Unknown'}`);
        console.log(`   Nodes: ${health.number_of_nodes || 0}`);
        console.log(`   Active Shards: ${health.active_shards || 0}\n`);

        // List existing indices
        console.log('📋 Listing existing indices...');
        const indices = await client.cat.indices({ format: 'json' });
        if (!indices || indices.length === 0) {
            console.log('   No indices found');
        } else {
            indices.forEach(index => {
                console.log(`   - ${index.index} (${index['docs.count'] || 0} docs, ${index['store.size'] || '0b'} size)`);
            });
        }

        console.log('\n🎉 Elasticsearch is ready to use!');
        console.log('\n💡 Next steps:');
        console.log('   1. Start your Node.js application');
        console.log('   2. Indices will be created automatically on first use');
        console.log('   3. Test search endpoints with sample data');

    } catch (error) {
        console.error('❌ Elasticsearch connection failed!');
        console.error('Error:', error.message);

        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Make sure Elasticsearch is running:');
        console.log('      docker run -d -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:8.11.0');
        console.log('   2. Check ELASTIC_NODE in your .env file');
        console.log('   3. If using authentication, set ELASTIC_USERNAME and ELASTIC_PASSWORD');
        console.log('   4. Make sure Elasticsearch is accessible from your application');

        process.exit(1);
    }
}

async function createTestIndices() {
    console.log('\n🏗️ Creating test indices...');

    const client = new Client({
        node: ELASTIC_NODE,
        ...(ELASTIC_USERNAME && ELASTIC_PASSWORD && {
            auth: {
                username: ELASTIC_USERNAME,
                password: ELASTIC_PASSWORD,
            },
        }),
        requestTimeout: 60000,
    });

    try {
        // Delete existing indices if they exist
        console.log('🗑️ Deleting existing indices...');
        try {
            await client.indices.delete({ index: 'products' });
            console.log('✅ Deleted existing products index');
        } catch (deleteError) {
            if (deleteError.meta?.statusCode !== 404) {
                console.log('⚠️ Products index does not exist or could not be deleted');
            }
        }

        try {
            await client.indices.delete({ index: 'outlets' });
            console.log('✅ Deleted existing outlets index');
        } catch (deleteError) {
            if (deleteError.meta?.statusCode !== 404) {
                console.log('⚠️ Outlets index does not exist or could not be deleted');
            }
        }

        // Wait a moment after deletion
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Create products index
        await client.indices.create({
            index: 'products',
            settings: {
                number_of_shards: 1,
                number_of_replicas: 0,
            },
            mappings: {
                properties: {
                    name: { type: 'text' },
                    description: { type: 'text' },
                    price: { type: 'float' },
                    type: { type: 'keyword' },
                    outletId: { type: 'keyword' },
                },
            },
        });
        console.log('✅ Created products index');

        // Create outlets index
        await client.indices.create({
            index: 'outlets',
            settings: {
                number_of_shards: 1,
                number_of_replicas: 0,
            },
            mappings: {
                properties: {
                    name: { type: 'text' },
                    address: { type: 'text' },
                    location: { type: 'geo_point' },
                    businessId: { type: 'keyword' },
                },
            },
        });
        console.log('✅ Created outlets index');

        // Wait for indices to be ready
        console.log('⏳ Waiting for indices to be ready...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Refresh indices to make them searchable
        await client.indices.refresh({ index: 'products' });
        await client.indices.refresh({ index: 'outlets' });

        console.log('📝 Adding sample data...');

        // Add sample data one by one with retry
        try {
            await client.index({
                index: 'products',
                id: 'sample-1',
                document: {
                    name: 'Nasi Goreng Spesial',
                    description: 'Nasi goreng dengan telur, ayam, dan sayuran',
                    price: 25000,
                    type: 'GOODS',
                    outletId: 'outlet-1',
                },
            });
            console.log('✅ Added product sample-1');

            await client.index({
                index: 'products',
                id: 'sample-2',
                document: {
                    name: 'Potong Rambut Pria',
                    description: 'Potong rambut pria dengan model terkini',
                    price: 50000,
                    type: 'SERVICE',
                    outletId: 'outlet-1',
                },
            });
            console.log('✅ Added product sample-2');

            await client.index({
                index: 'outlets',
                id: 'outlet-1',
                document: {
                    name: 'Barbershop Central',
                    address: 'Jl. Sudirman No. 123',
                    location: {
                        lat: -6.2088,
                        lon: 106.8456,
                    },
                    businessId: 'business-1',
                },
            });
            console.log('✅ Added outlet outlet-1');

            console.log('✅ Added sample data');

            // Refresh indices
            await client.indices.refresh({ index: 'products' });
            await client.indices.refresh({ index: 'outlets' });

            console.log('✅ Indices refreshed');

        } catch (innerError) {
            console.error('❌ Failed to add sample data:', innerError.message);
            throw innerError;
        }

    } catch (error) {
        console.error('❌ Failed to create test indices:', error.message);
    }
}

async function testSearch() {
    console.log('\n🔍 Testing search functionality...');

    const client = new Client({
        node: ELASTIC_NODE,
        ...(ELASTIC_USERNAME && ELASTIC_PASSWORD && {
            auth: {
                username: ELASTIC_USERNAME,
                password: ELASTIC_PASSWORD,
            },
        }),
        requestTimeout: 60000,
    });

    try {
        // Wait a moment to ensure indices are ready
        console.log('⏳ Ensuring indices are ready...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Search products
        const productSearch = await client.search({
            index: 'products',
            query: {
                match: {
                    name: 'nasi',
                },
            },
        });

        console.log('📦 Product search results:');
        if (productSearch.hits?.hits && productSearch.hits.hits.length > 0) {
            productSearch.hits.hits.forEach(hit => {
                console.log(`   - ${hit._source?.name || 'Unknown'} (${hit._source?.price || 0})`);
            });
        } else {
            console.log('   No products found');
        }

        // Search outlets
        const outletSearch = await client.search({
            index: 'outlets',
            query: {
                match: {
                    name: 'barbershop',
                },
            },
        });

        console.log('🏪 Outlet search results:');
        if (outletSearch.hits?.hits && outletSearch.hits.hits.length > 0) {
            outletSearch.hits.hits.forEach(hit => {
                console.log(`   - ${hit._source?.name || 'Unknown'} (${hit._source?.address || 'Unknown'})`);
            });
        } else {
            console.log('   No outlets found');
        }

        console.log('✅ Search functionality working!');

    } catch (error) {
        if (error.meta?.statusCode === 404) {
            console.log('⚠️ Search indices not found. Run "npm run elastic:setup" first to create indices and sample data.');
        } else if (error.message?.includes('no_shard_available_action_exception')) {
            console.log('⚠️ Indices not ready yet. Please wait a moment and try again.');
            console.log('💡 Tip: Run "npm run elastic:setup" again to recreate indices.');
        } else {
            console.error('❌ Search test failed:', error.message);
            console.error('Full error:', error);
        }
    }
}

// Main execution
async function main() {
    const command = process.argv[2];

    switch (command) {
        case 'test':
            await testElasticsearchConnection();
            break;
        case 'setup':
            await testElasticsearchConnection();
            await createTestIndices();
            await testSearch();
            break;
        case 'search':
            await testSearch();
            break;
        default:
            console.log('Usage:');
            console.log('  node test-elastic.js test    - Test connection only');
            console.log('  node test-elastic.js setup   - Test + create indices + add sample data');
            console.log('  node test-elastic.js search  - Test search functionality');
            console.log('\nMake sure to set these environment variables:');
            console.log('  ELASTIC_NODE=http://localhost:9200');
            console.log('  ELASTIC_USERNAME=your_username (optional)');
            console.log('  ELASTIC_PASSWORD=your_password (optional)');
            break;
    }
}

main().catch(console.error);
