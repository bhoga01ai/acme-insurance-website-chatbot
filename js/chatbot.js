// Chatbot with Gemini and FAISS vector search implementation
// Note: These libraries are loaded via script tags in the HTML

class ChatbotVectorSearch {
    constructor() {
        this.documents = [];
        this.embeddings = [];
        this.initialized = false;
        this.contentFilePath = '/website_content.txt';
        this.vectorStore = null;
        
        // We'll initialize the Gemini API in the initialize method
        this.genAI = null;
        this.embeddingModel = null;
        this.geminiModel = null;
    }

    // Initialize the chatbot by loading content from file
    async initialize() {
        if (this.initialized) return;
        
        console.log('Initializing chatbot and loading website content from file...');
        
        // Initialize the Gemini API
        // In a real implementation, you would fetch the API key from your server
        const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your actual API key
        
        // For demo purposes, we'll use a simple vector similarity approach
        // In a production environment, you would use the Gemini API
        
        await this.loadContentFromFile();
        await this.createSimpleEmbeddings();
        this.initialized = true;
        console.log('Chatbot initialized with', this.documents.length, 'documents');
    }

    // Load content from the website_content.txt file
    async loadContentFromFile() {
        try {
            console.log('Loading content from file:', this.contentFilePath);
            // Update the path to ensure it's correctly pointing to the file
            const response = await fetch(this.contentFilePath);
            
            if (!response.ok) {
                throw new Error(`Failed to load content file: ${response.status} ${response.statusText}`);
            }
            
            const content = await response.text();
            console.log('Content loaded successfully, first 100 chars:', content.substring(0, 100));
            
            if (!content || content.trim().length === 0) {
                console.error('Content file is empty');
                this.documents = [];
                return;
            }
            
            this.parseContentFile(content);
            
        } catch (error) {
            console.error('Error loading content from file:', error);
            // Try with a fallback path if the original path failed
            if (!this.contentFilePath.startsWith('/')) {
                console.log('Attempting with alternate path...');
                try {
                    const altPath = '/' + this.contentFilePath;
                    const altResponse = await fetch(altPath);
                    
                    if (altResponse.ok) {
                        const altContent = await altResponse.text();
                        console.log('Content loaded from alternate path, length:', altContent.length);
                        this.parseContentFile(altContent);
                        return;
                    }
                } catch (altError) {
                    console.error('Error with alternate path:', altError);
                }
            }
            // Fallback to empty documents array
            this.documents = [];
        }
    }
    
