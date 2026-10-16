import type { Express, RequestHandler } from "express";
import { z } from "zod";

export function registerFinderRoutes(app: Express, requireAuth: RequestHandler) {
  // === Confession Finder ===

  app.post('/api/confession-finder/search', requireAuth, async (req, res) => {
    const apiKey = process.env.MASSTIMES_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: "Confession finder is not configured. Please contact your administrator." });
    }

    const zipSchema = z.object({ zipCode: z.string().regex(/^\d{5}$/, "Please enter a valid 5-digit ZIP code.") });
    const parsed = zipSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid ZIP code." });
    }
    const { zipCode } = parsed.data;

    let latitude: number;
    let longitude: number;
    try {
      const geoRes = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
      if (!geoRes.ok) {
        return res.status(422).json({ message: "We could not find that ZIP code. Please check it and try again." });
      }
      const geoData = await geoRes.json() as { places?: Array<{ latitude?: string; longitude?: string }> };
      const place = geoData.places?.[0];
      if (!place?.latitude || !place?.longitude) {
        return res.status(422).json({ message: "We could not find that ZIP code. Please check it and try again." });
      }
      latitude = parseFloat(place.latitude);
      longitude = parseFloat(place.longitude);
    } catch {
      return res.status(502).json({ message: "Something went wrong while looking up your location. You can still check a parish website or ask your mentor for help." });
    }

    let churches: unknown[];
    try {
      const massUrl = `https://masstimes.org/Churchs/?lat=${latitude}&long=${longitude}&pg=1&apikey=${apiKey}`;
      const massRes = await fetch(massUrl, {
        headers: {
          'Referer': 'https://masstimes.org/',
          'Origin': 'https://masstimes.org',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0',
        },
      });
      if (!massRes.ok) {
        return res.status(502).json({ message: "Something went wrong while searching. You can still check a parish website or ask your mentor for help." });
      }
      const massData = await massRes.json();
      churches = Array.isArray(massData) ? massData : (Array.isArray((massData as Record<string, unknown>)?.churches) ? (massData as Record<string, unknown[]>).churches : []);
    } catch {
      return res.status(502).json({ message: "Something went wrong while searching. You can still check a parish website or ask your mentor for help." });
    }

    // Format a raw time string from the MassTimes API (e.g. "14:30:00" or "1/1/1900 12:00:00 AM") to "2:30 PM"
    function formatMassTime(raw: string): string {
      if (!raw) return "";
      // Placeholder value the API uses when there is no specific time
      if (raw.startsWith("1/1/1900")) return "";
      const match = raw.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
      if (!match) return raw;
      let hour = parseInt(match[1], 10);
      const min = match[2];
      const ampm = hour >= 12 ? "PM" : "AM";
      if (hour > 12) hour -= 12;
      if (hour === 0) hour = 12;
      return min === "00" ? `${hour} ${ampm}` : `${hour}:${min} ${ampm}`;
    }

    const CONFESSION_RE = /confession|reconciliation|penance/i;
    const resultsWithConfessionTimes: unknown[] = [];
    const nearbyParishesWithoutListedTimes: unknown[] = [];

    for (const raw of churches) {
      if (!raw || typeof raw !== "object") continue;
      const c = raw as Record<string, unknown>;
      const worshipTimes: unknown[] = Array.isArray(c.church_worship_times) ? c.church_worship_times : [];

      const confessionTimes = worshipTimes
        .filter((wt: unknown) => {
          if (!wt || typeof wt !== "object") return false;
          const t = wt as Record<string, unknown>;
          return CONFESSION_RE.test(String(t.service_typename || "")) || CONFESSION_RE.test(String(t.comment || ""));
        })
        .map((wt: unknown) => {
          const t = wt as Record<string, unknown>;
          // day_of_week is a full name string with trailing spaces (e.g. "Saturday  ")
          // "99" means perpetual / no specific day
          const rawDay = String(t.day_of_week || "").trim();
          const dayOfWeek = rawDay === "99" ? "By appointment" : rawDay;
          const timeStart = formatMassTime(String(t.time_start || ""));
          const timeEnd = formatMassTime(String(t.time_end || ""));
          return {
            dayOfWeek,
            timeStart,
            timeEnd: timeEnd || undefined,
            comment: t.comment ? String(t.comment).trim() : undefined,
          };
        });

      // Normalize website URL
      const rawUrl = c.url ? String(c.url).trim() : "";
      const website = rawUrl
        ? rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`
        : undefined;

      const parishData = {
        churchId: String(c.id ?? Math.random()),
        name: String(c.name ?? "Unknown Parish"),
        distance: parseFloat(String(c.distance ?? "0")) || 0,
        address: {
          street: c.church_address_street_address ? String(c.church_address_street_address) : undefined,
          city: c.church_address_city_name ? String(c.church_address_city_name) : undefined,
          state: c.church_address_providence_name ? String(c.church_address_providence_name) : undefined,
          postalCode: c.church_address_postal_code ? String(c.church_address_postal_code) : undefined,
        },
        phone: c.phone_number ? String(c.phone_number).trim() : undefined,
        website,
        latitude: parseFloat(String(c.latitude ?? "")),
        longitude: parseFloat(String(c.longitude ?? "")),
        confessionTimes,
        source: "MassTimes",
      };

      if (confessionTimes.length > 0) {
        resultsWithConfessionTimes.push(parishData);
      } else {
        nearbyParishesWithoutListedTimes.push(parishData);
      }
    }

    res.json({ searchLocation: { zipCode, latitude, longitude }, resultsWithConfessionTimes, nearbyParishesWithoutListedTimes });
  });

  app.post('/api/adoration-finder/search', requireAuth, async (req, res) => {
    const apiKey = process.env.MASSTIMES_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: "Adoration finder is not configured. Please contact your administrator." });
    }

    const zipSchema = z.object({ zipCode: z.string().regex(/^\d{5}$/, "Please enter a valid 5-digit ZIP code.") });
    const parsed = zipSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid ZIP code." });
    }
    const { zipCode } = parsed.data;

    let latitude: number;
    let longitude: number;
    try {
      const geoRes = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
      if (!geoRes.ok) {
        return res.status(422).json({ message: "We could not find that ZIP code. Please check it and try again." });
      }
      const geoData = await geoRes.json() as { places?: Array<{ latitude?: string; longitude?: string }> };
      const place = geoData.places?.[0];
      if (!place?.latitude || !place?.longitude) {
        return res.status(422).json({ message: "We could not find that ZIP code. Please check it and try again." });
      }
      latitude = parseFloat(place.latitude);
      longitude = parseFloat(place.longitude);
    } catch {
      return res.status(502).json({ message: "Something went wrong while looking up your location. Please try again." });
    }

    let churches: unknown[];
    try {
      const massUrl = `https://masstimes.org/Churchs/?lat=${latitude}&long=${longitude}&pg=1&apikey=${apiKey}`;
      const massRes = await fetch(massUrl, {
        headers: {
          'Referer': 'https://masstimes.org/',
          'Origin': 'https://masstimes.org',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0',
        },
      });
      if (!massRes.ok) {
        return res.status(502).json({ message: "Something went wrong while searching. Please try again." });
      }
      const massData = await massRes.json();
      churches = Array.isArray(massData) ? massData : (Array.isArray((massData as Record<string, unknown>)?.churches) ? (massData as Record<string, unknown[]>).churches : []);
    } catch {
      return res.status(502).json({ message: "Something went wrong while searching. Please try again." });
    }

    function formatMassTime(raw: string): string {
      if (!raw) return "";
      if (raw.startsWith("1/1/1900")) return "";
      const match = raw.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
      if (!match) return raw;
      let hour = parseInt(match[1], 10);
      const min = match[2];
      const ampm = hour >= 12 ? "PM" : "AM";
      if (hour > 12) hour -= 12;
      if (hour === 0) hour = 12;
      return min === "00" ? `${hour} ${ampm}` : `${hour}:${min} ${ampm}`;
    }

    const ADORATION_RE = /adoration|eucharistic|benediction/i;
    const resultsWithAdorationTimes: unknown[] = [];
    const nearbyParishesWithoutListedTimes: unknown[] = [];

    for (const raw of churches) {
      if (!raw || typeof raw !== "object") continue;
      const c = raw as Record<string, unknown>;
      const worshipTimes: unknown[] = Array.isArray(c.church_worship_times) ? c.church_worship_times : [];

      const adorationTimes = worshipTimes
        .filter((wt: unknown) => {
          if (!wt || typeof wt !== "object") return false;
          const t = wt as Record<string, unknown>;
          return ADORATION_RE.test(String(t.service_typename || "")) || ADORATION_RE.test(String(t.comment || ""));
        })
        .map((wt: unknown) => {
          const t = wt as Record<string, unknown>;
          const rawDay = String(t.day_of_week || "").trim();
          const dayOfWeek = rawDay === "99" ? "Perpetual (24/7)" : rawDay;
          const timeStart = formatMassTime(String(t.time_start || ""));
          const timeEnd = formatMassTime(String(t.time_end || ""));
          return {
            dayOfWeek,
            timeStart,
            timeEnd: timeEnd || undefined,
            comment: t.comment ? String(t.comment).trim() : undefined,
          };
        });

      const rawUrl = c.url ? String(c.url).trim() : "";
      const website = rawUrl ? (rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`) : undefined;

      const parishData = {
        churchId: String(c.id ?? Math.random()),
        name: String(c.name ?? "Unknown Parish"),
        distance: parseFloat(String(c.distance ?? "0")) || 0,
        address: {
          street: c.church_address_street_address ? String(c.church_address_street_address) : undefined,
          city: c.church_address_city_name ? String(c.church_address_city_name) : undefined,
          state: c.church_address_providence_name ? String(c.church_address_providence_name) : undefined,
          postalCode: c.church_address_postal_code ? String(c.church_address_postal_code) : undefined,
        },
        phone: c.phone_number ? String(c.phone_number).trim() : undefined,
        website,
        adorationTimes,
        source: "MassTimes",
      };

      if (adorationTimes.length > 0) {
        resultsWithAdorationTimes.push(parishData);
      } else {
        nearbyParishesWithoutListedTimes.push(parishData);
      }
    }

    res.json({ searchLocation: { zipCode, latitude, longitude }, resultsWithAdorationTimes, nearbyParishesWithoutListedTimes });
  });
}
