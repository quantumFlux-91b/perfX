<div align="center">

# ⚡ PerfX

**A generic, extensible performance test result aggregator and comparator.**

Upload results from JMeter, Gatling, K6, and more — visualize trends, spot regressions, and compare releases side by side.

[![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

</div>

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Running Locally](#running-locally)
  - [Option 1 — Maven + npm (Development)](#option-1--maven--npm-development)
  - [Option 2 — Docker Compose](#option-2--docker-compose)
- [Deploying to Kubernetes](#deploying-to-kubernetes)
  - [Option 3 — Raw Manifests](#option-3--raw-kubernetes-manifests)
  - [Option 4 — Helm Chart](#option-4--helm-chart)
  - [Option 5 — OpenShift](#option-5--openshift)
- [User Guide](#user-guide)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

---

## About

PerfX is a self-hosted web application that acts as a **generic ETL engine for performance testing data**.

Most testing tools (JMeter, Gatling, K6, Postman) produce their own proprietary output formats. PerfX ingests these diverse payloads, maps them to a unified internal domain model, and stores them — so you can track the performance evolution of your applications over time and compare releases with a single click.

**Key use cases:**
- Detect performance regressions between releases (CI/CD integration)
- Track response time, throughput, error rate, and P98 trends over time
- Compare two test runs side by side with detailed per-endpoint charts
- Manage multiple applications and their versioned test history in one place

---

## Features

| Category | Details |
|----------|---------|
| 📥 **Ingestion** | JMeter CSV supported today; K6 and Gatling interfaces ready (Strategy pattern) |
| 📊 **Visualization** | Time-series charts: Response Time, Throughput, Error Rate per version |
| ⚖️ **Comparison** | Side-by-side comparison of two runs: Avg RT, P98, Throughput, Error Rate |
| 🔍 **Drill-down** | Per-endpoint metric details with sortable tables |
| 🏢 **Multi-app** | Manage unlimited applications, each with independent test run history |
| 🔐 **Auth** | User authentication with login/register flow |
| 🧩 **Clean Architecture** | Hexagonal architecture; add a new tool by implementing one interface |
| ☸️ **Cloud-ready** | Raw K8s manifests + Helm chart + OpenShift Routes included |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (React + TypeScript + Vite)  — port 5173 (dev)        │
│  Pages: Login · Applications · Dashboard · Upload · Compare      │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST / JSON
┌────────────────────────▼────────────────────────────────────────┐
│  Backend (Spring Boot 4, Java 21)  — port 8080                   │
│                                                                   │
│  ┌─ Infrastructure ──────────────────────────────────────────┐   │
│  │  Controllers · Parsers (JMeter…) · JPA Entities · MapStruct│  │
│  └────────────────────────┬──────────────────────────────────┘   │
│                           │ Port interfaces                        │
│  ┌─ Application ──────────▼──────────────────────────────────┐   │
│  │  UploadService · QueryService · ComparisonService           │   │
│  │  UserService · ApplicationService                           │   │
│  └────────────────────────┬──────────────────────────────────┘   │
│                           │                                        │
│  ┌─ Domain ───────────────▼──────────────────────────────────┐   │
│  │  TestRun · TestMetric · Application · User · RequestStats   │   │
│  │  MetricComparison · ParsedMetrics                           │   │
│  └───────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │ JDBC
              ┌──────────▼──────────┐
              │  H2 (dev/test)      │
              │  PostgreSQL (prod)  │
              └─────────────────────┘
```

---

## Prerequisites

### Local development

| Tool | Minimum version |
|------|----------------|
| Java (JDK) | 21 |
| Node.js | 20 LTS |
| npm | 10 |

> The backend ships with **Maven Wrapper** (`mvnw`), so you don't need Maven installed globally.

### Docker / Kubernetes

| Tool | Purpose |
|------|---------|
| Docker or Podman | Build & run images |
| kubectl ≥ 1.28 | Raw manifest deployment |
| Helm ≥ 3.12 | Chart-based deployment |
| oc ≥ 4.12 | OpenShift deployment |

---

## Running Locally

### Option 1 — Maven + npm (Development)

This is the fastest way to get started. The backend uses an **in-memory H2 database** — no database installation required.

**Terminal 1 — Backend**
```bash
cd backend

# Linux / macOS
./mvnw spring-boot:run

# Windows (PowerShell)
$env:JAVA_HOME = "C:\path\to\jdk-21"
.\mvnw.cmd spring-boot:run
```

Backend starts at **http://localhost:8080**

**Terminal 2 — Frontend**
```bash
cd frontend
npm install
npm run dev
```

Frontend starts at **http://localhost:5173**

Open your browser at `http://localhost:5173` and log in with:
- **Username:** `admin`
- **Password:** `admin`

---

### Option 2 — Docker Compose

> Coming soon — you can already build each image individually using the Dockerfiles.

**Build and run manually:**

```bash
# Backend
cd backend
docker build -t perfx-backend:local .
docker run -p 8080:8080 perfx-backend:local

# Frontend
cd frontend
docker build -t perfx-frontend:local .
docker run -p 8080:8080 perfx-frontend:local
```

> The Nginx frontend container proxies `/api/*` requests to the backend automatically (configured in `frontend/nginx.conf`).

---

## Deploying to Kubernetes

Before deploying, build and push your images to a container registry:

```bash
REGISTRY=your-registry.io/your-org
TAG=1.0.0

docker build -t $REGISTRY/perfx-backend:$TAG ./backend  && docker push $REGISTRY/perfx-backend:$TAG
docker build -t $REGISTRY/perfx-frontend:$TAG ./frontend && docker push $REGISTRY/perfx-frontend:$TAG
```

Then update the `image:` references in your manifests or Helm values before deploying.

---

### Option 3 — Raw Kubernetes Manifests

```bash
# 1. Apply all manifests (numbered for correct ordering)
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-postgres-secret.yaml
kubectl apply -f k8s/02-postgres-pvc.yaml
kubectl apply -f k8s/03-postgres.yaml

# 2. Wait for PostgreSQL
kubectl rollout status deployment/postgres -n perfx

# 3. Deploy the application
kubectl apply -f k8s/04-backend-configmap.yaml
kubectl apply -f k8s/05-backend.yaml
kubectl apply -f k8s/06-frontend.yaml
kubectl apply -f k8s/07-ingress.yaml

# 4. Verify
kubectl get pods -n perfx
kubectl get ingress -n perfx
```

> ⚠️ Edit `k8s/01-postgres-secret.yaml` to change the default password before deploying.
> Edit `k8s/07-ingress.yaml` to set your domain.

---

### Option 4 — Helm Chart

The chart is located in `helm/perfx/` and supports bundled PostgreSQL, external databases, HPA, TLS, and OpenShift Routes.

```bash
# Lint and preview (no cluster needed)
helm lint ./helm/perfx
helm template perfx ./helm/perfx --debug

# Install
helm upgrade --install perfx ./helm/perfx \
  --namespace perfx \
  --create-namespace \
  --set backend.image.repository=$REGISTRY/perfx-backend \
  --set backend.image.tag=$TAG \
  --set frontend.image.repository=$REGISTRY/perfx-frontend \
  --set frontend.image.tag=$TAG \
  --set postgres.auth.password=your-strong-password \
  --set ingress.host=perfx.example.com

# — OR — use a values override file
helm upgrade --install perfx ./helm/perfx \
  --namespace perfx --create-namespace \
  -f helm/perfx/values-production.yaml
```

**Upgrade**
```bash
helm upgrade perfx ./helm/perfx --namespace perfx --reuse-values \
  --set backend.image.tag=1.1.0
```

**Rollback**
```bash
helm history perfx -n perfx
helm rollback perfx -n perfx          # last revision
helm rollback perfx 2 -n perfx        # specific revision
```

**Uninstall**
```bash
helm uninstall perfx -n perfx
# PVCs are kept by default — delete manually to wipe data:
kubectl delete pvc -n perfx -l app.kubernetes.io/instance=perfx
```

---

### Option 5 — OpenShift

Use `values-openshift.yaml` which disables the Kubernetes Ingress and enables OpenShift Routes instead:

```bash
helm upgrade --install perfx ./helm/perfx \
  --namespace perfx \
  --create-namespace \
  -f helm/perfx/values-openshift.yaml \
  --set backend.image.repository=$REGISTRY/perfx-backend \
  --set backend.image.tag=$TAG \
  --set frontend.image.repository=$REGISTRY/perfx-frontend \
  --set frontend.image.tag=$TAG
```

> Both Dockerfiles are non-root and OpenShift-compatible (arbitrary UID support, port 8080).

---

## User Guide

### 1. Log in

Navigate to the app URL and sign in with your credentials. Use the **Register** tab to create a new account.

### 2. Create an Application

On the **Applications** page, click **New Application**, enter a name (e.g. `Payment Gateway`), and click **Create**. An application represents a service whose performance you want to track over time.

### 3. Upload a Test Result

From the application dashboard, click **+ New Upload**, then:

1. Confirm the **Application Name**
2. Enter the **Version** tag (e.g. `v1.2.0`) — use meaningful, sortable version names
3. Select the **Testing Tool** (currently: JMeter CSV)
4. Drag & drop your result file or click to browse
5. Click **Process & Analyze Upload**

> JMeter: export results as a **CSV file** with the standard JMeter output format (with headers).

### 4. Track Performance Trends

The **Dashboard** shows three time-series charts automatically updated after each upload:
- **Response Time Evolution** (avg ms)
- **Throughput Evolution** (requests/sec)
- **Error Rate** (%)

The table below lists all test runs with trend indicators (↑↓=) compared to the previous run.

### 5. Drill Into a Run

Click **Details** on any run row to see **per-endpoint breakdowns**: avg response time, P98, throughput, error rate, and sample count for each API endpoint tested.

### 6. Compare Two Runs

Click **Compare** on any run, or navigate to the **Compare** page from the nav. Select:
- **Application**
- **Baseline run** (your reference, e.g. last stable release)
- **Target run** (the new release to evaluate)

The comparison view shows four side-by-side bar charts:
- Average Response Time
- P98 Response Time
- Throughput
- Error Rate

Each bar is color-coded: 🟢 improvement · 🔴 regression.

---

## API Reference

All endpoints are prefixed with `/` and served on port `8080`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | Authenticate a user |
| `POST` | `/auth/register` | Register a new user |
| `GET` | `/applications?userId={id}` | List applications for a user |
| `POST` | `/applications?userId={id}&name={name}` | Create an application |
| `POST` | `/test-runs` | Upload a test result file (`multipart/form-data`) |
| `GET` | `/test-runs?userId={id}&applicationName={name}` | List test runs |
| `GET` | `/test-runs/{id}/details` | Get per-endpoint metrics for a run |
| `GET` | `/test-runs/compare?baseRunId={id}&targetRunId={id}` | Compare two runs |

---

## Configuration

### Backend Spring Profiles

| Profile | Database | Activation |
|---------|----------|-----------|
| `default` | H2 in-memory | No env var needed |
| `prod` | PostgreSQL | `SPRING_PROFILES_ACTIVE=prod` |

The `prod` profile reads all connection details from environment variables:

| Variable | Description |
|----------|-------------|
| `SPRING_DATASOURCE_URL` | JDBC URL (e.g. `jdbc:postgresql://host:5432/perfx`) |
| `SPRING_DATASOURCE_USERNAME` | PostgreSQL username |
| `SPRING_DATASOURCE_PASSWORD` | PostgreSQL password |

### Adding a New Testing Tool

PerfX uses the **Strategy pattern** for parsers. To add support for a new tool:

1. Create a class implementing `TestResultParser` in `infrastructure/parser/`
2. Annotate it with `@Component`
3. Return the matching `ToolType` from `getSupportedTool()`

No other code needs to change — the parser is auto-discovered at startup.

```java
@Component
public class K6JsonParser implements TestResultParser {

    @Override
    public ToolType getSupportedTool() {
        return ToolType.K6;
    }

    @Override
    public ParsedMetrics parse(MultipartFile file) {
        // your parsing logic
    }
}
```

---

## Project Structure

```
perfX/
├── backend/                        Spring Boot 4 API (Java 21)
│   ├── src/main/java/com/perfx/api/
│   │   ├── domain/                 Domain models & repository interfaces
│   │   │   ├── model/              TestRun, Application, User, MetricComparison…
│   │   │   └── repository/         Port interfaces (no JPA leakage)
│   │   ├── application/            Use cases & services
│   │   │   ├── port/               Input ports (use case interfaces)
│   │   │   └── service/            UploadService, QueryService, ComparisonService…
│   │   └── infrastructure/         Adapters (Spring, JPA, Parsers, Web)
│   │       ├── parser/             JMeterCsvParser (+ future K6, Gatling)
│   │       ├── persistence/        JPA entities, repositories, MapStruct mappers
│   │       └── web/                REST controllers, GlobalExceptionHandler
│   └── src/main/resources/
│       ├── application.properties         Default (H2)
│       └── application-prod.properties    Production (PostgreSQL)
│
├── frontend/                       React 19 + TypeScript + Vite
│   ├── src/pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx           Application list + trend charts
│   │   ├── Upload.tsx              File upload form
│   │   ├── Details.tsx             Per-endpoint metric breakdown
│   │   └── Compare.tsx             Side-by-side run comparison
│   └── nginx.conf                  SPA routing + /api proxy
│
├── k8s/                            Raw Kubernetes manifests
│   ├── 00-namespace.yaml
│   ├── 01-postgres-secret.yaml
│   ├── 02-postgres-pvc.yaml
│   ├── 03-postgres.yaml
│   ├── 04-backend-configmap.yaml
│   ├── 05-backend.yaml
│   ├── 06-frontend.yaml
│   ├── 07-ingress.yaml
│   └── 08-openshift-route.yaml
│
└── helm/perfx/                     Helm chart
    ├── Chart.yaml
    ├── values.yaml                 All defaults
    ├── values-production.yaml      Production overrides
    ├── values-openshift.yaml       OpenShift overrides
    └── templates/                  Parameterized K8s resources
```

---

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Run the tests: `cd backend && ./mvnw test`
4. Commit your changes: `git commit -m 'feat: add K6 parser'`
5. Open a Pull Request

### Running Tests

```bash
cd backend
./mvnw test

# With coverage report
./mvnw verify
```

---

<div align="center">
Made with ☕ and a passion for clean architecture.
</div>
