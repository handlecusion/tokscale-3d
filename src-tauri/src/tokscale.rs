use std::ffi::OsString;
use std::path::{Path, PathBuf};
use std::process::Command;

const SEARCH_PATHS: &[&str] = &[
    "/opt/homebrew/bin/tokscale",
    "/usr/local/bin/tokscale",
];

const MIN_VERSION: (u32, u32, u32) = (2, 0, 0);
const NOT_FOUND_HINT: &str =
    "tokscale CLI not found. Install with: brew install junhoyeo/tokscale/tokscale";

fn locate() -> Option<PathBuf> {
    for p in SEARCH_PATHS {
        let path = Path::new(p);
        if path.exists() {
            return Some(path.to_path_buf());
        }
    }
    if let Some(home) = std::env::var_os("HOME") {
        let cargo = PathBuf::from(home).join(".cargo/bin/tokscale");
        if cargo.exists() {
            return Some(cargo);
        }
    }
    // Fall back to a bare name and let the OS resolve via PATH.
    Some(PathBuf::from("tokscale"))
}

// macOS GUI apps launched via LaunchServices inherit a minimal PATH
// (/usr/bin:/bin:/usr/sbin:/sbin) — neither Homebrew nor the user's shell
// PATH is in scope. tokscale's #!/usr/bin/env node shebang then fails to
// resolve `node` and exits 127. Augment PATH with the common locations
// where node ends up so the spawned tokscale process can find its
// interpreter.
fn augmented_path() -> OsString {
    let mut paths: Vec<String> = vec![
        "/opt/homebrew/bin".to_string(),
        "/opt/homebrew/sbin".to_string(),
        "/usr/local/bin".to_string(),
        "/usr/local/sbin".to_string(),
    ];
    if let Some(home) = std::env::var_os("HOME") {
        let home = home.to_string_lossy();
        paths.push(format!("{}/.cargo/bin", home));
        paths.push(format!("{}/.local/bin", home));
        paths.push(format!("{}/.volta/bin", home));
        paths.push(format!("{}/.fnm", home));
        paths.push(format!("{}/.nvm/versions/node", home));
    }
    if let Some(existing) = std::env::var_os("PATH") {
        for p in existing.to_string_lossy().split(':') {
            if !p.is_empty() && !paths.iter().any(|x| x == p) {
                paths.push(p.to_string());
            }
        }
    }
    OsString::from(paths.join(":"))
}

fn command(bin: &Path) -> Command {
    let mut cmd = Command::new(bin);
    cmd.env("PATH", augmented_path());
    cmd
}

fn parse_version(s: &str) -> Option<(u32, u32, u32)> {
    let token = s.trim().split_whitespace().last()?;
    let mut parts = token.split('.');
    let major = parts.next()?.parse().ok()?;
    let minor = parts.next()?.parse().ok()?;
    let patch = parts.next().unwrap_or("0").parse().ok()?;
    Some((major, minor, patch))
}

pub fn version() -> Result<(u32, u32, u32), String> {
    let bin = locate().ok_or_else(|| NOT_FOUND_HINT.to_string())?;
    let out = command(&bin).arg("--version").output().map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            NOT_FOUND_HINT.to_string()
        } else {
            format!("spawn tokscale failed: {}", e)
        }
    })?;
    let s = String::from_utf8_lossy(&out.stdout).to_string();
    parse_version(&s).ok_or_else(|| format!("could not parse tokscale version: {:?}", s.trim()))
}

pub fn run(year: &str) -> Result<serde_json::Value, String> {
    let bin = locate().ok_or_else(|| NOT_FOUND_HINT.to_string())?;
    let mut args: Vec<&str> = vec!["graph", "--no-spinner"];
    if !year.is_empty() {
        args.push("--year");
        args.push(year);
    }
    let out = command(&bin).args(&args).output().map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            NOT_FOUND_HINT.to_string()
        } else {
            format!("spawn tokscale failed: {}", e)
        }
    })?;
    if !out.status.success() {
        let detected = version()
            .map(|(a, b, c)| format!("{}.{}.{}", a, b, c))
            .unwrap_or_else(|_| "unknown".to_string());
        return Err(format!(
            "tokscale (v{}) exited with {}: {}",
            detected,
            out.status,
            String::from_utf8_lossy(&out.stderr)
        ));
    }
    let s = String::from_utf8(out.stdout).map_err(|e| format!("utf8: {}", e))?;
    let json = serde_json::from_str::<serde_json::Value>(&s).map_err(|e| {
        let detected = version()
            .map(|(a, b, c)| format!("{}.{}.{}", a, b, c))
            .unwrap_or_else(|_| "unknown".to_string());
        format!(
            "could not parse tokscale output (v{}): {} — try `brew upgrade tokscale`",
            detected, e
        )
    })?;
    Ok(json)
}

#[derive(serde::Serialize)]
pub struct TokscaleInfo {
    pub path: String,
    pub version: Option<String>,
    pub min_version: String,
    pub outdated: bool,
}

pub fn info() -> TokscaleInfo {
    let path = locate()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();
    let (version_str, outdated) = match version() {
        Ok(v) => {
            let outdated = v < MIN_VERSION;
            (Some(format!("{}.{}.{}", v.0, v.1, v.2)), outdated)
        }
        Err(_) => (None, false),
    };
    TokscaleInfo {
        path,
        version: version_str,
        min_version: format!("{}.{}.{}", MIN_VERSION.0, MIN_VERSION.1, MIN_VERSION.2),
        outdated,
    }
}
