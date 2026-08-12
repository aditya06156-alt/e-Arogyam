# 🏥 e-Arogyam — Integrated Health Intelligence System

> **Gorakhpur District Pharmaceutical Cold-Chain Monitoring & Inventory Management Platform**

![e-Arogyam Banner](https://img.shields.io/badge/e--Arogyam-Gorakhpur%20District-0F2942?style=for-the-badge&logo=shield&logoColor=emerald)
![Next.js 14](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Neon PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=for-the-badge&logo=postgresql&logoColor=black)
![WebSocket](https://img.shields.io/badge/Realtime-Socket.io-010101?style=for-the-badge&logo=socketdotio)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## 📌 Executive Summary

**e-Arogyam** is an enterprise-grade, real-time pharmaceutical cold-chain compliance and inventory intelligence platform built specifically for **Gorakhpur District, Uttar Pradesh**. 

It protects temperature-sensitive vaccines and essential medicines (such as *Japanese Encephalitis, Polio, Covaxin, Insulin, and Anti-Malarials*) across key district healthcare facilities by integrating **live IoT thermal telemetry**, **automated breach response rules**, **Fast2SMS alerts**, **camera-based GS1 DataMatrix scanning**, and **offline-first transaction synchronization** backed by serverless **Neon PostgreSQL**.

---

## 🏛️ Monitored Facilities (Gorakhpur District)

| Facility ID | Healthcare Institution Name | Type | Key Disease / Program Focus |
|---|---|---|---|
| `fac-brd-01` | **BRD Medical College & Hospital, Gorakhpur** | Tertiary Hospital | Acute Encephalitis Syndrome (AES/JE), UIP Vaccines |
| `fac-aiims-02` | **AIIMS Gorakhpur** | Apex Medical Institute | Routine Immunization, Chronic Care, Cold Store |
| `fac-nscb-03` | **Netaji Subhash Chandra Bose District Hospital** | District Hospital | TB (RNTCP), Anti-Malarial & Emergency Stock |

---

## ✨ Core Features & Technical Capabilities

### 🔐 1. Role-Based Access Control (RBAC) & Secure Login
- **Role Scoping**: Access control separating **Chief District Admin** from individual **Facility Nodal Officers**.
- **Role Redirection**: Authenticated users are automatically routed to their scoped dashboard (`/admin` vs `/hospital/[facilityId]`).
- **Demo Autofill**: Quick 1-click login buttons for instant evaluation and demonstration.

### 📷 2. Real Camera GS1 DataMatrix & QR Barcode Scanner
- **Device Camera Scanner**: Integrated `html5-qrcode` engine allowing smartphone or laptop cameras to scan 2D DataMatrix and QR code labels on medicine boxes.
- **GS1 AI Parser**: Automatically decodes Application Identifiers:
  - `AI (01)` — GTIN / SKU
  - `AI (10)` — Batch Number
  - `AI (17)` — Expiration Date (`YYMMDD`)
  - `AI (21)` — Serial Number
- **Stock Movement Controls**: One-tap `INWARD (+qty)` receipt and `OUTWARD (-qty)` dispensing. Automatically blocks dispensing of `SPOILED` or expired batches.

### 📱 3. Offline-First Queue & Neon Database Sync
- **Local Storage Queue**: Works seamlessly without internet coverage by storing barcode scans in a local device queue (`localStorage`).
- **Idempotent Sync Engine**: On reconnecting, a single tap on **`SYNC QUEUE TO NEON DB`** pushes all queued transactions to the cloud database with duplicate-prevention locks.

### 🌡️ 4. Real-Time IoT Telemetry & Rule Engine
- **Live Thermal Streams**: Connects to IoT cold storage sensors broadcasting temperature data via Socket.io WebSocket gateway.
- **Automated Breach Mutation**: When readings breach allowed thresholds (e.g. `2°C - 8°C`), the rule engine instantly:
  1. Mutates batch status to **`SPOILED`** across all connected clients.
  2. Creates a persistent critical alert in Neon PostgreSQL.
  3. Appends an entry to the batch audit timeline (`GET /batches/:id/trace`).
  4. Dispatches an emergency SMS alert via **Fast2SMS API** to the Nodal Manager's phone number (`+91 7379413212`).

### 📊 5. Master Admin & Scoped Hospital Views
- **Master Admin Dashboard (`/admin`)**: Aggregated KPI summary cards, inventory status overview (Total Stock, Expired, Spoiled, Expiring Soon), multi-hospital comparison table, and IoT simulator.
- **Hospital Dynamic Pages (`/hospital/[facilityId]`)**: Scoped views showing metrics, thermal monitors, and inventory tables strictly for that hospital.

---

## 🔑 Demo Access Credentials

| Role | Facility Scope | Email | Password | Access URL |
|---|---|---|---|---|
| 👑 **Chief District Admin** | All Gorakhpur Facilities | `admin@earogyam.health` | `admin123` | `/admin` |
| 🏥 **BRD Medical Nodal Officer** | BRD Medical College | `brd@earogyam.health` | `brd123` | `/hospital/fac-brd-01` |
| 🏥 **AIIMS Cold Chain Lead** | AIIMS Gorakhpur | `aiims@earogyam.health` | `aiims123` | `/hospital/fac-aiims-02` |
| 🏥 **NSCB District Hospital Officer** | NSCB District Hospital | `nscb@earogyam.health` | `nscb123` | `/hospital/fac-nscb-03` |

---

## 🛠️ Technology Stack

### Frontend Application (`apps/web`)
- **Framework**: Next.js 14 (App Router, Client & Server Components)
- **Styling**: Vanilla CSS, Tailwind CSS (Government Portal Theme `#0F2942`)
- **Icons**: Lucide React
- **Realtime**: Socket.io Client
- **Camera Scanning**: `html5-qrcode`

### Backend Service (`apps/backend`)
- **Runtime**: Node.js, Express, TypeScript
- **Database**: Serverless Neon PostgreSQL (via `pg` pool) with fallback in-memory engine
- **Realtime Gateway**: Socket.io Server (WebSocket)
- **SMS Gateway**: Fast2SMS API integration

### Monorepo Packages
- **`@pharma/types`**: Shared TypeScript interfaces for Facilities, Batches, Telemetry, Users, and WS events.
- **`@pharma/utils`**: GS1 Barcode AI parser, temperature breach logic, date calculations.

---

## 📂 Project Architecture

```
e-Arogyam/
├── apps/
│   ├── backend/                # Express & Socket.io Backend API
│   │   ├── src/
│   │   │   ├── main.ts         # HTTP Server & Gateway Entry
│   │   │   ├── db.ts           # Neon PostgreSQL Pool & Initial Seeds
│   │   │   ├── realtime.ts     # Socket.io Broadcast Gateway
│   │   │   ├── sms.ts          # Fast2SMS Alerting Service
│   │   │   ├── routes/api.ts   # REST Endpoints (Auth, Batches, Telemetry)
│   │   │   └── services/       # Telemetry Breach Processor & Business Logic
│   └── web/                    # Next.js 14 Web Application
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx    # Auth Guard & Role Redirector
│       │   │   ├── login/      # Role Login Gateway with Autofill
│       │   │   ├── admin/      # Master District Admin Dashboard
│       │   │   └── hospital/   # Scoped Dynamic Hospital Pages
│       │   └── components/     # GovernmentHeader, LogisticsScanner, etc.
├── packages/
│   ├── types/                  # Shared Domain Types & Interfaces
│   └── utils/                  # GS1 Barcode Parser & Business Helper Utilities
├── scripts/
│   └── verify_step1.js         # Integration Test Suite
├── package.json
└── README.md
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### 1. Clone Repository
```bash
git clone https://github.com/aditya06156-alt/e-Arogyam.git
cd e-Arogyam
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build Workspace Packages
```bash
npm run build:types
npm run build:utils
npm --prefix apps/backend run build
```

### 4. Set Up Environment Variables (`.env`)
Create a `.env` file in the project root:
```env
DATABASE_URL=postgresql://neondb_owner:npg_xY5f4yFmlD1c@ep-flat-cloud-a859q3n8-pooler.eastus2.azure.neon.tech/neondb?sslmode=require
FAST2SMS=qjOHuJKd7S9yxl6fiEZzb2Uocg0YCTRDaB1nLFpNkP5wV4re3tJzL349Z0sXEenKUiaMc5toCqxgkdIb
MANAGER_PHONE=+917379413212
PORT=3001
```

### 5. Start Servers

#### Terminal 1 — Backend Server (`http://localhost:3001`):
```bash
npm run dev:backend
```

#### Terminal 2 — Next.js Web Portal (`http://localhost:3000`):
```bash
npm run dev:web
```

---

## 🧪 Automated Test Suite

Run the full integration verification suite to test database connectivity, auth, telemetry ingestion, thermal breach mutation, SMS dispatch, and offline transaction synchronization:

```bash
node scripts/verify_step1.js
```

**Sample Output:**
```text
=============================================================
  🧪 STEP 1 & STEP 2 VERIFICATION TEST SUITE
=============================================================

1. GET /health:                      ✅ PASS (Status UP)
2. POST /auth/login:                 ✅ PASS (Token Received)
3. Normal Telemetry (5.4°C):         ✅ PASS (Status NORMAL)
4. Breach Telemetry (18.0°C):        ✅ PASS (Status SPOILED)
5. GET /dashboard/overview:          ✅ PASS (Total Stock: 9,685 | Expired: 1 | Breached: 2)
6. GET /batches/batch-je-brd-01/trace: ✅ PASS (Timeline Logged)
7. POST /transactions/scan:          ✅ PASS (Inward Movement Recorded)
8. POST /transactions/sync:          ✅ PASS (Idempotent Sync Verified)

=============================================================
🎉 ALL VERIFICATION TESTS PASSED 100%!
=============================================================
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  <b>e-Arogyam Platform — Empowering Vaccine Safety & Cold-Chain Supply Integrity for Gorakhpur</b>
</p>
