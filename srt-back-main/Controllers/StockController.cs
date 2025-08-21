

 
using Microsoft.AspNetCore.Mvc;
 
using Microsoft.Extensions.Logging;
 
using Microsoft.Extensions.Configuration;
 
using System.Net.Http;
 
using System.Text.Json;
 
using System.Text.Json.Serialization;
 
using System.Threading.Tasks;
 
using Microsoft.AspNetCore.Authorization;
 
using t2.Common; // Import the Stable class
 
using t2.Models; // Import the FinnhubNewsArticle model
 
using System;
 
using System.Collections.Generic;
 
using System.Linq;
using t2.Services;
 
namespace t2.Controllers
 
{
    [Authorize]
    [ApiController]
 
    [Route("api/[controller]")]
 
    public class StockController : ControllerBase
 
    {
 
        private readonly IHttpClientFactory _httpClientFactory;
 
        private readonly ILogger<StockController> _logger;
 
        private readonly IConfiguration _configuration;
 
        private readonly ICohereService _cohereService;
 
        public StockController(IHttpClientFactory httpClientFactory, ILogger<StockController> logger, IConfiguration configuration, ICohereService cohereService)
 
        {
 
            _httpClientFactory = httpClientFactory;
 
            _logger = logger;
 
            _configuration = configuration;
 
            _cohereService = cohereService;
 
        }
 
        [HttpGet("trending")]
 
        public async Task<IActionResult> GetTrendingTickers()
 
        {
 
            try
 
            {
 
                var client = _httpClientFactory.CreateClient();
 
                var apiKey = _configuration["RapidAPI:Key"];
 
                var apiHost = _configuration["RapidAPI:Host"];
 
                var baseUrl = _configuration["RapidAPI:BaseUrl"];
 
                if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiHost) || string.IsNullOrEmpty(baseUrl))
 
                {
 
                    _logger.LogError(Stable.ApiConfigurationMissing);
 
                    return StatusCode(500, new { error = Stable.ApiConfigurationMissing });
 
                }
 
                var url = $"{baseUrl}{Stable.TrendingTickersEndpoint}{DateTime.UtcNow.Ticks}";
 
                var request = new HttpRequestMessage(HttpMethod.Get, url);
 
                request.Headers.Add(Stable.RapidApiKeyHeader, apiKey);
 
                request.Headers.Add(Stable.RapidApiHostHeader, apiHost);
 
                var response = await client.SendAsync(request);
 
                if (!response.IsSuccessStatusCode)
 
                {
 
                    _logger.LogError(Stable.FailedToFetchTrendingTickers);
 
                    return StatusCode((int)response.StatusCode, new { error = Stable.FailedToFetchTrendingTickers });
 
                }
 
                var content = await response.Content.ReadAsStringAsync();
 
                var jsonObject = JsonSerializer.Deserialize<object>(content);
 
                _logger.LogInformation("Successfully fetched trending tickers.");
 
                return Ok(jsonObject);
 
            }
 
            catch (Exception ex)
 
