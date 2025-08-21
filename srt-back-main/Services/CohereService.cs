//CohereService.cs

using System;

using System.Net.Http;

using System.Text;

using System.Text.Json;

using System.Threading.Tasks;

using Microsoft.Extensions.Configuration;

using t2.Models;
using t2.Services;
 
namespace t2.Services

{
    public class CohereService:ICohereService
    {

    private readonly HttpClient _httpClient;

    private readonly IConfiguration _configuration;
 
    public CohereService(HttpClient httpClient, IConfiguration configuration)

    {

        _httpClient = httpClient;

        _configuration = configuration;

    }
 
    public async Task<string> GenerateStockSummaryAsync(dynamic stock)

    {

        var apiKey = _configuration["Cohere:ApiKey"];

        if (string.IsNullOrEmpty(apiKey))

        {

            throw new Exception("Cohere API key is not configured.");

        }
 
        var prompt = $@"Summarize the following stock details in a simple and informative way:
 
Name: {stock.name}

Symbol: {stock.symbol}

Current Price: {stock.currentPrice}

Change: {stock.change} ({stock.changePercent}%)

Previous Close: {stock.previousClose}

High: {stock.high}

Low: {stock.low}

Open: {stock.open}

Exchange: {stock.exchange}";
 
        var payload = new

        {

            model = "command-r-plus",

            prompt = prompt,

            max_tokens = 100,

            temperature = 0.7

        };
 
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.cohere.ai/v1/generate")

        {

            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")

        };

        request.Headers.Add("Authorization", $"Bearer {apiKey}");
 
        var response = await _httpClient.SendAsync(request);

        if (!response.IsSuccessStatusCode)

        {

            var errorContent = await response.Content.ReadAsStringAsync();

            throw new Exception($"Failed to generate stock summary. Status Code: {response.StatusCode}. Details: {errorContent}");

        }
 
        var json = await response.Content.ReadAsStringAsync();

        var result = JsonSerializer.Deserialize<JsonElement>(json);

        return result.GetProperty("generations")[0].GetProperty("text").GetString()?.Trim();

    }

}
}
 