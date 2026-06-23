# Supabase Database — Airportronics Charges Intelligence

## Overview

This database powers the **Airportronics Charges & Tariff Database** — a structured system for modeling, storing, and comparing the fees that airports levy on airlines for each flight operation. It standardizes diverse real-world charging methodologies into a common queryable format.

---

## Tables

### `airports` — 4,145 rows

Global airport registry covering 236 countries/territories.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `icao_code` | varchar | ICAO identifier (e.g. EGLL) |
| `iata_code` | varchar | IATA code (e.g. LHR), nullable |
| `name` | text | Full airport name |
| `country` | varchar | ISO 3166-1 alpha-2 (e.g. GB) |
| `city` | text | City name |
| `latitude` | double | Latitude |
| `longitude` | double | Longitude |
| `aip_source_url` | text | Link to official AIP publication |
| `created_at` | timestamptz | Row creation time |
| `updated_at` | timestamptz | Last update time |

Top countries by airport count: US (623), CA (298), CN (245), RU (167), AU (156), BR (143), ID (116), IN (108), JP (85), MX (64).

### `charge_schedules` — 69 rows

Published fee schedules from official airport conditions-of-use documents.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `airport_id` | uuid (FK -> airports.id) | Which airport |
| `charge_type` | enum | landing, passenger, parking, noise, security, navigation, other |
| `name` | text | Human-readable schedule name |
| `description` | text | Detailed description of the charge |
| `currency` | varchar | Local currency (GBP, EUR, USD, etc.) |
| `effective_from` | date | Start of validity |
| `effective_to` | date | End of validity (nullable = open-ended) |
| `source_url` | text | Link to official source document |
| `source_document_path` | text | Currently all null |
| `created_at` | timestamptz | Row creation time |
| `updated_at` | timestamptz | Last update time |

### `charge_rules` — 69 rows (currently 1:1 with schedules)

Pricing formulas for each schedule. Schema supports multiple rules per schedule for future graduated/conditional tiers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `schedule_id` | uuid (FK -> charge_schedules.id) | Parent schedule |
| `condition_expr` | text | When this rule applies (default: `"true"`) |
| `formula_expr` | text | Tagged JSON pricing formula (see below) |
| `unit` | text | Currently all null |
| `min_value` | numeric | Currently all null |
| `max_value` | numeric | Currently all null |
| `notes` | text | Optional notes |
| `sort_order` | integer | For ordering multiple rules |

### `source_documents` — 0 rows (empty)

Designed for a document scraping/parsing pipeline — not yet populated.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `airport_id` | uuid (FK -> airports.id) | Which airport |
| `url` | text | Source URL |
| `file_path` | text | Local/storage path |
| `content_hash` | text | For change detection |
| `scraped_at` | timestamptz | When scraped |
| `parsed_at` | timestamptz | When parsed |
| `status` | text | Workflow status (default: `"pending"`) |

---

## Relationships

```
airports (1) ──> (N) charge_schedules (1) ──> (N) charge_rules
airports (1) ──> (N) source_documents
```

---

## 10 Airports with Charge Data

| Airport | IATA | ICAO | Country | Schedules | Currency |
|---------|------|------|---------|-----------|----------|
| Dubai International | DXB | OMDB | AE | 12 | AED |
| Stockholm-Arlanda | ARN | ESSA | SE | 10 | SEK |
| London Gatwick | LGW | EGKK | GB | 8 | GBP |
| Frankfurt Main | FRA | EDDF | DE | 7 | EUR |
| JFK International | JFK | KJFK | US | 7 | USD |
| London Heathrow | LHR | EGLL | GB | 6 | GBP |
| Dublin Airport | DUB | EIDW | IE | 6 | EUR |
| Sydney Kingsford Smith | SYD | YSSY | AU | 5 | AUD |
| Tokyo Haneda | HND | RJTT | JP | 5 | JPY |
| Singapore Changi | SIN | WSSS | SG | 3 | SGD |

---

## Charge Types