    // Parse the content file and extract documents with improved structure recognition
    parseContentFile(content) {
        // Split content by lines
        const lines = content.split('\n').filter(line => line.trim());
        
        let currentSection = 'unknown';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines
            if (!line) continue;
            
            // Check if this is a section header
            if (line.startsWith('=== SECTION:') || line.startsWith('=== FOOTER')) {
                currentSection = line.replace('=== SECTION:', '').replace('=== FOOTER', 'footer').replace('===', '').trim();
                console.log(`Processing section: ${currentSection}`);
                continue;
            }
            
            // Check if this is a heading
            if (line.startsWith('#')) {
                const headingLevel = line.match(/^#+/)[0].length;
                const headingText = line.replace(/^#+\s*/, '').trim();
                
                if (headingText) {
                    // Determine if this is a service heading
                    let type = headingLevel === 1 ? 'heading' : 'subheading';
                    if (currentSection.toLowerCase().includes('service') && 
                        (headingText.includes('Insurance') || 
                         ['Health', 'Auto', 'Home', 'Life'].includes(headingText))) {
                        type = 'service';
                    }
                    
                    this.documents.push({
                        content: headingText,
                        section: currentSection,
                        type: type
                    });
                }
                continue;
            }
            
            // Check if this is a list item
            if (line.startsWith('-')) {
                const itemText = line.replace(/^-\s*/, '').trim();
                
                if (itemText) {
                    // Determine if this is a feature or benefit
                    let type = 'list-item';
                    if (currentSection.toLowerCase().includes('about') || 
                        currentSection.toLowerCase().includes('service')) {
                        type = 'feature';
                    }
                    
                    this.documents.push({
                        content: itemText,
                        section: currentSection,
                        type: type
                    });
                }
                continue;
            }
            
            // Check if this is a quote or testimonial
            if (line.startsWith('"')) {
                const quoteText = line.replace(/^"|"$/g, '').trim();
                
                // Determine if this is a testimonial
                let type = 'quote';
                if (currentSection.toLowerCase().includes('testimonial')) {
                    type = 'testimonial';
                }
                
                this.documents.push({
                    content: quoteText,
                    section: currentSection,
                    type: type
                });
                continue;
            }
            
            // Otherwise, treat as paragraph or general content with enhanced type detection
            let type = 'paragraph';
            
            // Check if this paragraph is related to a specific insurance type
            if (currentSection.toLowerCase().includes('service')) {
                if (line.toLowerCase().includes('health')) {
                    type = 'health-description';
                } else if (line.toLowerCase().includes('auto')) {
                    type = 'auto-description';
                } else if (line.toLowerCase().includes('home')) {
                    type = 'home-description';
                } else if (line.toLowerCase().includes('life')) {
                    type = 'life-description';
                }
            }
            
            // Check if this is contact information
            if (currentSection.toLowerCase().includes('contact') || currentSection === 'footer') {
                if (line.includes('@') || 
                    line.match(/\(\d{3}\)\s*\d{3}-\d{4}/) || 
                    line.match(/\d+\s+[A-Za-z]+\s+St/)) {
                    type = 'contact-info';
                }
            }
            
            this.documents.push({
                content: line,
                section: currentSection,
                type: type
            });
        }
        
        // Add special document for insurance types overview
        this.documents.push({
            section: 'SERVICES',
            type: 'insurance-types-overview',
            content: 'ACME Insurance offers Health Insurance, Auto Insurance, Home Insurance, and Life Insurance to meet your various protection needs.'
        });
        
        console.log('Parsed', this.documents.length, 'documents from content file');
    }

    // Create simple embeddings for the documents using bag of words approach
    async createSimpleEmbeddings() {
        try {
            console.log('Creating simple embeddings with bag of words approach...');
            
            if (this.documents.length === 0) {
                console.warn('No documents available for creating embeddings');
                return;
            }
            
            // Create embeddings for each document
            this.embeddings = this.documents.map(doc => {
                return this.createSimpleEmbedding(doc.content);
            });
            
            console.log(`Created ${this.embeddings.length} simple embeddings`);
        } catch (error) {
            console.error('Error creating embeddings:', error);
            // Fallback to empty embeddings
            this.embeddings = [];
        }
    }
    
    // Create a simple embedding using bag of words with improved semantic meaning capture
    createSimpleEmbedding(text) {
        // Common English stopwords to filter out
        const stopwords = new Set([
            'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
            'be', 'been', 'being', 'in', 'on', 'at', 'to', 'for', 'with', 'by',
            'about', 'against', 'between', 'into', 'through', 'during', 'before',
            'after', 'above', 'below', 'from', 'up', 'down', 'of', 'off', 'over',
            'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
            'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
            'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
            'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should',
            'now', 'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
        ]);
        
        // Insurance-specific important terms to boost with weighted values
        const importantTerms = {
            'insurance': 2.5, 
            'policy': 2.0, 
            'coverage': 2.0, 
            'premium': 1.8, 
            'deductible': 1.8, 
            'claim': 1.8,
            'health': 2.2, 
            'medical': 2.0, 
            'auto': 2.2, 
            'car': 2.0, 
            'vehicle': 2.0, 
            'home': 2.2, 
            'house': 2.0, 
            'property': 2.0,
            'life': 2.2, 
            'death': 1.8, 
            'beneficiary': 1.8, 
            'family': 1.5, 
            'protection': 1.8, 
            'quote': 2.0, 
            'price': 1.8,
            'cost': 1.8, 
            'agent': 1.8, 
            'advisor': 1.8, 
            'contact': 1.8, 
            'service': 1.5, 
            'plan': 1.5, 
            'benefit': 1.5,
            'acme': 2.0
        };
        
        // Normalize text: lowercase and remove punctuation
        const normalizedText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
        const words = normalizedText.split(/\s+/).filter(word => word.length > 2 && !stopwords.has(word));
        
        // Create a simple word frequency vector with boosting for important terms
        const wordFreq = {};
        words.forEach(word => {
            // Boost important insurance-related terms with specific weights
            const boost = importantTerms[word] || 1.0;
            wordFreq[word] = (wordFreq[word] || 0) + boost;
        });
        
        // Add bigrams for better phrase matching with improved weighting
        if (words.length > 1) {
            for (let i = 0; i < words.length - 1; i++) {
                const bigram = `${words[i]}_${words[i+1]}`;
                // Check if this bigram contains important terms for higher weighting
                const containsImportant = importantTerms[words[i]] || importantTerms[words[i+1]];
                const bigramBoost = containsImportant ? 0.8 : 0.5;
                wordFreq[bigram] = (wordFreq[bigram] || 0) + bigramBoost;
            }
        }
        
        return wordFreq;
    }
    
    // Calculate similarity between two embeddings with enhanced algorithms
    calculateSimilarity(embedding1, embedding2) {
        // Get all unique words from both embeddings
        const allWords = new Set([...Object.keys(embedding1), ...Object.keys(embedding2)]);
        
        // Calculate dot product
        let dotProduct = 0;
        let magnitude1 = 0;
        let magnitude2 = 0;
        
        // Count exact matches for Jaccard similarity
        let matchCount = 0;
        let totalWords = allWords.size;
        
        // Get embedding lengths for length normalization
        const length1 = Object.keys(embedding1).length;
        const length2 = Object.keys(embedding2).length;
        
        // Length ratio for boosting shorter documents that match well
        const lengthRatio = Math.min(length1, length2) / Math.max(length1, length2);
        
        allWords.forEach(word => {
            const val1 = embedding1[word] || 0;
            const val2 = embedding2[word] || 0;
            
            // Count matches for Jaccard similarity
            if (val1 > 0 && val2 > 0) {
                matchCount++;
            }
            
            // Apply TF-IDF like weighting: longer words get more weight
            const wordLength = word.length;
            const lengthBoost = Math.min(2.0, 1.0 + (wordLength - 3) * 0.1);
            
            // Boost exact matches between query and document
            const matchBoost = (val1 > 0 && val2 > 0) ? 1.2 : 1.0;
            
            // Apply boosting for bigrams
            const bigramBoost = word.includes('_') ? 1.5 : 1.0;
            
            // Apply boosts to the dot product calculation
            const boostedVal1 = val1 * lengthBoost;
            const boostedVal2 = val2 * lengthBoost;
            
            dotProduct += boostedVal1 * boostedVal2 * matchBoost * bigramBoost;
            magnitude1 += boostedVal1 * boostedVal1;
            magnitude2 += boostedVal2 * boostedVal2;
        });
        
        magnitude1 = Math.sqrt(magnitude1);
        magnitude2 = Math.sqrt(magnitude2);
        
        // Avoid division by zero
        if (magnitude1 === 0 || magnitude2 === 0) return 0;
        
        // Calculate cosine similarity
        const cosineSimilarity = dotProduct / (magnitude1 * magnitude2);
        
        // Calculate Jaccard similarity directly from match count
        const jaccardSimilarity = matchCount / totalWords;
        
        // Apply length boost for shorter texts that match well
        const lengthBoost = 0.8 + (0.2 * lengthRatio);
        
        // Combine cosine and Jaccard similarities with weights
        // 70% cosine (better for longer texts) and 30% Jaccard (better for short texts)
        const combinedSimilarity = (cosineSimilarity * 0.7) + (jaccardSimilarity * 0.3);
        
        // Apply final length boost
        return combinedSimilarity * lengthBoost;
    }

    // Search for relevant documents based on a query with improved relevance
    async search(query, topK = 3) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        try {
            // Check if we have documents and embeddings
            if (this.documents.length === 0 || this.embeddings.length === 0) {
                console.warn('No documents or embeddings available for search');
                return [];
            }
            
            // Normalize and preprocess the query
            const normalizedQuery = query.toLowerCase().trim();
            console.log('Searching for:', normalizedQuery);
            
            // Create embedding for the query
            const queryEmbedding = this.createSimpleEmbedding(normalizedQuery);
            
            // Define important keywords for boosting with expanded terms
            const insuranceTypes = [
                'health', 'medical', 'doctor', 'hospital', 'prescription', 'wellness',
                'auto', 'car', 'vehicle', 'driving', 'collision', 'comprehensive', 'liability',
                'home', 'house', 'property', 'dwelling', 'apartment', 'condo', 'homeowner',
                'life', 'death', 'beneficiary', 'term', 'whole life', 'family protection'
            ];
            const contactKeywords = ['contact', 'phone', 'call', 'email', 'address', 'location', 'office', 'hours', 'reach'];
            const quoteKeywords = ['quote', 'price', 'cost', 'premium', 'estimate', 'offer', 'rate', 'pricing', 'payment'];
            const agentKeywords = ['agent', 'representative', 'advisor', 'expert', 'consultant', 'specialist', 'broker'];
            const companyKeywords = ['acme', 'company', 'about', 'business', 'history', 'mission', 'values'];
            
            // Identify query intent for better context matching
            const hasInsuranceIntent = insuranceTypes.some(type => normalizedQuery.includes(type));
            const hasContactIntent = contactKeywords.some(word => normalizedQuery.includes(word));
            const hasQuoteIntent = quoteKeywords.some(word => normalizedQuery.includes(word));
            const hasAgentIntent = agentKeywords.some(word => normalizedQuery.includes(word));
            const hasCompanyIntent = companyKeywords.some(word => normalizedQuery.includes(word));
            
            // Extract question type for better matching
            const isWhatQuestion = normalizedQuery.includes('what');
            const isHowQuestion = normalizedQuery.includes('how');
            const isWhereQuestion = normalizedQuery.includes('where');
            const isWhoQuestion = normalizedQuery.includes('who');
            const isWhenQuestion = normalizedQuery.includes('when');
            const isWhyQuestion = normalizedQuery.includes('why');
            const isQuestion = isWhatQuestion || isHowQuestion || isWhereQuestion || isWhoQuestion || isWhenQuestion || isWhyQuestion || normalizedQuery.includes('?');
            
            // Identify specific insurance type mentioned in query
            let queryInsuranceType = null;
            if (normalizedQuery.includes('health') || normalizedQuery.includes('medical') || normalizedQuery.includes('doctor')) {
                queryInsuranceType = 'health';
            } else if (normalizedQuery.includes('auto') || normalizedQuery.includes('car') || normalizedQuery.includes('vehicle')) {
                queryInsuranceType = 'auto';
            } else if (normalizedQuery.includes('home') || normalizedQuery.includes('house') || normalizedQuery.includes('property')) {
                queryInsuranceType = 'home';
            } else if (normalizedQuery.includes('life') || normalizedQuery.includes('death') || normalizedQuery.includes('beneficiary')) {
                queryInsuranceType = 'life';
            }
            
            // Calculate similarity scores with enhanced context-aware boosting
            const scores = this.embeddings.map((embedding, index) => {
                const document = this.documents[index];
                const docContent = document.content.toLowerCase();
                const docSection = document.section.toLowerCase();
                const docType = document.type.toLowerCase();
                
                // Base similarity score
                let score = this.calculateSimilarity(queryEmbedding, embedding);
                
                // Boost scores for exact keyword matches with improved weighting
                const keywords = normalizedQuery.split(/\s+/);
                
                // Count how many keywords appear in the document with length and importance weighting
                let keywordBoost = 0;
                keywords.forEach(keyword => {
                    if (keyword.length > 3 && docContent.includes(keyword)) {
                        // Important keywords get higher boost
                        if (insuranceTypes.includes(keyword)) {
                            keywordBoost += 0.15; // Insurance type keywords are very important
                        } else if (contactKeywords.includes(keyword)) {
                            keywordBoost += 0.12; // Contact keywords are important
                        } else if (quoteKeywords.includes(keyword)) {
                            keywordBoost += 0.12; // Quote keywords are important
                        } else if (agentKeywords.includes(keyword)) {
                            keywordBoost += 0.12; // Agent keywords are important
                        } else if (companyKeywords.includes(keyword)) {
                            keywordBoost += 0.10; // Company keywords are important
                        } else {
                            keywordBoost += 0.08; // Regular keyword match
                        }
                    }
                });
                
                // Cap the keyword boost
                keywordBoost = Math.min(0.4, keywordBoost);
                score += keywordBoost;
                
                // Boost specific document types based on question type
                if (isWhatQuestion) {
                    // What questions often need definitions or overviews
                    if (docType.includes('heading') || docType.includes('subheading') || 
                        docType.includes('description') || docType === 'service') {
                        score += 0.15;
                    }
                } else if (isHowQuestion) {
                    // How questions often need process descriptions
                    if (docContent.includes('how') || docContent.includes('process') || 
                        docContent.includes('steps') || docType.includes('description')) {
                        score += 0.15;
                    }
                } else if (isWhereQuestion) {
                    // Where questions often need location information
                    if (docType === 'contact-info' || docSection.includes('contact') || 
                        docContent.includes('location') || docContent.includes('address')) {
                        score += 0.2;
                    }
                } else if (isWhoQuestion) {
                    // Who questions often need agent or company information
                    if (docSection.includes('agent') || docSection.includes('about') || 
                        docContent.includes('agent') || docContent.includes('company')) {
                        score += 0.2;
                    }
                }
                
                // Boost specific sections based on query context with improved patterns
                if (queryInsuranceType) {
                    // If query is about health insurance, boost health insurance documents
                    if (queryInsuranceType === 'health' && 
                        (docType === 'health-description' || docType.includes('health') || 
                         (docSection.includes('service') && docContent.includes('health')))) {
                        score += 0.35;
                    }
                    // If query is about auto insurance, boost auto insurance documents
                    else if (queryInsuranceType === 'auto' && 
                             (docType === 'auto-description' || docType.includes('auto') || 
                              (docSection.includes('service') && 
                               (docContent.includes('auto') || docContent.includes('car') || docContent.includes('vehicle'))))) {
                        score += 0.35;
                    }
                    // If query is about home insurance, boost home insurance documents
                    else if (queryInsuranceType === 'home' && 
                             (docType === 'home-description' || docType.includes('home') || 
                              (docSection.includes('service') && 
                               (docContent.includes('home') || docContent.includes('house') || docContent.includes('property'))))) {
                        score += 0.35;
                    }
                    // If query is about life insurance, boost life insurance documents
                    else if (queryInsuranceType === 'life' && 
                             (docType === 'life-description' || docType.includes('life') || 
                              (docSection.includes('service') && docContent.includes('life')))) {
                        score += 0.35;
                    }
                }
                
                // Boost contact information for contact-related queries
                if (hasContactIntent && 
                    (docType === 'contact-info' || docSection.includes('contact') || 
                     contactKeywords.some(keyword => docContent.includes(keyword)))) {
                    score += 0.35;
                }
                
                // Boost quote-related content for quote queries
                if (hasQuoteIntent && 
                    (docContent.includes('quote') || docContent.includes('price') || 
                     docContent.includes('cost') || docContent.includes('premium'))) {
                    score += 0.3;
                }
                
                // Boost agent-related content for agent queries
                if (hasAgentIntent && 
                    (docSection.includes('agent') || docContent.includes('agent') || 
                     docContent.includes('advisor') || docContent.includes('representative'))) {
                    score += 0.3;
                }
                
                // Boost company information for company-related queries
                if (hasCompanyIntent && 
                    (docSection.includes('about') || docContent.includes('company') || 
                     docContent.includes('acme') || docContent.includes('mission'))) {
                    score += 0.3;
                }
                
                // Boost scores for headings and subheadings for better overview
                if (docType === 'heading') {
                    score += 0.2;
                } else if (docType === 'subheading') {
                    score += 0.15;
                } else if (docType === 'service') {
                    score += 0.25;
                } else if (docType === 'insurance-types-overview') {
                    score += 0.3; // Boost overview document for general insurance questions
                }
                
                return {
                    index,
                    score: Math.min(1.0, score), // Cap score at 1.0
                    document: document
                };
            });
            
            // Sort by score in descending order and take top K
            const topResults = scores
                .sort((a, b) => b.score - a.score)
                .slice(0, topK);
            
            // Ensure we have diverse results by adding at least one document from each relevant section
            // if the query is about insurance types and we don't have results from that section
            if (queryInsuranceType && topResults.length > 0) {
                const hasInsuranceTypeDoc = topResults.some(r => 
                    r.document.type.includes(queryInsuranceType) || 
                    (r.document.section.toLowerCase().includes('service') && 
                     r.document.content.toLowerCase().includes(queryInsuranceType)));
                
                if (!hasInsuranceTypeDoc) {
                    // Find the best matching document for this insurance type
                    const insuranceTypeDoc = scores
                        .filter(r => 
                            r.document.type.includes(queryInsuranceType) || 
                            (r.document.section.toLowerCase().includes('service') && 
                             r.document.content.toLowerCase().includes(queryInsuranceType)))
                        .sort((a, b) => b.score - a.score)[0];
                    
                    if (insuranceTypeDoc) {
                        // Replace the lowest scoring result with this one
                        topResults.pop();
                        topResults.push(insuranceTypeDoc);
                        // Re-sort results
                        topResults.sort((a, b) => b.score - a.score);
                    }
                }
            }
            
            console.log('Search results for query:', query);
            console.log('Top results:', topResults.map(r => ({ 
                score: r.score.toFixed(2),
                content: r.document.content.substring(0, 50) + (r.document.content.length > 50 ? '...' : ''),
                section: r.document.section,
                type: r.document.type
            })));
            
            return topResults;
        } catch (error) {
            console.error('Error searching for documents:', error);
            return [];
        }
    }

