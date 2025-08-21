using System.Text.Json.Serialization; // Object to JSON
using Microsoft.AspNetCore.Authentication.JwtBearer; // JWT-based authentication
using Microsoft.IdentityModel.Tokens; // Validate JWT tokens
using System.Text; // Encode security keys for JWT authentication
using t2.Services; // Custom service for JWT
using t2.Middleware; // Middleware for global exception handling
using Microsoft.ML;

var builder = WebApplication.CreateBuilder(args);

// "Key": "27bb3234a5msha3471c5e501041ep174ab7jsn773c37679921",

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull; // Ignore null values
        options.JsonSerializerOptions.PropertyNamingPolicy = null; // Preserve case
        options.JsonSerializerOptions.WriteIndented = true; // Format JSON outputs for readability
    });

// Manage HTTP client instances with a default timeout
builder.Services.AddHttpClient("DefaultClient", client =>
{
    client.Timeout = TimeSpan.FromSeconds(30); // Set a 30-second timeout for all HTTP requests
});

// Add authentication
builder.Services.AddAuthentication(x =>
{
    x.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(x =>
{
    x.RequireHttpsMetadata = !builder.Environment.IsDevelopment(); // Enable HTTPS metadata in production
    x.SaveToken = true; // Store the token
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero // Remove delay of token expiration
    };
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins(builder.Configuration["AllowedCorsOrigins"] ?? "http://localhost:4200") // Dynamically load allowed origins
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Add logging
builder.Services.AddLogging(loggingBuilder =>
{
    loggingBuilder.AddConsole();
    loggingBuilder.AddDebug();
});

// Add JWTService as scoped dependency
builder.Services.AddScoped<JWTService>();

builder.Services.AddScoped<ICohereService,CohereService>();
    builder.Services.AddScoped<StockPredictionService>();
    builder.Services.AddSingleton<MLContext>();
 


// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseRouting();

app.UseCors("AllowAngularApp");

app.UseAuthentication();
app.UseAuthorization();

// Use global error-handling middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.MapControllers();

app.Run();