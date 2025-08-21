using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.IO;
using t2.Models;
using t2.Services;
using t2.Common; // Import the Stable class for constants

namespace t2.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly string _filePath;
        private readonly JWTService _jwtService;

        public AuthController(JWTService jwtService, IConfiguration configuration)
        {
            _jwtService = jwtService;
            _filePath = Path.Combine(Directory.GetCurrentDirectory(), "users.json");
        }

        // POST /auth/register
        [HttpPost("register")]
        public IActionResult Register([FromBody] User user)
        {
            if (string.IsNullOrWhiteSpace(user.email) || string.IsNullOrWhiteSpace(user.password))
            {
                return BadRequest(new { error = Stable.EmailAndPasswordRequired });
            }

            try
            {
                var users = LoadUsers();

                // Check if user already exists
                if (users.Any(u => u.email.Equals(user.email, StringComparison.OrdinalIgnoreCase)))
                {
                    return BadRequest(new { error = Stable.UserAlreadyExists });
                }

                users.Add(user);
                SaveUsers(users);

                return Ok(new { message = Stable.RegistrationSuccessful });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Stable.RegistrationError, message = ex.Message });
            }
        }

        // POST /auth/login
        [HttpPost("login")]
        public IActionResult Login([FromBody] User login)
        {
            if (string.IsNullOrWhiteSpace(login.email) || string.IsNullOrWhiteSpace(login.password))
            {
                return BadRequest(new { error = Stable.EmailAndPasswordRequired });
            }

            try
            {
                var users = LoadUsers();

                var user = users.FirstOrDefault(u => u.email.Equals(login.email, StringComparison.OrdinalIgnoreCase) && u.password == login.password);

                if (user == null)
                {
                    return Unauthorized(new { error = Stable.InvalidEmailOrPassword });
                }

                var token = _jwtService.CreateJWTToken(user);

                return Ok(new
                {
                    Token = token,
                    Message = Stable.LoginSuccessful
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = Stable.LoginError, message = ex.Message });
            }
        }

        // Load users from the file
        private List<User> LoadUsers()
        {
            try
            {
                if (!System.IO.File.Exists(_filePath))
                {
                    // If the file doesn't exist, return an empty list
                    return new List<User>();
                }

                var json = System.IO.File.ReadAllText(_filePath);
                return JsonSerializer.Deserialize<List<User>>(json) ?? new List<User>();
            }
            catch (Exception ex)
            {
                throw new Exception(Stable.LoadUsersError, ex);
            }
        }

        // Save users to the file
        private void SaveUsers(List<User> users)
        {
            try
            {
                var json = JsonSerializer.Serialize(users, new JsonSerializerOptions { WriteIndented = true });
                System.IO.File.WriteAllText(_filePath, json);
            }
            catch (Exception ex)
            {
                throw new Exception(Stable.SaveUsersError, ex);
            }
        }
    }
}