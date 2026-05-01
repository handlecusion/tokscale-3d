use parking_lot::Mutex;
use serde::Serialize;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

#[derive(Clone, Serialize)]
pub struct CacheEntry {
    pub data: serde_json::Value,
    pub fetched_at: String,
}

pub struct AppState {
    inner: Mutex<HashMap<String, (serde_json::Value, Instant, String)>>,
}

impl AppState {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            inner: Mutex::new(HashMap::new()),
        })
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
        let mut guard = self.inner.lock();
        guard.insert(year.clone(), (data.clone(), Instant::now(), now_iso.clone()));
        CacheEntry {
            data,
            fetched_at: now_iso,
        }
    }

    pub fn known_years(&self) -> Vec<String> {
        self.inner.lock().keys().cloned().collect()
    }
}
