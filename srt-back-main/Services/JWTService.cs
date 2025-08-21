using t2.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System;


namespace t2.Services{

    public class JWTService{
       
        private readonly IConfiguration _configuration;
 
        public JWTService(IConfiguration configuration)
        {
            _configuration = configuration;
        }
 
        public string CreateJWTToken(User user)
        {
            var jwtHandler = new JwtSecurityTokenHandler();
            var key =  Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]?? string.Empty);
            var identity = new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.Name, user.email),
                new Claim(ClaimTypes.Role, "User") // Add role claim if needed
            });
       
            var credentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = identity,
                Expires = DateTime.UtcNow.AddMinutes(10),
                SigningCredentials = credentials
            };
       
            var token = jwtHandler.CreateToken(tokenDescriptor); // Use jwtHandler
            return jwtHandler.WriteToken(token); // Use jwtHandler
        }
    }
}