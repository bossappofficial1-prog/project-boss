// Elasticsearch index mappings and settings for different entities

export const PRODUCT_INDEX_MAPPING = {
    settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
        analysis: {
            analyzer: {
                indonesian_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'indonesian_stop', 'indonesian_stemmer']
                },
                edge_ngram_analyzer: {
                    type: 'custom',
                    tokenizer: 'edge_ngram_tokenizer',
                    filter: ['lowercase']
                }
            },
            tokenizer: {
                edge_ngram_tokenizer: {
                    type: 'edge_ngram',
                    min_gram: 1,
                    max_gram: 20,
                    token_chars: ['letter', 'digit']
                }
            },
            filter: {
                indonesian_stop: {
                    type: 'stop',
                    stopwords: '_indonesian_'
                },
                indonesian_stemmer: {
                    type: 'stemmer',
                    language: 'indonesian'
                }
            }
        }
    },
    mappings: {
        properties: {
            id: {
                type: 'keyword'
            },
            name: {
                type: 'text',
                analyzer: 'indonesian_analyzer',
                fields: {
                    keyword: {
                        type: 'keyword'
                    },
                    autocomplete: {
                        type: 'text',
                        analyzer: 'edge_ngram_analyzer',
                        search_analyzer: 'standard'
                    }
                }
            },
            description: {
                type: 'text',
                analyzer: 'indonesian_analyzer'
            },
            price: {
                type: 'float'
            },
            originalPrice: {
                type: 'float'
            },
            type: {
                type: 'keyword'
            },
            category: {
                type: 'keyword'
            },
            stock: {
                type: 'integer'
            },
            isActive: {
                type: 'boolean'
            },
            outletId: {
                type: 'keyword'
            },
            outletName: {
                type: 'text',
                analyzer: 'indonesian_analyzer'
            },
            businessId: {
                type: 'keyword'
            },
            businessName: {
                type: 'text',
                analyzer: 'indonesian_analyzer'
            },
            tags: {
                type: 'keyword'
            },
            imageUrl: {
                type: 'keyword',
                index: false
            },
            createdAt: {
                type: 'date'
            },
            updatedAt: {
                type: 'date'
            }
        }
    }
};

export const OUTLET_INDEX_MAPPING = {
    settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
        analysis: {
            analyzer: {
                indonesian_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'indonesian_stop', 'indonesian_stemmer']
                }
            },
            filter: {
                indonesian_stop: {
                    type: 'stop',
                    stopwords: '_indonesian_'
                },
                indonesian_stemmer: {
                    type: 'stemmer',
                    language: 'indonesian'
                }
            }
        }
    },
    mappings: {
        properties: {
            id: {
                type: 'keyword'
            },
            name: {
                type: 'text',
                analyzer: 'indonesian_analyzer',
                fields: {
                    keyword: {
                        type: 'keyword'
                    }
                }
            },
            description: {
                type: 'text',
                analyzer: 'indonesian_analyzer'
            },
            address: {
                type: 'text',
                analyzer: 'indonesian_analyzer'
            },
            location: {
                type: 'geo_point'
            },
            latitude: {
                type: 'float'
            },
            longitude: {
                type: 'float'
            },
            businessId: {
                type: 'keyword'
            },
            businessName: {
                type: 'text',
                analyzer: 'indonesian_analyzer'
            },
            isActive: {
                type: 'boolean'
            },
            operatingHours: {
                type: 'object',
                properties: {
                    day: { type: 'keyword' },
                    openTime: { type: 'keyword' },
                    closeTime: { type: 'keyword' },
                    isOpen: { type: 'boolean' }
                }
            },
            createdAt: {
                type: 'date'
            },
            updatedAt: {
                type: 'date'
            }
        }
    }
};

export const ORDER_INDEX_MAPPING = {
    settings: {
        number_of_shards: 1,
        number_of_replicas: 0
    },
    mappings: {
        properties: {
            id: {
                type: 'keyword'
            },
            orderCode: {
                type: 'keyword'
            },
            totalAmount: {
                type: 'float'
            },
            orderStatus: {
                type: 'keyword'
            },
            paymentStatus: {
                type: 'keyword'
            },
            outletId: {
                type: 'keyword'
            },
            outletName: {
                type: 'text'
            },
            businessId: {
                type: 'keyword'
            },
            customerPhone: {
                type: 'keyword',
                index: false // For privacy, don't index phone numbers
            },
            customerName: {
                type: 'text'
            },
            items: {
                type: 'nested',
                properties: {
                    productId: { type: 'keyword' },
                    productName: { type: 'text' },
                    quantity: { type: 'integer' },
                    price: { type: 'float' },
                    type: { type: 'keyword' }
                }
            },
            createdAt: {
                type: 'date'
            },
            updatedAt: {
                type: 'date'
            }
        }
    }
};

export const BUSINESS_INDEX_MAPPING = {
    settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
        analysis: {
            analyzer: {
                indonesian_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'indonesian_stop', 'indonesian_stemmer']
                }
            },
            filter: {
                indonesian_stop: {
                    type: 'stop',
                    stopwords: '_indonesian_'
                },
                indonesian_stemmer: {
                    type: 'stemmer',
                    language: 'indonesian'
                }
            }
        }
    },
    mappings: {
        properties: {
            id: {
                type: 'keyword'
            },
            name: {
                type: 'text',
                analyzer: 'indonesian_analyzer',
                fields: {
                    keyword: {
                        type: 'keyword'
                    }
                }
            },
            description: {
                type: 'text',
                analyzer: 'indonesian_analyzer'
            },
            category: {
                type: 'keyword'
            },
            ownerId: {
                type: 'keyword'
            },
            isActive: {
                type: 'boolean'
            },
            createdAt: {
                type: 'date'
            },
            updatedAt: {
                type: 'date'
            }
        }
    }
};
