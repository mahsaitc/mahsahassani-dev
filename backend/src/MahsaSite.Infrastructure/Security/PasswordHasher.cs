using MahsaSite.Application.Abstractions;

namespace MahsaSite.Infrastructure.Security;

public class BcryptPasswordHasher : IPasswordHasher
{
    // Work factor 12: roughly a quarter-second per hash on typical VPS hardware,
    // which is tolerable for a login form and expensive for an offline attacker.
    private const int WorkFactor = 12;

    public string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);

    public bool Verify(string password, string hash)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            // A malformed stored hash must read as "wrong password", never as an
            // exception that would distinguish this account from a valid one.
            return false;
        }
    }
}