            {
 
                _logger.LogError(ex, Stable.InternalServerError);
 
                return StatusCode(500, new { error = Stable.InternalServerError, message = ex.Message });
 
            }
 
        }
 [HttpGet("latest")]
 
        public async Task<IActionResult> GetLatestNews()
 
        {
 
            try
 
            {
 
                var client = _httpClientFactory.CreateClient();
 
                var apiKey = _configuration["Finnhub:ApiKey"];
 
                var baseUrl = _configuration["Finnhub:BaseUrl"];
 
                if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(baseUrl))
 
                {
 
                    _logger.LogError(Stable.ApiConfigurationMissing);
 
                    return StatusCode(500, new { error = Stable.ApiConfigurationMissing });
 
                }
 
                var url = $"{baseUrl}{Stable.LatestNewsEndpoint}{apiKey}";
 
                var response = await client.GetAsync(url);
 
                if (!response.IsSuccessStatusCode)
 
                {
 
                    _logger.LogError(Stable.FailedToFetchLatestNews);
 
                    return StatusCode((int)response.StatusCode, new { error = Stable.FailedToFetchLatestNews });
 
                }
 
                var content = await response.Content.ReadAsStringAsync();
 
                var newsArticles = JsonSerializer.Deserialize<List<FinnhubNewsArticle>>(content);
 
                if (newsArticles == null || !newsArticles.Any())
 
                {
 
                    _logger.LogWarning("No news articles found.");
 
                    return NotFound(new { error = "No news articles found." });
 
                }
 
                var simplifiedNews = newsArticles.Select(article => new
 
                {
 
                    title = article.Headline,
 
                    source = article.Source ?? "Unknown",
 
                    publishedAt = DateTimeOffset.FromUnixTimeSeconds(article.Datetime).UtcDateTime,
 
                    url = article.Url
 
                });
 
                _logger.LogInformation("Successfully fetched latest news.");
 
                return Ok(simplifiedNews);
 
            }
 
            catch (Exception ex)
 
            {
 
                _logger.LogError(ex, Stable.InternalServerError);
 
                return StatusCode(500, new { error = Stable.InternalServerError, message = ex.Message });
 
            }
 
        }
 
        [HttpGet("details/{symbol}")]
 
        public async Task<IActionResult> GetStockDetails(string symbol)
 
        {
 
            try
 
            {
 
                var stock = await FetchStockDetails(symbol);
 
                return Ok(stock);
 
            }
 
            catch (Exception ex)
 
            {
 
                _logger.LogError(ex, "Error fetching stock details for {Symbol}", symbol);
 
                return StatusCode(500, new { error = Stable.InternalServerError, message = ex.Message });
 
            }
 
        }
 
        private async Task<dynamic> FetchStockDetails(string symbol)
 
        {
 
            var client = _httpClientFactory.CreateClient();
 
            var apiKey = _configuration["Finnhub:ApiKey"];
 
            var baseUrl = _configuration["Finnhub:BaseUrl"];
 
            if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(baseUrl))
 
            {
 
                throw new Exception(Stable.ApiConfigurationMissing);
 
            }
 
            var quoteUrl = $"{baseUrl}{Stable.StockQuoteEndpoint}{symbol}&token={apiKey}";
 
            var quoteResponse = await client.GetAsync(quoteUrl);
 
            if (!quoteResponse.IsSuccessStatusCode)
 
            {
 
                throw new Exception($"Failed to fetch quote for {symbol}");
 
            }
 
            var quoteBody = await quoteResponse.Content.ReadAsStringAsync();
 
            var quoteJson = JsonDocument.Parse(quoteBody);
 
            var profileUrl = $"{baseUrl}{Stable.StockProfileEndpoint}{symbol}&token={apiKey}";
 
            var profileResponse = await client.GetFromJsonAsync<JsonDocument>(profileUrl);
 
            return new
 
            {
 
                symbol = symbol,
 
                name = profileResponse.RootElement.TryGetProperty("name", out var n) ? n.GetString() : null,
 
                currentPrice = quoteJson.RootElement.GetProperty("c").GetDecimal(),
 
                change = quoteJson.RootElement.GetProperty("d").GetDecimal(),
 
                changePercent = quoteJson.RootElement.GetProperty("dp").GetDecimal(),
 
                previousClose = quoteJson.RootElement.GetProperty("pc").GetDecimal(),
 
                high = quoteJson.RootElement.GetProperty("h").GetDecimal(),
 
                low = quoteJson.RootElement.GetProperty("l").GetDecimal(),
 
                open = quoteJson.RootElement.GetProperty("o").GetDecimal(),
 
                timestamp = DateTimeOffset.FromUnixTimeSeconds(quoteJson.RootElement.GetProperty("t").GetInt64()).DateTime.ToString("o"),
 
                logo = profileResponse.RootElement.TryGetProperty("logo", out var l) ? l.GetString() : null,
 
                exchange = profileResponse.RootElement.TryGetProperty("exchange", out var e) ? e.GetString() : null
 
            };
 
        }
 [HttpGet("chart/{symbol}")]
 
        public async Task<IActionResult> GetStockChartData(string symbol)
 
        {
 
            if (string.IsNullOrWhiteSpace(symbol))
 
            {
 
                _logger.LogWarning(Stable.SymbolCannotBeNull);
 
                return BadRequest(new { error = Stable.SymbolCannotBeNull });
 
            }
 
            try
 
            {
 
                var client = _httpClientFactory.CreateClient();
 
                var apiKey = _configuration["RapidAPI:Key"];
 
                var apiHost = _configuration["RapidAPI:Host"];
 
                var baseUrl = _configuration["RapidAPI:BaseUrl"];
 
                if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiHost) || string.IsNullOrEmpty(baseUrl))
 
                {
 
                    _logger.LogError(Stable.ApiConfigurationMissing);
 
                    return StatusCode(500, new { error = Stable.ApiConfigurationMissing });
 
                }
 
                var url = $"{baseUrl}{Stable.StockChartEndpoint}{symbol}&interval={Stable.ChartInterval}&range={Stable.ChartRange}&region={Stable.ChartRegion}";
 
                var request = new HttpRequestMessage(HttpMethod.Get, url);
 
                request.Headers.Add(Stable.RapidApiKeyHeader, apiKey);
 
                request.Headers.Add(Stable.RapidApiHostHeader, apiHost);
 
                var response = await client.SendAsync(request);
 
                if (!response.IsSuccessStatusCode)
 
                {
 
                    _logger.LogError(Stable.FailedToFetchStockChartData);
 
                    return StatusCode((int)response.StatusCode, new { error = Stable.FailedToFetchStockChartData });
 
                }
 
                var content = await response.Content.ReadAsStringAsync();
 
                var json = JsonSerializer.Deserialize<object>(content);
 
                _logger.LogInformation("Successfully fetched stock chart data for symbol: {Symbol}", symbol);
 
                return Ok(json);
 
            }
 
            catch (HttpRequestException ex)
 
            {
 
                _logger.LogError(ex, Stable.InternalServerError);
 
                return StatusCode(500, new { error = Stable.InternalServerError, message = ex.Message });
 
            }
 
            catch (JsonException ex)
 
            {
 
                _logger.LogError(ex, Stable.InternalServerError);
 
                return StatusCode(500, new { error = Stable.InternalServerError, message = ex.Message });
 
            }
 
            catch (Exception ex)
 
            {
 
                _logger.LogError(ex, Stable.InternalServerError);
 
                return StatusCode(500, new { error = Stable.InternalServerError, message = ex.Message });
 
            }
 
        }
 
        [HttpGet("compare")]
 
        public async Task<IActionResult> CompareStocks(string stock1, string stock2)
 
        {
 
            try
 
            {
 
                var stockDetails1 = await FetchStockDetails(stock1);
 
                var stockDetails2 = await FetchStockDetails(stock2);
 
                if (stockDetails1 == null || stockDetails2 == null)
 
                {
 
                    return NotFound(new { error = "One or both of the stock symbols are invalid or unavailable." });
 
                }
 
                var comparisonResult = new
 
                {
 
                    stock1 = stockDetails1,
 
                    stock2 = stockDetails2
 
                };
 
                _logger.LogInformation("Successfully fetched and compared stocks: {Stock1} vs {Stock2}", stock1, stock2);
 
                return Ok(comparisonResult);
 
            }
 
            catch (Exception ex)
 
            {
 
                _logger.LogError(ex, "An error occurred while comparing stocks: {Stock1} and {Stock2}", stock1, stock2);
 
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
 
            }
 
        }
 
 
        [HttpGet("{symbol}/summary")]
 
