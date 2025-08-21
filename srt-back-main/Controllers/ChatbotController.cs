using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Collections.Generic;
 
namespace t2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatbotController : ControllerBase
    {
        public class ChatRequest
        {
            public string Message { get; set; }
        }
 
        public class ChatResponse
        {
            public string reply { get; set; }
        }
 
        private static readonly Dictionary<string, (decimal Current, decimal Low, decimal High)> StockData =
            new Dictionary<string, (decimal, decimal, decimal)>
        {
           { "AAPL", (195.27m, 193.3m, 202.0m) },
            { "AA",   (28.07m, 27.27m, 28.5m) },
            { "KO",   (71.77m, 70.695m, 71.965m) },
            { "NVDA", (131.29m, 127.85m, 133.25m) },
            { "GOOG", (169.59m, 169.0m, 174.0m) }
        };
 
        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.Message))
                return BadRequest(new ChatResponse { reply = "Please send a valid message." });
 
            var reply = await Task.FromResult(GetReply(request.Message));
            return Ok(new ChatResponse { reply = reply });
        }
 
        private string GetReply(string message)
        {
            var msg = message.ToLower().Trim();
 
            // --- Static Stock Data Handling ---
            foreach (var symbol in StockData.Keys)
            {
                if (Regex.IsMatch(msg, $@"\b(current price|price)\b.*\b{symbol.ToLower()}\b"))
                    return $"The current price of {symbol} is ${StockData[symbol].Current:F2}.";
 
                if (Regex.IsMatch(msg, $@"\b(today'?s?|day'?s?)\s+low\b.*\b{symbol.ToLower()}\b"))
                    return $"Today's low for {symbol} is ${StockData[symbol].Low:F2}.";
 
                if (Regex.IsMatch(msg, $@"\b(today'?s?|day'?s?)\s+high\b.*\b{symbol.ToLower()}\b"))
                    return $"Today's high for {symbol} is ${StockData[symbol].High:F2}.";
            }
 
            // --- Pattern Matching Rules ---
            if (Regex.IsMatch(msg, @"\b(hi|hello|hey|greetings)\b"))
                return "Hello! I'm Stoxy. How can I assist you today?";
 
            if (Regex.IsMatch(msg, @"\bhow are you\b"))
                return "I'm doing great, thanks for asking! How can Stoxy help you today?";
 
            if (Regex.IsMatch(msg, @"\bthank(s| you)\b"))
                return "You're welcome! Stoxy is happy to help.";
 
            if (Regex.IsMatch(msg, @"\bbye\b|\bgoodbye\b|\bsee you\b"))
                return "Goodbye! Stoxy is always here if you need help.";
 
            if (Regex.IsMatch(msg, @"\bwho are you\b|\bwhat is your name\b"))
                return "I'm Stoxy, your friendly stock research assistant bot.";
 
            if (Regex.IsMatch(msg, @"\bwhat can you do\b|\bhelp\b|\bsupport\b"))
                return "I'm Stoxy! I can assist you with stock info, comparisons, trending data, practice simulations, and navigating the app.";
 
            if (Regex.IsMatch(msg, @"\bhelp me\b|\bhow to use\b"))
                return "Just type a stock symbol in the search bar to get details, or ask Stoxy about trending stocks, news, comparisons, charts, or practice mode.";
 
            if (msg == "why")
                return "Please clarify your question so I can help better.";
 
            if (Regex.IsMatch(msg, @"\b(trending|top|popular)\s+(stocks|tickers)\b"))
                return "You can check trending stocks right on the dashboard.";
 
            if (Regex.IsMatch(msg, @"\b(news|latest updates|market news|stock news)\b"))
                return "Head over to the News section for the latest stock market updates using the navbar.";
 
            if (Regex.IsMatch(msg, @"\b(detail|info|information|overview)\s+(of|about)?\s*(stock|ticker)?\s*[a-z]{1,5}\b"))
                return "Just enter the stock symbol in the search box to view its details.";
 
            if (Regex.IsMatch(msg, @"\b(chart|graph|trend)\s+(of|for)?\s*\b[a-z]{1,5}\b"))
                return "Click on any stock to view its interactive chart with real-time data.";
 
            if (Regex.IsMatch(msg, @"\bcompare\b.*\b[a-z]{1,5}\b.*\b[a-z]{1,5}\b"))
                return "Use the compare feature to analyze two stocks side by side.";
 
            if (Regex.IsMatch(msg, @"\b(compare|comparison)\s+(stocks|tickers)?"))
                return "Click the Compare option to see a side-by-side analysis of two stocks.";
 
            if (Regex.IsMatch(msg, @"\b(practice|simulate|simulation|try|test)\s+(stocks|trading|investing)\b"))
                return "Use the Practice feature to simulate stock investments from a past date over a selected duration.";
 
            if (Regex.IsMatch(msg, @"\b(about|who made this|about us|creator|team)\b"))
                return "Visit the About Us page to learn more about the team behind Stoxy.";
 
            return "Sorry, Stoxy didn't quite catch that. Could you rephrase your question?";
        }
    }
}
 
 