    // Helper method to extract query intent from the query
    extractQueryIntent(query) {
        const normalizedQuery = query.toLowerCase();
        
        // Define patterns for different intents
        const insuranceTypePatterns = {
            health: /health|medical|doctor|hospital|illness|sick|prescription|wellness|healthcare/i,
            auto: /auto|car|vehicle|driving|accident|collision|comprehensive|liability|roadside/i,
            home: /home|house|property|apartment|condo|dwelling|residence|building|landlord|renter/i,
            life: /life|death|beneficiary|family protection|funeral|term|whole life|universal|estate planning/i
        };
        
        // Check for insurance type intent
        for (const [type, pattern] of Object.entries(insuranceTypePatterns)) {
            if (pattern.test(normalizedQuery)) {
                return { type: 'insurance', insuranceType: type };
            }
        }
        
        // Check for contact intent
        if (/contact|phone|email|address|location|office|reach|get in touch|call|visit|hours/i.test(normalizedQuery)) {
            return { type: 'contact' };
        }
        
        // Check for quote intent
        if (/quote|get a quote|price|cost|how much|premium|estimate|calculator|pricing|rates/i.test(normalizedQuery)) {
            return { type: 'quote' };
        }
        
        // Check for agent intent
        if (/agent|advisor|representative|specialist|expert|consultant|broker/i.test(normalizedQuery)) {
            return { type: 'agent' };
        }
        
        // Check for company intent
        if (/about (acme|the company)|company (history|background|info)|how long|who is acme|tell me about|mission|values/i.test(normalizedQuery)) {
            return { type: 'company' };
        }
        
        // Check for claims intent
        if (/claim|file a claim|report (accident|damage|loss)|claims process|how to (file|submit|make) a claim/i.test(normalizedQuery)) {
            return { type: 'claim' };
        }
        
        // Default to general intent
        return { type: 'general' };
    }
    
