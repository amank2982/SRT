using System.Threading.Tasks;

namespace t2.Services
{
    public interface ICohereService
    {
        Task<string> GenerateStockSummaryAsync(dynamic stock);
    }
}