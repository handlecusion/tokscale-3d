use std::process::Command;

const PRIMARY_BIN: &str = "/opt/homebrew/bin/tokscale";
const FALLBACK_BIN: &str = "tokscale";

pub fn run(year: &str) -> Result<serde_json::Value, String> {
    let mut args: Vec<&str> = vec!["graph", "--no-spinner"];
    if !year.is_empty() {
        args.push("--year");
        args.push(year);
    }
    let out = Command::new(PRIMARY_BIN)
        .args(&args)
        .output()
        .or_else(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                Command::new(FALLBACK_BIN).args(&args).output()
            } else {
                Err(e)
            }
        })
        .map_err(|e| format!("spawn tokscale failed: {}", e))?;
    if !out.status.success() {
        return Err(format!(
            "tokscale exited with {}: {}",
            out.status,
            String::from_utf8_lossy(&out.stderr)
        ));
    }
    let s = String::from_utf8(out.stdout).map_err(|e| format!("utf8: {}", e))?;
    serde_json::from_str::<serde_json::Value>(&s).map_err(|e| format!("json: {}", e))
}