| Type | Count | Examples |
|------|-------|---------|
| `other` | 18 | Emissions (NOx, CO2), baggage, PRM assistance, federal inspection fees, AirTrain, fire service, aerobridge |
| `passenger` | 15 | Per-passenger departure charges, facility charges, service charges |
| `landing` | 12 | Runway/movement charges, takeoff charges, demand charges |
| `parking` | 10 | Apron/stand occupancy charges |
| `noise` | 6 | Noise surcharges (chapter-based, dB-based) |
| `security` | 6 | Security screening fees (government and airport-operator) |
| `navigation` | 2 | Terminal air navigation charges (Eurocontrol-style) |

---

## Formula DSL

The `formula_expr` field uses a **tagged JSON** format: `[tag] {json_payload}`. There are 8 formula types:

### `[per_pax]` — 25 rules (most common)
Per-passenger rates differentiated by category (domestic, international, European, transfer, transit, etc.).
```json
[per_pax] {"rates":{"originating_domestic":13.86,"originating_european":21.36,...},"remote_stand_rebate":-6.15}
```

### `[per_unit]` — 13 rules
Rate multiplied by a measurable unit (MTOW in tonnes/klbs, NOx/CO2 per LTO cycle, bags).
```json
[per_unit] {"rate":20.09,"basis":"nox_per_lto_kg"}
[per_unit] {"rate":5,"basis":"mtow_tonnes","rounding":"ceil_tonne"}
```

### `[time_based]` — 10 rules
Duration-dependent charges with free periods, per-period rates, tiers by aircraft size.
```json
[time_based] {"rates_per_15min":[{"type":"wide_body","rate":103.24,"free_pier_min":90}],"free_period":"21:00-05:59"}
```

### `[flat]` — 6 rules
Fixed fee per occurrence (no multiplier).
```json
[flat] {"amount":993.38}
```

### `[formula]` — 6 rules
Mathematical expressions (Eurocontrol power-of-0.7, noise dB calculations, emissions bonus/malus).
```json
[formula] {"expression":"2120.29 * pow(mtow_tonnes / 50, 0.7)"}
```

### `[lookup]` — 4 rules
Table-based lookups by category key (noise categories, noise chapters).
```json
[lookup] {"table":{"maximum":43336.5,"ultra_high":7222.76,...},"lookup_key":"noise_category"}
```

### `[tiered]` — 4 rules
Graduated rate brackets (cumulative or marginal) by MTOW or noise level.
```json
[tiered] {"tiers":[{"from":0,"to":50,"rate":13.3},{"from":50,"to":100,"rate":15.4,"base":665}],"basis":"mtw_tonnes","cumulative":true}
```

### `[area_based]` — 1 rule
Area-calculated parking (wingspan x length). Only used at Changi.
```json
[area_based] {"tiers":[{"max_sqm":1000,"rate":50},...],"free_hours_pax":3}
```

---

## Condition Expressions

Most rules (58/69) use `"true"` (unconditional). Conditional rules handle:
- Weight thresholds: `mtow_tonnes >= 5.7`, `mtow_tonnes > 9`, `mtow_tonnes > 10`
- Flight type: `flight_type = international`, `flight_type == cargo`
- Aircraft category: `narrow_body`, `wide_body`, `integrator`
- Noise thresholds: `noise_pndb > 112`

---

## Known Gaps

1. **Coverage**: Only 10 of 4,145 airports (0.24%) have charge data. Major missing hubs: CDG, AMS, MAD, IST, HKG, ICN, PEK, LAX, ORD, ATL, DOH, MUC, ZRH.
2. **source_documents table is empty**: Scraping/parsing pipeline not yet active.
3. **`unit`, `min_value`, `max_value` in charge_rules unused**: Min/max are encoded inside formula_expr JSON instead.
4. **Inconsistent condition_expr syntax**: Both `=` and `==` used for equality.
5. **Missing charge types at some airports**: SIN has only 3 types, SYD has no noise charges recorded.
