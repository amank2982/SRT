namespace t2.Common
{
    public static class Stable
    {
        // Error Messages
        public const string StockSymbolsRequired = "Both stock symbols are required.";
        public const string InvalidStockSymbols = "One or both of the stock symbols are invalid or unavailable.";
        public const string ErrorComparingStocks = "An error occurred while comparing stocks: {Stock1} and {Stock2}.";

        // Logging Messages
        public const string StocksComparedSuccessfully = "Successfully fetched and compared stocks: {Stock1} vs {Stock2}";

         // Default File Name
        public const string DefaultUserFileName = "users.json";

        // Error Messages
        public const string EmailAndPasswordRequired = "Email and Password are required.";
        public const string UserAlreadyExists = "User already exists.";
        public const string InvalidEmailOrPassword = "Invalid email or password.";
        public const string RegistrationError = "An error occurred while registering the user.";
        public const string LoginError = "An error occurred while logging in.";
        public const string LoadUsersError = "Error loading users from the file.";
        public const string SaveUsersError = "Error saving users to the file.";

        // Success Messages
        public const string RegistrationSuccessful = "Registration successful.";
        public const string LoginSuccessful = "Login successful.";

        // Error Messages
        
        public const string InternalServerError = "Internal server error.";
        public const string SymbolCannotBeNull = "Symbol cannot be null or empty.";
        public const string FailedToFetchTrendingTickers = "Failed to fetch trending tickers.";
        public const string FailedToFetchLatestNews = "Failed to fetch latest news.";
        public const string FailedToFetchStockChartData = "Failed to fetch stock chart data.";

        // HTTP Headers
        public const string RapidApiKeyHeader = "X-RapidAPI-Key";
        public const string RapidApiHostHeader = "X-RapidAPI-Host";

        // Default API Endpoints
        public const string TrendingTickersEndpoint = "/market/get-trending-tickers?region=US&timestamp=";
        public const string LatestNewsEndpoint = "/news?category=general&token=";
        public const string StockQuoteEndpoint = "/quote?symbol=";
        public const string StockProfileEndpoint = "/stock/profile2?symbol=";
        public const string StockChartEndpoint = "/market/get-charts?symbol=";

        // Default Chart Parameters
        public const string ChartInterval = "5m";
        public const string ChartRange = "1d";
        public const string ChartRegion = "US";


                // API Endpoints
        public const string SuggestionsEndpoint = "/search?q=";

        // Error Messages
        public const string ApiConfigurationMissing = "API configuration is missing in appsettings.json.";
        public const string QueryParameterRequired = "Query parameter is required.";
        public const string FailedToFetchSuggestions = "Failed to fetch suggestions.";
        public const string EmptyApiResponse = "Empty response from the API.";
        public const string HttpRequestError = "HTTP request error occurred while fetching suggestions.";
        public const string JsonParsingError = "JSON parsing error occurred while processing suggestions.";
        public const string UnexpectedError = "An unexpected error occurred while fetching suggestions.";

        // Logging Messages
        public const string NoResultsFound = "No results found for query: {Query}";
        public const string SuggestionsFetchedSuccessfully = "Successfully fetched suggestions for query: {Query}";

        // Default Values
        public const string NoDescriptionAvailable = "No description available.";

         
    }
}