    // Helper method to extract question type from the query
    extractQuestionType(query) {
        const normalizedQuery = query.toLowerCase();
        
        // Check for different question types
        if (/^what|what is|what are|what type|what kind/i.test(normalizedQuery)) {
            return 'what'; // Information/definition questions
        }
        
        if (/^how|how do|how can|how does|how to/i.test(normalizedQuery)) {
            return 'how'; // Process/method questions
        }
        
        if (/^where|where is|where can|where do|where should/i.test(normalizedQuery)) {
            return 'where'; // Location questions
        }
        
        if (/^when|when is|when can|when do|when will/i.test(normalizedQuery)) {
            return 'when'; // Time questions
        }
        
        if (/^who|who is|who are|who can|who should/i.test(normalizedQuery)) {
            return 'who'; // Person questions
        }
        
        if (/^why|why is|why are|why do|why should/i.test(normalizedQuery)) {
            return 'why'; // Reason questions
        }
        
        if (/^can|can i|can you|can we|can they/i.test(normalizedQuery)) {
            return 'can'; // Possibility questions
        }
        
        if (/^do|does|do i|does it|do you/i.test(normalizedQuery)) {
            return 'do'; // Yes/no questions
        }
        
        // Default to 'other' for non-specific question types
        return 'other';
    }
    