public async Task<IActionResult> GetStockSummary(string symbol)
 
{
 
    try
 
    {
 
        // Validate symbol input
 
        if (string.IsNullOrWhiteSpace(symbol))
 
        {
 
            _logger.LogWarning("Stock symbol cannot be empty");
 
            return BadRequest(new { error = "Stock symbol cannot be empty" });
 
        }
 
        // Fetch stock details
 
        var stock = await FetchStockDetails(symbol);
 
        if (stock == null)
 
        {
 
            _logger.LogWarning("Stock details not found for symbol: {Symbol}", symbol);
 
            return NotFound(new { error = $"Stock details not found for symbol: {symbol}" });
 
        }
 
        // Generate summary using Cohere service
 
        var summary = await _cohereService.GenerateStockSummaryAsync(stock);
 
        if (string.IsNullOrWhiteSpace(summary))
 
        {
 
            _logger.LogError("Empty summary generated for symbol: {Symbol}", symbol);
 
            return StatusCode(500, new { error = "Failed to generate valid summary" });
 
        }
 
        // Format the response properly
 
        var response = new
 
        {
 
            Symbol = symbol.ToUpper(),
 
            Summary = summary.Trim(),
 
            Details = new
 
            {
 
                CurrentPrice = stock.currentPrice,
 
                ChangePercent = stock.changePercent,
 
                High = stock.high,
 
                Low = stock.low,
 
                Open = stock.open,
 
                PreviousClose = stock.previousClose
 
            },
 
            Timestamp = DateTime.UtcNow.ToString("o")
 
        };
 
        _logger.LogInformation("Successfully generated summary for symbol: {Symbol}", symbol);
 
        return Ok(response);
 
    }
 
    catch (Exception ex)
 
    {
 
        _logger.LogError(ex, "Failed to generate summary for stock: {Symbol}", symbol);
 
        return StatusCode(500, new {
 
            error = "Failed to generate stock summary",
 
            message = ex.Message,
 
            symbol = symbol
 
        });
 
    }
 
}
 
 
    }
 
}
 
 