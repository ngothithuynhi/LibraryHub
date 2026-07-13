# LibraryHub - SPQM Mini Project

## 1. Project Description

**LibraryHub** is a library management web application developed for the CMU-SE 433 Software Process and Quality Management mini project.

The system supports two main roles:

- **User**: register, login, view books, search books, borrow books, view borrow history, and return books.
- **Admin**: manage books, including create, update, and delete book information.

The project applies a **CMMI Level 2-oriented process improvement approach**. Quality is measured through testing coverage, SonarQube analysis, Docker evidence, and process documentation.

---

## 2. Main Features

- JWT authentication and authorization
- Role-based access control: Admin = 1, User = 2
- Book listing and searching
- Borrow and return book workflow
- Admin book management
- PostgreSQL database
- Python FastAPI recommendation service
- Docker Compose multi-service environment
- Jest + Supertest integration testing
- SonarQube code quality analysis

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3, Vite, Bootstrap, Axios |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Sequelize |
| Auth | JWT |
| Python Service | FastAPI |
| Testing | Jest, Supertest |
| Quality | SonarQube |
| DevOps | Docker Compose, GitHub Actions |

---

## 4. System Architecture

```txt
User Browser
    |
    v
Vue 3 Frontend
    |
    v
Node.js Express Backend
    |
    +------------------> PostgreSQL Database
    |
    +------------------> Python FastAPI Recommendation Service
```

---

## 5. Project Structure

```txt
LibraryHub/
├── Backend/
│   ├── src/
│   ├── models/
│   ├── migrations/
│   ├── seeders/
│   ├── tests/
│   └── python-service/
├── Frontend/
│   └── src/
├── docs/
│   └── images/
├── docker-compose.yml
├── sonar-project.properties
├── CONTRIBUTING.md
└── README.md
```

---

## 6. How to Run

### Start services

```bash
docker compose up --build
```

### Run migration

```bash
docker compose exec backend npx sequelize-cli db:migrate
```

### Run seeder

```bash
docker compose exec backend npx sequelize-cli db:seed:all
```

### Access URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| FastAPI Service | http://localhost:8000 |
| Swagger API Docs | http://localhost:3000/api-docs |

---

## 7. API Summary

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/books` | Get book list |
| GET | `/api/books/search` | Search books |
| POST | `/api/books` | Create book, admin only |
| PUT | `/api/books/:id` | Update book, admin only |
| DELETE | `/api/books/:id` | Delete book, admin only |
| POST | `/api/borrow` | Borrow book |
| POST | `/api/borrow/return` | Return book |
| GET | `/api/borrow/history` | View borrow history |
| GET | `/api/recommendations` | Get book recommendations |

---

## 8. Testing and Coverage

The backend uses **Jest + Supertest** with a real PostgreSQL test database.

### Latest Result

| Metric | Result |
|---|---:|
| Test Suites | 6 passed / 6 total |
| Tests | 34 passed / 34 total |
| Statement Coverage | 92.19% |
| Branch Coverage | 83.09% |
| Function Coverage | 93.10% |
| Line Coverage | 92.88% |

### Run tests

```bash
docker compose exec backend npm test
```

![Test Coverage](docs/images/test-coverage.png)

---

## 9. SonarQube Result

SonarQube is used to measure code quality, maintainability, reliability, duplication, and coverage.

| Metric | Result |
|---|---:|
| Quality Gate | Passed |
| SonarQube Coverage | 89.2% |
| Duplications | 0.0% |
| Maintainability | A |
| Reliability | C |
| Security | B |

![SonarQube Dashboard](docs/images/sonarqube-dashboard.png)

---

## 10. SPQM Process

This project follows an iterative improvement process based on **PDCA** and **CMMI Level 2**.

```txt
Plan → Implement → Test → Measure → Improve
```

### ETVX Process

| Element | Description |
|---|---|
| Entry | Requirement is clear and task is prioritized |
| Task | Implement feature, write test, update documentation |
| Verification | Run Docker, Jest tests, and SonarQube scan |
| Exit | Feature works, tests pass, coverage target is achieved |

---

## 11. CMMI Level 2 Evidence

| Practice Area | Project Evidence |
|---|---|
| Requirements Management | Feature list, backlog, README |
| Project Planning | Sprint tasks and priorities |
| Project Monitoring | Test result, SonarQube dashboard, screenshots |
| Measurement and Analysis | Coverage, test count, duplication, quality gate |
| Quality Assurance | Jest tests, Supertest, SonarQube |
| Configuration Management | Git, Docker Compose, README, CONTRIBUTING.md |

---

## 12. Screenshots

### Docker Running

![Docker Running](docs/images/docker-running.png)

### Book List

![Book List](docs/images/frontend-books.png)

### My Borrow Records

![My Borrows](docs/images/my-borrows.png)

### Admin Book Management

![Admin](docs/images/frontend-admin.png)

### FastAPI Health

![FastAPI Health](docs/images/postman-fastapi-health.png)

### FastAPI Recommendation

![FastAPI Recommendation](docs/images/postman-fastapi-recommend.png)

---

## 13. Demo Video

```txt
Demo video link: <PASTE_YOUR_DEMO_VIDEO_LINK_HERE>
```

---

## 14. Repository

```txt
GitHub repository: <PASTE_YOUR_GITHUB_REPOSITORY_LINK_HERE>
```

---

## 15. Conclusion

LibraryHub demonstrates a complete Level 2 software quality project with a working full-stack system, PostgreSQL database, Docker Compose environment, Python FastAPI service, integration testing, SonarQube quality analysis, and SPQM/CMMI process evidence.