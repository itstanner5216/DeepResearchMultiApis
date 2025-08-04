async function run(searchQuery) {
    const braveSearchUrl = `https://api.brave.com/v1/search?q=${searchQuery}`;
    const newsApiUrl = `https://newsapi.org/v2/everything?q=${searchQuery}&apiKey=YOUR_NEWSAPI_KEY`;

    const fetchWithRetry = async (url, retries = 3) => {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                if (i === retries - 1) throw error;
            }
        }
    };

    try {
        const braveResults = await fetchWithRetry(braveSearchUrl);
        const newsResults = await fetchWithRetry(newsApiUrl);

        // Process and display results
        const processedResults = processResults(braveResults, newsResults);
        displayResults(processedResults);

        console.log('Search completed successfully!');
    } catch (error) {
        console.error('Failed to fetch search results:', error);
        // Notify user of the failure
    }
}