    // Generate a response based on the query and search results with improved relevance
    async generateResponse(query) {
        try {
            // Normalize query for better matching
            const normalizedQuery = query.toLowerCase().trim();
            console.log('Processing query:', normalizedQuery);
            
            // Extract query intent and question type for better response targeting
            const queryIntent = this.extractQueryIntent(normalizedQuery);
            const questionType = this.extractQuestionType(normalizedQuery);
            console.log('Query intent:', queryIntent, 'Question type:', questionType);
            
            // Handle greetings and common queries directly
            if (/^(hi|hello|hey|greetings)\b/i.test(normalizedQuery)) {
                return "Hello! I'm your ACME Insurance assistant. How can I help you today? I can provide information about our insurance products, help you get a quote, or connect you with an agent.";
            }
            
            if (/^(how are you|how's it going)/i.test(normalizedQuery)) {
                return "I'm doing well, thank you for asking! How can I assist you with your insurance needs today? I'm here to answer questions about our policies, coverage options, and services.";
            }
            
            if (/^(bye|goodbye|see you)/i.test(normalizedQuery)) {
                return "Thank you for chatting with me today! If you have any more questions about our insurance services, feel free to ask anytime. Have a great day!";
            }
            
            if (/^(thanks|thank you)/i.test(normalizedQuery)) {
                return "You're welcome! Is there anything else I can help you with today? I'm happy to provide more information about our insurance options or answer any other questions you might have.";
            }
            
            // Handle specific question types with direct responses - expanded patterns
            if (/what (types|kinds?|sort) of insurance|insurance (types|options|products|policies|plans|offerings)|what (insurance|policies|coverage) (do you|does acme) (have|offer|provide)/i.test(normalizedQuery)) {
                return "ACME Insurance offers four main types of insurance: Health Insurance (comprehensive coverage for individuals and families), Auto Insurance (protection for your vehicle), Home Insurance (safeguarding your property), and Life Insurance (financial security for your loved ones). Each type has multiple plans with different coverage levels and premium options. Which one would you like to know more about?";
            }
            
            if (/contact|phone|email|address|location|office|reach|get in touch|call|visit|hours/i.test(normalizedQuery)) {
                return "You can contact ACME Insurance through multiple channels:\n\n• Phone: (555) 123-4567 (24/7 customer service)\n• Email: info@acmeinsurance.com\n• Office: 123 Insurance St, City, State 12345\n• Hours: Monday-Friday 9am-5pm, Saturday 10am-2pm\n\nOur customer service team is available 24/7 by phone for emergencies and claims. Would you like to speak with an agent directly?";
            }
            
            if (/quote|get a quote|price|cost|how much|premium|estimate|calculator|pricing|rates/i.test(normalizedQuery)) {
                return "You can get a personalized insurance quote in three easy ways:\n\n1. Online: Fill out our quick quote form on our homepage (takes about 5 minutes)\n2. Phone: Call (555) 123-4567 to speak with a quote specialist\n3. In-person: Visit our office for a detailed consultation\n\nOur quotes are personalized based on your specific needs and circumstances. We offer competitive rates with various discounts available. Would you like me to guide you through the online quote process?";
            }
            
            if (/agent|advisor|representative|specialist|expert|consultant|broker/i.test(normalizedQuery)) {
                return "Our insurance specialists are here to help you find the perfect coverage:\n\n• Sarah Johnson (Senior Advisor): 15+ years experience, specializes in family and business insurance. Direct line: (555) 123-4568\n• Michael Chen (Auto & Home Expert): 10+ years experience with property protection. Direct line: (555) 123-4569\n• Lisa Rodriguez (Health Insurance Specialist): Expert in individual and group health plans. Direct line: (555) 123-4570\n\nAll our agents are licensed professionals committed to finding you the best coverage at competitive rates. Would you like to schedule a consultation with one of our specialists?";
            }
            
            if (/about (acme|the company)|company (history|background|info)|how long|who is acme|tell me about|mission|values/i.test(normalizedQuery)) {
                return "ACME Insurance has been your trusted protection partner for over 20 years. Founded in 2001 by insurance veterans with a mission to make quality coverage accessible to everyone, we've grown from a small local agency to serving over 50,000 customers nationwide.\n\nOur core values:\n• Customer-first approach with personalized service\n• Transparency in all policies and pricing\n• Quick and fair claims processing\n• Community involvement and giving back\n\nWe're proud to maintain an A+ rating with the Better Business Bureau and 4.8/5 stars from customer reviews. Our team of 100+ experienced professionals is dedicated to helping you find the right coverage for your specific needs.";
            }
            
            // Enhanced handling for specific insurance types with more comprehensive patterns
            if (/health insurance|medical (coverage|insurance|plan)|healthcare|doctor|hospital|medical bills|prescription|wellness|preventive care|medical expenses/i.test(normalizedQuery)) {
                // Gather all health insurance related content for more comprehensive response
                const healthDocs = this.documents.filter(doc => 
                    doc.content.toLowerCase().includes('health') || 
                    doc.type.includes('health') ||
                    doc.section.toLowerCase().includes('health')
                );
                
                let healthInfo = "Our Health Insurance plans provide comprehensive coverage for individuals, families, and businesses. Key benefits include:\n\n• Access to our network of 10,000+ doctors and 500+ hospitals nationwide\n• Prescription drug coverage with low copays\n• Preventive care with no out-of-pocket costs\n• 24/7 telehealth services\n• Mental health coverage\n• Wellness programs and discounts\n\nWe offer Bronze, Silver, Gold, and Platinum plans to fit different budgets and healthcare needs, with monthly premiums starting at $250 for individuals.";
                
                // Add specific details if available
                if (healthDocs.length > 0) {
                    // Extract the most relevant content from health docs
                    const relevantContent = healthDocs
                        .filter(doc => doc.type !== 'heading' && doc.type !== 'subheading')
                        .slice(0, 3)
                        .map(doc => doc.content)
                        .join(' ');
                    
                    if (relevantContent && relevantContent.length > 20) {
                        healthInfo += "\n\nAdditional information: " + relevantContent;
                    }
                }
                
                return healthInfo + "\n\nWould you like to get a personalized health insurance quote or speak with our health insurance specialist?";
            }
            
            if (/auto insurance|car insurance|vehicle (coverage|insurance|protection)|automobile|driving|accident|collision|comprehensive|liability|roadside|car damage|vehicle policy/i.test(normalizedQuery)) {
                // Gather all auto insurance related content
                const autoDocs = this.documents.filter(doc => 
                    doc.content.toLowerCase().includes('auto') || 
                    doc.content.toLowerCase().includes('car') || 
                    doc.type.includes('auto') ||
                    doc.section.toLowerCase().includes('auto')
                );
                
                let autoInfo = "ACME Auto Insurance protects you and your vehicle with customizable coverage options:\n\n• Collision coverage for accidents regardless of fault\n• Comprehensive coverage for theft, vandalism, and natural disasters\n• Liability protection for bodily injury and property damage\n• Uninsured/underinsured motorist coverage\n• Optional roadside assistance and rental car coverage\n• New car replacement for vehicles less than 1 year old\n\nWe offer discounts for safe drivers (up to 20%), multi-car policies (15%), bundling with home insurance (25%), and advanced safety features.";
                
                // Add specific details if available
                if (autoDocs.length > 0) {
                    // Extract the most relevant content from auto docs
                    const relevantContent = autoDocs
                        .filter(doc => doc.type !== 'heading' && doc.type !== 'subheading')
                        .slice(0, 3)
                        .map(doc => doc.content)
                        .join(' ');
                    
                    if (relevantContent && relevantContent.length > 20) {
                        autoInfo += "\n\nAdditional information: " + relevantContent;
                    }
                }
                
                return autoInfo + "\n\nWould you like to get an auto insurance quote based on your vehicle and driving history?";
            }
            
            if (/home insurance|homeowners|property (coverage|insurance|protection)|house|apartment|condo|dwelling|residence|building|landlord|renter|tenant|property damage/i.test(normalizedQuery)) {
                // Gather all home insurance related content
                const homeDocs = this.documents.filter(doc => 
                    doc.content.toLowerCase().includes('home') || 
                    doc.content.toLowerCase().includes('house') || 
                    doc.content.toLowerCase().includes('property') || 
                    doc.type.includes('home') ||
                    doc.section.toLowerCase().includes('home')
                );
                
                let homeInfo = "Our Home Insurance policies safeguard your property and belongings with comprehensive protection:\n\n• Dwelling coverage for your home's structure\n• Personal property protection for your belongings\n• Liability coverage for accidents on your property\n• Additional living expenses if your home becomes uninhabitable\n• Medical payments coverage for guests injured on your property\n\nWe also offer optional coverages including flood insurance, earthquake protection, valuable items coverage, and identity theft protection. Policies can be customized based on your home's value, location, and specific needs.";
                
                // Add specific details if available
                if (homeDocs.length > 0) {
                    // Extract the most relevant content from home docs
                    const relevantContent = homeDocs
                        .filter(doc => doc.type !== 'heading' && doc.type !== 'subheading')
                        .slice(0, 3)
                        .map(doc => doc.content)
                        .join(' ');
                    
                    if (relevantContent && relevantContent.length > 20) {
                        homeInfo += "\n\nAdditional information: " + relevantContent;
                    }
                }
                
                return homeInfo + "\n\nWould you like to discuss customizing a home insurance policy for your specific property?";
            }
            
            if (/life insurance|death benefit|beneficiary|term life|whole life|permanent life|universal life|family protection|funeral expenses|income replacement|estate planning/i.test(normalizedQuery)) {
                // Gather all life insurance related content
                const lifeDocs = this.documents.filter(doc => 
                    doc.content.toLowerCase().includes('life') || 
                    doc.type.includes('life') ||
                    doc.section.toLowerCase().includes('life')
                );
                
                let lifeInfo = "ACME Life Insurance provides financial security for your loved ones with flexible coverage options:\n\n• Term Life: Affordable coverage for 10, 20, or 30 years with death benefits from $100,000 to $5 million\n• Whole Life: Permanent coverage with cash value accumulation and fixed premiums\n• Universal Life: Flexible premiums and death benefits with investment components\n\nOur life insurance can help cover funeral expenses, replace lost income, pay off debts including mortgages, fund education expenses, and create an inheritance. Policies are available for individuals ages 18-75 with simplified underwriting options available.";
                
                // Add specific details if available
                if (lifeDocs.length > 0) {
                    // Extract the most relevant content from life docs
                    const relevantContent = lifeDocs
                        .filter(doc => doc.type !== 'heading' && doc.type !== 'subheading')
                        .slice(0, 3)
                        .map(doc => doc.content)
                        .join(' ');
                    
                    if (relevantContent && relevantContent.length > 20) {
                        lifeInfo += "\n\nAdditional information: " + relevantContent;
                    }
                }
                
                return lifeInfo + "\n\nWould you like to speak with our life insurance advisor about creating a personalized protection plan for your family?";
            }
            
            // Handle claims-related questions
            if (/claim|file a claim|report (accident|damage|loss)|claims process|how to (file|submit|make) a claim/i.test(normalizedQuery)) {
                return "Filing a claim with ACME Insurance is quick and easy:\n\n1. Report your claim 24/7 through our mobile app, online portal, or by calling (555) 123-4567\n2. Provide basic information about the incident and any supporting documentation\n3. A dedicated claims adjuster will be assigned within 24 hours\n4. Track your claim status through our online portal or mobile app\n\nFor emergency claims, we offer expedited processing with same-day assessments. Our average claim processing time is 5-7 business days, with direct deposit reimbursement available. Do you need to file a claim now or have questions about a specific claims situation?";
            }
            
            // Search for relevant documents with increased number of results for better context
            const searchResults = await this.search(query, 5); // Get more results for better context
            console.log('Search results:', searchResults);
            
            if (searchResults.length === 0) {
                return "I'm sorry, I don't have specific information about that. Please contact our team at (555) 123-4567 for more detailed assistance with your question. You can also visit our website at www.acmeinsurance.com for additional resources.";
            }
            
            // Use the top result to generate a response
            const topResult = searchResults[0];
            
            // If the score is too low, return a more helpful response based on query intent
            if (topResult.score < 0.25) {
                if (queryIntent.type === 'insurance') {
                    return `I'm not sure I understand your specific question about ${queryIntent.insuranceType} insurance. Would you like to know about coverage options, pricing, or benefits? Or you can call us at (555) 123-4567 for personalized assistance.`;
                } else if (queryIntent.type !== 'general') {
                    return `I'm not sure I understand your specific question about our ${queryIntent.type} services. Could you please provide more details about what you'd like to know? Our customer service team is also available at (555) 123-4567 to assist you.`;
                } else {
                    return "I'm not sure I understand your question completely. Could you please rephrase it or provide more details about what you'd like to know about our insurance services? I can help with information about our policies, coverage options, quotes, claims process, or connecting you with an agent.";
                }
            }
            
            // Generate response based on the type of content
            let response = '';
            
            // Check if query is about specific insurance types - more comprehensive patterns
            if (/health|medical|doctor|hospital|illness|sick|prescription|wellness/i.test(normalizedQuery)) {
                // Gather all health insurance related content
                const healthDocs = this.documents.filter(doc => 
                    doc.content.toLowerCase().includes('health') || 
                    doc.section.toLowerCase().includes('health')
                );
                
                let healthInfo = "Our health insurance provides comprehensive coverage for individuals and families, including preventive care, hospital stays, prescription coverage, and access to a wide network of healthcare providers.";
                
                // Add specific details if available
                if (healthDocs.length > 0) {
                    const details = healthDocs.map(doc => doc.content).join(' ');
                    healthInfo += " " + details;
                }
                
                response = healthInfo;
                
            } else if (/auto|car|vehicle|driving|accident|collision|comprehensive|liability/i.test(normalizedQuery)) {
                // Gather all auto insurance related content
                const autoDocs = this.documents.filter(doc => 
                    doc.content.toLowerCase().includes('auto') || 
                    doc.section.toLowerCase().includes('auto')
                );
                
                let autoInfo = "Our auto insurance protects your vehicle against accidents, theft, and damages with options for collision, comprehensive, and liability coverage. We also offer roadside assistance and rental car coverage.";
                
                // Add specific details if available
                if (autoDocs.length > 0) {
                    const details = autoDocs.map(doc => doc.content).join(' ');
                    autoInfo += " " + details;
                }
                
                response = autoInfo;
                
            } else if (/home|house|property|apartment|condo|dwelling|homeowner/i.test(normalizedQuery)) {
                // Gather all home insurance related content
                const homeDocs = this.documents.filter(doc => 
                    doc.content.toLowerCase().includes('home') || 
                    doc.section.toLowerCase().includes('home')
                );
                
                let homeInfo = "Our home insurance safeguards your home and belongings from unexpected events like fire, theft, vandalism, and certain natural disasters. We also provide liability protection for accidents that occur on your property.";
                
                // Add specific details if available
                if (homeDocs.length > 0) {
                    const details = homeDocs.map(doc => doc.content).join(' ');
                    homeInfo += " " + details;
                }
                
                response = homeInfo;
                
            } else if (/life|death|beneficiary|family protection|funeral|term|whole life/i.test(normalizedQuery)) {
                // Gather all life insurance related content
                const lifeDocs = this.documents.filter(doc => 
                    doc.content.toLowerCase().includes('life') || 
                    doc.section.toLowerCase().includes('life')
                );
                
                let lifeInfo = "Our life insurance provides financial security for your loved ones in your absence, helping with funeral expenses, debt repayment, income replacement, and future expenses like college tuition.";
                
                // Add specific details if available
                if (lifeDocs.length > 0) {
                    const details = lifeDocs.map(doc => doc.content).join(' ');
                    lifeInfo += " " + details;
                }
                
                response = lifeInfo;
            }
            
            // If no specific insurance type was matched, use the search result with context
            if (!response) {
                // Get the section of the top result for context
            const section = topResult.document.section;
            const sectionDocs = this.documents.filter(doc => doc.section === section);
            
            // Get all relevant documents from the search results for better context
            const relevantDocs = searchResults.map(result => result.document);
            
            // Generate response based on document type and query context
            // Using the queryIntent and questionType already extracted at the beginning of this method
            switch (topResult.document.type) {
                case 'service':
                    // For service documents, provide more comprehensive information
                    const relatedServices = sectionDocs.filter(doc => 
                        doc.type === 'service' || doc.type === 'feature'
                    ).slice(0, 3);
                    
                    let serviceInfo = `${topResult.document.content} This is part of our ${section} offerings.`;
                    
                    if (relatedServices.length > 1) {
                        serviceInfo += " Other related services include: " + 
                            relatedServices
                                .filter(doc => doc.content !== topResult.document.content)
                                .map(doc => doc.content)
                                .join(", ");
                    }
                    
                    response = serviceInfo + " We provide comprehensive coverage tailored to your specific needs.";
                    break;
                    
                case 'heading':
                case 'subheading':
                    // For headings, include related paragraphs and list items if available
                    const relatedContent = sectionDocs.filter(doc => 
                        (doc.type === 'paragraph' || doc.type === 'list-item' || doc.type === 'feature') && 
                        doc.section === section
                    ).slice(0, 5);
                    
                    if (relatedContent.length > 0) {
                        // Group content by type for better organization
                        const paragraphs = relatedContent.filter(doc => doc.type === 'paragraph');
                        const listItems = relatedContent.filter(doc => doc.type === 'list-item' || doc.type === 'feature');
                        
                        let contentResponse = `${topResult.document.content}:`;
                        
                        // Add paragraphs first
                        if (paragraphs.length > 0) {
                            contentResponse += " " + paragraphs.map(doc => doc.content).join(" ");
                        }
                        
                        // Add list items as bullet points if available
                        if (listItems.length > 0) {
                            contentResponse += "\n\nKey points:";
                            listItems.forEach(item => {
                                contentResponse += "\n• " + item.content;
                            });
                        }
                        
                        response = contentResponse;
                    } else {
                        // If no related content, try to provide some context
                        response = `${topResult.document.content}. Please contact us for more detailed information about this topic.`;
                    }
                    break;
                    
                case 'list-item':
                case 'feature':
                    // For list items and features, provide context and related features
                    const sectionTitle = sectionDocs.find(doc => doc.type === 'heading' || doc.type === 'subheading');
                    const relatedFeatures = sectionDocs.filter(doc => 
                        (doc.type === 'list-item' || doc.type === 'feature') && 
                        doc.content !== topResult.document.content
                    ).slice(0, 3);
                    
                    let featureResponse = `${topResult.document.content} is one of our key features`;
                    
                    if (sectionTitle) {
                        featureResponse += ` related to ${sectionTitle.content}`;
                    }
                    
                    featureResponse += ". This benefit is designed to provide you with additional peace of mind and protection.";
                    
                    if (relatedFeatures.length > 0) {
                        featureResponse += " Other related features include: " + 
                            relatedFeatures.map(doc => doc.content).join(", ") + ".";
                    }
                    
                    response = featureResponse;
                    break;
                    
                case 'testimonial':
                    // For testimonials, provide context about the customer and service
                    const testimonialContext = sectionDocs.find(doc => doc.type === 'heading' || doc.type === 'subheading');
                    let testimonialResponse = `One of our satisfied customers says: "${topResult.document.content}"`;  
                    
                    if (testimonialContext) {
                        testimonialResponse += ` regarding our ${testimonialContext.content} services`;
                    }
                    
                    testimonialResponse += ". We pride ourselves on customer satisfaction and personalized service.";
                    
                    // Add a call to action based on the testimonial content
                    if (/excellent|outstanding|amazing|great|good|best/i.test(topResult.document.content)) {
                        testimonialResponse += " Would you like to experience this level of service yourself?";
                    } else {
                        testimonialResponse += " Would you like to learn more about the services mentioned?";
                    }
                    
                    response = testimonialResponse;
                    break;
                    
                case 'insurance-types-overview':
                    // For insurance overview, provide comprehensive information about all types
                    response = `${topResult.document.content}\n\nWe offer four main types of insurance:\n\n• Health Insurance: Comprehensive medical coverage for individuals and families\n• Auto Insurance: Protection for your vehicle against accidents and damages\n• Home Insurance: Safeguarding your property and belongings\n• Life Insurance: Financial security for your loved ones\n\nWhich type of insurance are you most interested in learning more about?`;
                    break;
                    
                default:
                    // For other types, provide context from the section and related documents
                    const sectionHeading = sectionDocs.find(doc => doc.type === 'heading');
                    const relatedDocs = searchResults
                        .slice(1, 3)
                        .map(result => result.document)
                        .filter(doc => doc.type !== 'heading' && doc.type !== 'subheading');
                    
                    let defaultResponse = "";
                    
                    if (sectionHeading) {
                        defaultResponse = `Regarding ${sectionHeading.content}: ${topResult.document.content}`;
                    } else {
                        defaultResponse = topResult.document.content;
                    }
                    
                    // Add related information if available
                    if (relatedDocs.length > 0) {
                        defaultResponse += "\n\nAdditional information: " + 
                            relatedDocs.map(doc => doc.content).join(" ");
                    }
                    
                    response = defaultResponse;
            }
            }
            
            // Add a follow-up suggestion based on the query context
            let suggestion = "";
            
            if (/quote|price|cost|how much|premium|rate/i.test(normalizedQuery)) {
                suggestion = "Would you like to get a personalized quote for this insurance? You can fill out our form on the homepage or call us at (555) 123-4567 for immediate assistance.";
            } else if (/coverage|protect|benefits|policy details/i.test(normalizedQuery)) {
                suggestion = "Would you like to learn more about the specific coverage details or compare with other insurance options we offer? Our agents can provide a detailed comparison tailored to your needs.";
            } else if (/agent|talk|speak|contact|representative|advisor/i.test(normalizedQuery)) {
                suggestion = "Would you like to speak with our agent Sarah Johnson? She has over 15 years of experience and can provide personalized advice. You can reach her directly at (555) 123-4568.";
            } else if (/health|medical|doctor|hospital/i.test(normalizedQuery)) {
                suggestion = "Would you like to know more about our health insurance plans or get a quote for health coverage? We offer individual, family, and group plans with various deductible options.";
            } else if (/auto|car|vehicle/i.test(normalizedQuery)) {
                suggestion = "Would you like to learn about our auto insurance discounts or coverage options for different vehicles? We offer special rates for safe drivers and multi-policy holders.";
            } else if (/home|property|house/i.test(normalizedQuery)) {
                suggestion = "Would you like to know what specific events and damages our home insurance covers? We can also discuss optional coverages like flood insurance or valuable items protection.";
            } else if (/life|beneficiary|death benefit/i.test(normalizedQuery)) {
                suggestion = "Would you like to discuss how our life insurance can be tailored to your family's specific needs? We offer both term and permanent life insurance solutions.";
            } else if (/claim|file a claim|report/i.test(normalizedQuery)) {
                suggestion = "Would you like information on how to file a claim? Our claims process is quick and easy, with 24/7 support available.";
            } else {
                // More specific contextual suggestions
                const suggestions = [
                    "Would you like a personalized quote for this insurance?",
                    "Do you have any specific questions about our coverage options?",
                    "Would you like to speak with an agent for more detailed information?",
                    "Can I help you compare different insurance plans we offer?",
                    "Would you like to learn about our discount programs and savings opportunities?"
                ];
                suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
            }
            
            return `${response}\n\n${suggestion}`;
        } catch (error) {
            console.error('Error generating response:', error);
            return "I'm sorry, I'm having trouble generating a response right now. Please try again later or contact our team for assistance at (555) 123-4567.";
        }
    }
}

// Chatbot UI implementation
class ChatbotUI {
    constructor(vectorSearch) {
        this.vectorSearch = vectorSearch;
        this.isOpen = false;
        this.messages = [];
        this.createChatbotUI();
    }

