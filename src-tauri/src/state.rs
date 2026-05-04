use parking_lot::Mutex;
use serde::Serialize;
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, AtomicU32, AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

const REFRESH_WINDOW_SECS: u64 = 180;

#[derive(Clone, Serialize)]
pub struct CacheEntry {
    pub data: serde_json::Value,
    pub fetched_at: String,
}

pub struct AppState {
    inner: Mutex<HashMap<String, (serde_json::Value, Instant, String)>>,
    last_total_tokens: AtomicU64,
    delta_tokens: AtomicU64,
    estimated_window_tokens: AtomicU64,
    samples_observed: AtomicU32,
    animate_enabled: AtomicBool,
    // 0 = cube, 1 = cat
    animation_style: AtomicU32,
    // Bumped from JS while a system dialog (ask/message) is in flight so the
    // blur-to-hide window handler doesn't dismiss the menubar window when the
    // dialog steals focus.
    suppress_blur_hide: AtomicU32,
}

impl AppState {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            inner: Mutex::new(HashMap::new()),
            last_total_tokens: AtomicU64::new(0),
            delta_tokens: AtomicU64::new(0),
            estimated_window_tokens: AtomicU64::new(0),
            samples_observed: AtomicU32::new(0),
            animate_enabled: AtomicBool::new(true),
            animation_style: AtomicU32::new(1),
            suppress_blur_hide: AtomicU32::new(0),
        })
    }

    pub fn push_suppress_blur_hide(&self) {
        self.suppress_blur_hide.fetch_add(1, Ordering::SeqCst);
    }

    pub fn pop_suppress_blur_hide(&self) {
        let prev = self.suppress_blur_hide.load(Ordering::SeqCst);
        if prev > 0 {
            self.suppress_blur_hide.fetch_sub(1, Ordering::SeqCst);
        }
    }

    pub fn should_suppress_blur_hide(&self) -> bool {
        self.suppress_blur_hide.load(Ordering::SeqCst) > 0
    }

    pub fn set_animation_style(&self, style: u32) {
        self.animation_style.store(style, Ordering::SeqCst);
    }

    pub fn animation_style(&self) -> u32 {
        self.animation_style.load(Ordering::SeqCst)
    }

    pub fn get(&self, year: &str, max_age: Duration) -> Option<CacheEntry> {
        let guard = self.inner.lock();
        guard.get(year).and_then(|(d, t, ts)| {
            if t.elapsed() <= max_age {
                Some(CacheEntry {
                    data: d.clone(),
                    fetched_at: ts.clone(),
                })
            } else {
                None
            }
        })
    }

    pub fn put(&self, year: String, data: serde_json::Value) -> CacheEntry {
        let now_iso = chrono::Utc::now().to_rfc3339();
        let current_year = chrono::Local::now().format("%Y").to_string();
        if year == current_year {
            if let Some(total) = data
                .get("summary")
                .and_then(|s| s.get("totalTokens"))
                .and_then(|v| v.as_u64())
            {
                self.update_delta(total);
            }
            let today_tokens = extract_today_tokens(&data);
            self.estimated_window_tokens
                .store(estimate_window(today_tokens), Ordering::SeqCst);
        }
        let mut guard = self.inner.lock();
        guard.insert(year.clone(), (data.clone(), Instant::now(), now_iso.clone()));
        CacheEntry {
            data,
            fetched_at: now_iso,
        }
    }

    fn update_delta(&self, new_total: u64) {
        let prev = self.last_total_tokens.swap(new_total, Ordering::SeqCst);
        let prior_samples = self.samples_observed.fetch_add(1, Ordering::SeqCst);
        if prior_samples == 0 {
            self.delta_tokens.store(0, Ordering::SeqCst);
            return;
        }
        let d = new_total.saturating_sub(prev);
        self.delta_tokens.store(d, Ordering::SeqCst);
    }

    pub fn current_level(&self) -> u8 {
        let samples = self.samples_observed.load(Ordering::SeqCst);
        let signal = if samples >= 2 {
            self.delta_tokens.load(Ordering::SeqCst)
        } else if samples == 1 {
            self.estimated_window_tokens.load(Ordering::SeqCst)
        } else {
            0
        };
        bucket(signal)
    }

    pub fn set_animate_enabled(&self, enabled: bool) {
        self.animate_enabled.store(enabled, Ordering::SeqCst);
    }

    pub fn is_animate_enabled(&self) -> bool {
        self.animate_enabled.load(Ordering::SeqCst)
    }

    pub fn known_years(&self) -> Vec<String> {
        self.inner.lock().keys().cloned().collect()
    }
}

fn bucket(signal: u64) -> u8 {
    if signal == 0 {
        0
    } else if signal < 50_000 {
        1
    } else if signal < 250_000 {
        2
    } else if signal < 1_000_000 {
        3
    } else {
        4
    }
}

fn extract_today_tokens(data: &serde_json::Value) -> u64 {
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let contributions = match data.get("contributions").and_then(|v| v.as_array()) {
        Some(c) => c,
        None => return 0,
    };
    for entry in contributions {
        let date = entry.get("date").and_then(|v| v.as_str()).unwrap_or("");
        if date == today {
            return entry
                .get("totals")
                .and_then(|t| t.get("tokens"))
                .and_then(|v| v.as_u64())
                .unwrap_or(0);
        }
    }
    0
}

fn estimate_window(today_tokens: u64) -> u64 {
    if today_tokens == 0 {
        return 0;
    }
    let now = chrono::Local::now();
    let midnight = match now.date_naive().and_hms_opt(0, 0, 0) {
        Some(m) => m,
        None => return today_tokens,
    };
    let elapsed = (now.naive_local() - midnight).num_seconds();
    let elapsed = elapsed.max(REFRESH_WINDOW_SECS as i64) as u64;
    today_tokens.saturating_mul(REFRESH_WINDOW_SECS) / elapsed
}
