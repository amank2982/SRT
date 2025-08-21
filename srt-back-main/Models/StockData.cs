using Microsoft.ML.Data;
public class StockData
{
    [LoadColumn(0)] public DateTime Date { get; set; }
    [LoadColumn(1)] public float Open { get; set; }
    [LoadColumn(2)] public float High { get; set; }
    [LoadColumn(3)] public float Low { get; set; }
    [LoadColumn(4)] public float Close { get; set; }
    [LoadColumn(5)] public float Volume { get; set; }
}
 
 