    createChatbotUI() {
        // Create chatbot container
        const chatbotContainer = document.createElement('div');
        chatbotContainer.className = 'chatbot-container';
        document.body.appendChild(chatbotContainer);
        
        // Create chatbot button
        const chatbotButton = document.createElement('button');
        chatbotButton.className = 'chatbot-button';
        chatbotButton.innerHTML = '<i class="fas fa-comment"></i>';
        chatbotContainer.appendChild(chatbotButton);
        
        // Create chatbot widget
        const chatbotWidget = document.createElement('div');
        chatbotWidget.className = 'chatbot-widget';
        chatbotContainer.appendChild(chatbotWidget);
        
        // Create chatbot header
        const chatbotHeader = document.createElement('div');
        chatbotHeader.className = 'chatbot-header';
        chatbotHeader.innerHTML = `
            <h3>ACME Insurance Assistant</h3>
            <button class="chatbot-close"><i class="fas fa-times"></i></button>
        `;
        chatbotWidget.appendChild(chatbotHeader);
        
        // Create chatbot messages container
        const chatbotMessages = document.createElement('div');
        chatbotMessages.className = 'chatbot-messages';
        chatbotWidget.appendChild(chatbotMessages);
        
        // Create chatbot input
        const chatbotInput = document.createElement('div');
        chatbotInput.className = 'chatbot-input';
        chatbotInput.innerHTML = `
            <input type="text" placeholder="Ask me about our insurance..." />
            <button><i class="fas fa-paper-plane"></i></button>
        `;
        chatbotWidget.appendChild(chatbotInput);
        
        // Add event listeners
        chatbotButton.addEventListener('click', () => this.toggleChatbot());
        chatbotHeader.querySelector('.chatbot-close').addEventListener('click', () => this.toggleChatbot());
        
        const inputField = chatbotInput.querySelector('input');
        const sendButton = chatbotInput.querySelector('button');
        
        sendButton.addEventListener('click', () => this.sendMessage(inputField.value));
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage(inputField.value);
            }
        });
        
        // Store references
        this.chatbotContainer = chatbotContainer;
        this.chatbotButton = chatbotButton;
        this.chatbotWidget = chatbotWidget;
        this.chatbotMessages = chatbotMessages;
        this.inputField = inputField;
        
        // Add styles
        this.addStyles();
        
        // Add welcome message
        this.addBotMessage('Hi there! 👋 I\'m your ACME Insurance assistant. How can I help you today?');
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .chatbot-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                font-family: 'Roboto', sans-serif;
            }
            
            .chatbot-button {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background-color: #3182CE;
                color: white;
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                transition: all 0.3s ease;
            }
            
            .chatbot-button:hover {
                background-color: #2c5282;
                transform: scale(1.05);
            }
            
            .chatbot-widget {
                position: absolute;
                bottom: 80px;
                right: 0;
                width: 350px;
                height: 500px;
                background-color: white;
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                display: none;
            }
            
            .chatbot-header {
                background-color: #3182CE;
                color: white;
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .chatbot-header h3 {
                margin: 0;
                font-size: 16px;
            }
            
            .chatbot-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 16px;
            }
            
            .chatbot-messages {
                flex: 1;
                padding: 15px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .chatbot-message {
                max-width: 80%;
                padding: 10px 15px;
                border-radius: 18px;
                margin-bottom: 5px;
                line-height: 1.4;
                font-size: 14px;
                word-wrap: break-word;
            }
            
            .chatbot-message.user {
                background-color: #E2E8F0;
                color: #1A202C;
                align-self: flex-end;
                border-bottom-right-radius: 5px;
            }
            
            .chatbot-message.bot {
                background-color: #3182CE;
                color: white;
                align-self: flex-start;
                border-bottom-left-radius: 5px;
            }
            
            .chatbot-input {
                display: flex;
                padding: 10px;
                border-top: 1px solid #E2E8F0;
            }
            
            .chatbot-input input {
                flex: 1;
                padding: 10px;
                border: 1px solid #E2E8F0;
                border-radius: 20px;
                outline: none;
                font-size: 14px;
            }
            
            .chatbot-input button {
                background-color: #3182CE;
                color: white;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                margin-left: 10px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .chatbot-input button:hover {
                background-color: #2c5282;
            }
            
            .chatbot-widget.open {
                display: flex;
            }
            
            .chatbot-typing {
                display: flex;
                align-items: center;
                margin-top: 5px;
                margin-bottom: 10px;
                align-self: flex-start;
            }
            
            .chatbot-typing span {
                height: 8px;
                width: 8px;
                background-color: #3182CE;
                border-radius: 50%;
                display: inline-block;
                margin-right: 3px;
                animation: typing 1s infinite ease-in-out;
            }
            
            .chatbot-typing span:nth-child(2) {
                animation-delay: 0.2s;
            }
            
            .chatbot-typing span:nth-child(3) {
                animation-delay: 0.4s;
            }
            
            @keyframes typing {
                0% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
                100% { transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }

    toggleChatbot() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.chatbotWidget.classList.add('open');
            // Initialize vector search if not already done
            if (!this.vectorSearch.initialized) {
                this.vectorSearch.initialize();
            }
        } else {
            this.chatbotWidget.classList.remove('open');
        }
    }

    addUserMessage(message) {
        if (!message.trim()) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'chatbot-message user';
        messageElement.textContent = message;
        this.chatbotMessages.appendChild(messageElement);
        
        this.messages.push({ role: 'user', content: message });
        this.scrollToBottom();
    }

    addBotMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chatbot-message bot';
        messageElement.textContent = message;
        this.chatbotMessages.appendChild(messageElement);
        
        this.messages.push({ role: 'bot', content: message });
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'chatbot-typing';
        typingIndicator.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        this.chatbotMessages.appendChild(typingIndicator);
        this.scrollToBottom();
        return typingIndicator;
    }

    scrollToBottom() {
        this.chatbotMessages.scrollTop = this.chatbotMessages.scrollHeight;
    }

    async sendMessage(message) {
        if (!message.trim()) return;
        
        // Add user message to chat
        this.addUserMessage(message);
        
        // Clear input field
        this.inputField.value = '';
        
        // Show typing indicator
        const typingIndicator = this.showTypingIndicator();
        
        try {
            // Generate response using vector search
            const response = await this.vectorSearch.generateResponse(message);
            
            // Remove typing indicator
            typingIndicator.remove();
            
            // Add bot response after a short delay to simulate typing
            setTimeout(() => {
                this.addBotMessage(response);
            }, 500);
        } catch (error) {
            console.error('Error generating response:', error);
            
            // Remove typing indicator
            typingIndicator.remove();
            
            // Add error message
            this.addBotMessage("I'm sorry, I encountered an error. Please try again later.");
        }
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const vectorSearch = new ChatbotVectorSearch();
    const chatbotUI = new ChatbotUI(vectorSearch);
    
    // Make chatbot available globally for debugging
    window.chatbot = {
        vectorSearch,
        ui: chatbotUI
    };
});