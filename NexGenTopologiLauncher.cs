using System;
using System.Diagnostics;
using System.IO;
using System.Threading;

class NexGenTopologiLauncher {
    static void Main() {
        string projectDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
            "Default Project", "archify-diagram-editor"
        );
        string batPath = Path.Combine(projectDir, "start-server.bat");
        Process.Start(new ProcessStartInfo {
            FileName = "cmd.exe",
            Arguments = "/c \"" + batPath + "\"",
            WorkingDirectory = projectDir,
            UseShellExecute = true,
            WindowStyle = ProcessWindowStyle.Minimized
        });
        Thread.Sleep(2500);
        Process.Start(new ProcessStartInfo {
            FileName = "http://localhost:8932",
            UseShellExecute = true
        });
    }
}
