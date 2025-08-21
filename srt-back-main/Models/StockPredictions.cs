using Microsoft.ML.Data;
public class StockPrediction
{
    [ColumnName("Score")]
    public float Close { get; set; }
}
 
 