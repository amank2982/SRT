using Microsoft.AspNetCore.Mvc;
 
using t2.Services;
 
using t2.Models;
 
using System.Threading.Tasks;
 
using System.Collections.Generic;
 
namespace t2.Controllers
 
{
using Microsoft.AspNetCore.Mvc;
 
[ApiController]
 
[Route("api/[controller]")]
 
public class StockPredictionController : ControllerBase
 
{
 
    private readonly StockPredictionService _predictionService;
 
    private readonly ILogger<StockPredictionController> _logger;
 
    public StockPredictionController(
 
        StockPredictionService predictionService,
 
        ILogger<StockPredictionController> logger)
 
    {
 
        _predictionService = predictionService;
 
        _logger = logger;
 
    }
 
    [HttpPost("train")]
 
    public IActionResult TrainModel()
 
    {
 
        try
 
        {
 
            _predictionService.TrainModel();
 
            var metrics = _predictionService.EvaluateModel();
 
            return Ok(new {
 
                message = "Model trained successfully",
 
                rSquared = metrics.RSquared,
 
                mae = metrics.MeanAbsoluteError
 
            });
 
        }
 
        catch (Exception ex)
 
        {
 
            _logger.LogError(ex, "Error training model");
 
            return StatusCode(500, new { error = ex.Message });
 
        }
 
    }
 
    [HttpPost("predict")]
 
    public IActionResult Predict([FromBody] StockPredictionInput input)
 
    {
 
        try
 
        {
 
            var prediction = _predictionService.Predict(input);
 
            return Ok(new { prediction });
 
        }
 
        catch (Exception ex)
 
        {
 
            _logger.LogError(ex, "Error making prediction");
 
            return BadRequest(new { error = ex.Message });
 
        }
 
    }
 
    [HttpGet("metrics")]
 
    public IActionResult GetMetrics()
 
    {
 
        try
 
        {
 
            var metrics = _predictionService.EvaluateModel();
 
            return Ok(new {
 
                rSquared = metrics.RSquared,
 
                mae = metrics.MeanAbsoluteError,
 
                mse = metrics.MeanSquaredError
 
            });
 
        }
 
        catch (Exception ex)
 
        {
 
            _logger.LogError(ex, "Error getting metrics");
 
            return BadRequest(new { error = ex.Message });
 
        }
 
    }
 
}
}
 
 