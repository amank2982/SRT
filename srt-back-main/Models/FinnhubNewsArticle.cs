using System.Text.Json.Serialization;

namespace t2.Models
{
    public class FinnhubNewsArticle
    {
        [JsonPropertyName("headline")]
        public string Headline { get; set; }

        [JsonPropertyName("source")]
        public string Source { get; set; }

        [JsonPropertyName("datetime")]
        public long Datetime { get; set; }

        [JsonPropertyName("url")]
        public string Url { get; set; }
    }
}