const CACHE_NAME = "civicpulse-pwa-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json"
];

// IndexedDB Helper for Offline Queuing
const DB_NAME = "civicpulse-offline-db";
const DB_VERSION = 2;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("offline-ai-requests")) {
        db.createObjectStore("offline-ai-requests", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("offline-submissions")) {
        db.createObjectStore("offline-submissions", { keyPath: "id" });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

function saveToIndexedDB(storeName, data) {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  });
}

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching offline assets");
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Cleaning old cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Intercept analyze-grievance POST requests for offline queuing
  if (event.request.method === "POST" && requestUrl.pathname === "/api/analyze-grievance") {
    event.respondWith(
      fetch(event.request.clone())
        .catch(async () => {
          console.log("[Service Worker] Offline detected during AI analysis. Queuing request and returning mock response.");
          try {
            const requestData = await event.request.clone().json();
            
            // Save request to IndexedDB for offline queue tracking
            const queuedItem = {
              id: "queued-ai-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
              timestamp: new Date().toISOString(),
              payload: requestData,
              type: "analyze-grievance",
              status: "pending"
            };
            
            await saveToIndexedDB("offline-ai-requests", queuedItem);
            
            // Generate a smart, realistic mock AI analysis based on the text
            const description = requestData.description || "";
            const descLower = description.toLowerCase();
            const lat = requestData.userLatitude || 28.61;
            const lng = requestData.userLongitude || 77.23;
            
            let category = "Solid Waste";
            let suggested_dept = "MCD";
            let severity = "Medium";
            let urgency = 5;
            let keywords = ["offline", "queued"];
            
            if (descLower.includes("water") || descLower.includes("drain") || descLower.includes("flood") || descLower.includes("clog") || descLower.includes("sewer")) {
              category = "Drainage Overflow";
              suggested_dept = "Delhi Jal Board";
              severity = "High";
              urgency = 8;
              keywords.push("waterlogging", "drainage");
            } else if (descLower.includes("road") || descLower.includes("pothole") || descLower.includes("street") || descLower.includes("infrastructure")) {
              category = "Potholes & Roads";
              suggested_dept = "PWD Delhi";
              severity = "Medium";
              urgency = 6;
              keywords.push("pothole", "roadrepair");
            } else if (descLower.includes("garbage") || descLower.includes("waste") || descLower.includes("trash") || descLower.includes("dump") || descLower.includes("clean")) {
              category = "Solid Waste";
              suggested_dept = "MCD Sanitary Team";
              severity = "Low";
              urgency = 4;
              keywords.push("garbage", "sanitation");
            }
            
            const mockAIResult = {
              isGenuine: true,
              category: category,
              severity: severity,
              urgency: urgency,
              cleanLocation: requestData.userLatitude ? `CP Area (GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)})` : "Connaught Place, New Delhi",
              summary: `Offline Queued: ${description.substring(0, 45)}...`,
              latitude: lat,
              longitude: lng,
              isSuggestion: requestData.isSuggestion || false,
              confidence: 90,
              keywords: keywords,
              detectedLanguage: "English",
              imageVerificationStatus: requestData.imageData ? "verified" : "not_attached",
              imageVerificationMessage: requestData.imageData ? "Offline image saved" : "No photo attached",
              guardrailRelevanceScore: 1.0,
              guardrailFlaggedReason: "NONE",
              guardrailResolvedCategory: "Garbage",
              guardrailExecutiveSummary: description,
              isOfflineQueued: true
            };
            
            return new Response(JSON.stringify(mockAIResult), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            });
          } catch (err) {
            console.error("[Service Worker] Failed to handle offline AI mock:", err);
            return new Response(JSON.stringify({ error: "Offline mode failed to initialize local queue." }), {
              status: 503,
              headers: { "Content-Type": "application/json" }
            });
          }
        })
    );
    return;
  }

  // Skip caching for backend API and Firebase queries
  if (requestUrl.pathname.startsWith("/api") || requestUrl.hostname.includes("firestore") || requestUrl.hostname.includes("firebase")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful GET requests of same origin
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          event.request.method === "GET" &&
          requestUrl.origin === self.location.origin
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if network fails (offline mode)
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If no cache, return basic offline placeholder for index.html if appropriate
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
        });
      })
  );
});
