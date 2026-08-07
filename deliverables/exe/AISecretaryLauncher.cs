using System;
using System.Diagnostics;

namespace AISecretaryLauncher
{
    internal static class Program
    {
        private const string Url = "https://futhea136-ux.github.io/AI-/";

        private static int Main(string[] args)
        {
            if (args.Length > 0 && args[0] == "--self-test")
            {
                Console.WriteLine("AI Secretary Launcher OK: " + Url);
                return 0;
            }

            Process.Start(new ProcessStartInfo
            {
                FileName = Url,
                UseShellExecute = true
            });
            return 0;
        }
    }
}
