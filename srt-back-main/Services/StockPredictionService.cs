using Microsoft.ML;
 
using Microsoft.Extensions.Configuration;
 
using System.IO;
 
using t2.Models;
using Microsoft.ML.Data;
 
public class StockPredictionService
 
{
 
    private readonly MLContext _mlContext;
 
    private ITransformer _trainedModel;
 
    private readonly string _modelPath;
 
    private readonly string _csvFilePath;
 
    public StockPredictionService(IConfiguration configuration)
 
    {
 
        _mlContext = new MLContext();
 
        _modelPath = Path.Combine(Directory.GetCurrentDirectory(), "StockModel.zip");
 
        _csvFilePath = Path.Combine(Directory.GetCurrentDirectory(),
 
                                  configuration["StockDataSettings:CsvFilePath"]);
 
        // Load model if exists
 
        if (File.Exists(_modelPath))
 
        {
 
            _trainedModel = _mlContext.Model.Load(_modelPath, out _);
 
        }
 
    }
 
    public void TrainModel()
 
    {
 
        // Load data from CSV
 
        IDataView dataView = _mlContext.Data.LoadFromTextFile<StockData>(
 
            path: _csvFilePath,
 
            hasHeader: true,
 
            separatorChar: ',');
 
        // Split data (80% training, 20% testing)
 
        var trainTestSplit = _mlContext.Data.TrainTestSplit(dataView, testFraction: 0.2);
 
        // Build pipeline
 
        var pipeline = _mlContext.Transforms
 
            .Concatenate("Features",
 
                nameof(StockData.Open),
 
                nameof(StockData.High),
 
                nameof(StockData.Low),
 
                nameof(StockData.Volume))
 
            .Append(_mlContext.Regression.Trainers.LbfgsPoissonRegression(
 
                labelColumnName: nameof(StockData.Close)));
 
        // Train and save model
 
        _trainedModel = pipeline.Fit(trainTestSplit.TrainSet);
 
        _mlContext.Model.Save(_trainedModel, trainTestSplit.TrainSet.Schema, _modelPath);
 
        // Evaluate model
 
        var predictions = _trainedModel.Transform(trainTestSplit.TestSet);
 
        var metrics = _mlContext.Regression.Evaluate(predictions,
 
            labelColumnName: nameof(StockData.Close));
 
        Console.WriteLine($"Model trained. R² Score: {metrics.RSquared:0.##}");
 
    }
 
    public float Predict(StockPredictionInput input)
 
    {
 
        if (_trainedModel == null)
 
        {
 
            throw new InvalidOperationException("Model not trained. Call TrainModel first.");
 
        }
 
        var predictionEngine = _mlContext.Model
 
            .CreatePredictionEngine<StockData, StockPrediction>(_trainedModel);
 
        var stockData = new StockData
 
        {
 
            Open = input.Open,
 
            High = input.High,
 
            Low = input.Low,
 
            Volume = input.Volume
 
        };
 
        return predictionEngine.Predict(stockData).Close;
 
    }
 
    public RegressionMetrics EvaluateModel()
 
    {
 
        if (_trainedModel == null)
 
        {
 
            throw new InvalidOperationException("Model not trained. Call TrainModel first.");
 
        }
 
        IDataView dataView = _mlContext.Data.LoadFromTextFile<StockData>(
 
            path: _csvFilePath,
 
            hasHeader: true,
 
            separatorChar: ',');
 
        var trainTestSplit = _mlContext.Data.TrainTestSplit(dataView, testFraction: 0.2);
 
        var predictions = _trainedModel.Transform(trainTestSplit.TestSet);
 
        return _mlContext.Regression.Evaluate(predictions,
 
            labelColumnName: nameof(StockData.Close));
 
    }
 
}
 
 
 