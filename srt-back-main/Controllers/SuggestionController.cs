using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using t2.Common; // Import the Stable class for constants

namespace t2.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SuggestionController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<SuggestionController> _logger;

        public SuggestionController(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<SuggestionController> logger)
        {
            _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpGet("search")]
        public async Task<IActionResult> GetSuggestions(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                _logger.LogWarning(Stable.QueryParameterRequired);
                return BadRequest(new { error = Stable.QueryParameterRequired });
            }

            try
            {
                var client = _httpClientFactory.CreateClient();
                var token = _configuration["Finnhub:ApiKey"];
                var baseUrl = _configuration["Finnhub:BaseUrl"];

                if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(baseUrl))
                {
                    _logger.LogError(Stable.ApiConfigurationMissing);
                    return StatusCode(500, new { error = Stable.ApiConfigurationMissing });
                }

                var url = $"{baseUrl}{Stable.SuggestionsEndpoint}{query}&token={token}";
                var response = await client.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError(Stable.FailedToFetchSuggestions, response.StatusCode);
                    return StatusCode((int)response.StatusCode, new { error = Stable.FailedToFetchSuggestions });
                }

                var content = await response.Content.ReadAsStringAsync();

                if (string.IsNullOrWhiteSpace(content))
                {
                    _logger.LogWarning(Stable.EmptyApiResponse);
                    return StatusCode(500, new { error = Stable.EmptyApiResponse });
                }

                var json = JsonDocument.Parse(content);

                if (!json.RootElement.TryGetProperty("result", out var results) || results.ValueKind != JsonValueKind.Array)
                {
                    _logger.LogInformation(Stable.NoResultsFound, query);
                    return Ok(new List<object>());
                }

                var suggestions = results.EnumerateArray()
                    .Select(x =>
                    {
                        var hasSymbol = x.TryGetProperty("symbol", out var symbolProperty);
                        var hasDescription = x.TryGetProperty("description", out var descriptionProperty);

                        return new
                        {
                            symbol = hasSymbol ? symbolProperty.GetString() : null,
                            description = hasDescription ? descriptionProperty.GetString() : Stable.NoDescriptionAvailable
                        };
                    })
                    .Where(x => !string.IsNullOrWhiteSpace(x.symbol))
                    .ToList();

                _logger.LogInformation(Stable.SuggestionsFetchedSuccessfully, query);
                return Ok(suggestions);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, Stable.HttpRequestError, query);
                return StatusCode(500, new { error = Stable.HttpRequestError, message = ex.Message });
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, Stable.JsonParsingError, query);
                return StatusCode(500, new { error = Stable.JsonParsingError, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, Stable.UnexpectedError, query);
                return StatusCode(500, new { error = Stable.UnexpectedError, message = ex.Message });
            }
        }
    }
}