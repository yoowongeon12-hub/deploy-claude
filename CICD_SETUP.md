# CI/CD 파이프라인 구축 완료 ✅

## 📋 생성된 파일 목록

### GitHub Actions 워크플로우
- `.github/workflows/ci.yml` - 지속적 통합 파이프라인
- `.github/workflows/deploy.yml` - 지속적 배포 파이프라인

### Docker & 컨테이너화
- `Dockerfile` - 프로덕션 이미지 빌드 설정
- `docker-compose.yml` - 로컬 개발 환경 구성
- `.dockerignore` - Docker 빌드 최적화

### 환경 설정
- `.env.example` - 환경 변수 템플릿

---

## 🚀 CI/CD 파이프라인 상세

### 1️⃣ CI 파이프라인 (`.github/workflows/ci.yml`)

**트리거:**
- main, develop 브랜치에 push될 때
- Pull Request 생성 시

**실행 작업:**

| 작업 | 설명 | 의존성 |
|------|------|--------|
| **code-check** | ESLint, Prettier를 통한 코드 품질 검사 | - |
| **test** | PostgreSQL을 사용한 단위 테스트 | code-check |
| **security** | npm audit를 통한 보안 취약점 검사 | code-check |
| **build** | Prisma 클라이언트 생성 및 빌드 검증 | code-check, test, security |
| **report** | 최종 결과 보고 | code-check, test, build |

### 2️⃣ 배포 파이프라인 (`.github/workflows/deploy.yml`)

**트리거:**
- main 브랜치에 push될 때
- CI 파이프라인 성공 완료 후

**실행 작업:**

| 작업 | 설명 | 의존성 |
|------|------|--------|
| **pre-deploy** | 배포 전 환경 준비 및 검증 | - |
| **build-and-push** | Docker 이미지 빌드 및 레지스트리 푸시 | pre-deploy |
| **deploy** | Prisma 마이그레이션 및 프로덕션 배포 | pre-deploy, build-and-push |
| **post-deploy** | 배포 후 상태 확인 및 알림 | deploy |

---

## 🐳 Docker 설정

### Dockerfile 구조
```
멀티 스테이지 빌드
├─ builder: Node.js 의존성 설치 및 Prisma 클라이언트 생성
└─ runtime: 최적화된 최종 이미지 생성
  ├─ Non-root 사용자 실행
  ├─ 헬스체크 설정
  └─ 3000 포트 노출
```

### 로컬 개발 환경 실행

```bash
# 1. 환경 변수 설정
cp .env.example .env

# 2. Docker Compose로 모든 서비스 실행
docker-compose up -d

# 3. Prisma 마이그레이션 실행
docker-compose exec api npx prisma migrate dev

# 4. API 접근
curl http://localhost:3000

# 5. 종료
docker-compose down
```

**포함된 서비스:**
- **PostgreSQL**: 데이터베이스 (포트 5432)
- **API**: Node.js 서버 (포트 3000)
- **Redis**: 캐시 서비스 (포트 6379)

---

## 🔐 GitHub 시크릿 설정

배포 파이프라인이 정상 작동하려면 다음 시크릿을 설정해야 합니다:

1. **GitHub 저장소 설정 > Secrets and variables > Actions**에서 추가:

```yaml
DATABASE_URL
  - PostgreSQL 프로덕션 연결 URL
  - 예: postgresql://user:pass@host:5432/db

SLACK_WEBHOOK (선택사항)
  - Slack 알림을 위한 Webhook URL

DISCORD_WEBHOOK (선택사항)
  - Discord 알림을 위한 Webhook URL

GITHUB_TOKEN
  - 이미 자동 제공됨
```

---

## 📝 환경 변수 설정

### .env 파일 설정

```bash
cp .env.example .env
```

주요 환경 변수:

```bash
# 애플리케이션
NODE_ENV=development
PORT=3000

# 데이터베이스
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/todo_dev

# 보안
JWT_SECRET=your_jwt_secret_key_here
SESSION_SECRET=your_session_secret_key_here

# API 문서
SWAGGER_ENABLED=true

# 로깅
LOG_LEVEL=debug
```

---

## ✅ 배포 플로우

```
코드 푸시 (main)
    ↓
CI 파이프라인 실행
├─ 코드 검사 ✓
├─ 테스트 ✓
├─ 보안 스캔 ✓
└─ 빌드 검증 ✓
    ↓
[CI 성공]
    ↓
배포 파이프라인 실행
├─ 배포 전 검증 ✓
├─ Docker 이미지 빌드/푸시 ✓
├─ 프로덕션 배포 ✓
└─ 배포 후 검증 ✓
    ↓
✅ 배포 완료
    ↓
알림 발송 (Slack/Discord/Email)
```

---

## 🛠️ 커스터마이징 가이드

### 1. 배포 대상 변경

`deploy.yml`의 `deploy` 단계에서 실제 배포 명령어 추가:

```yaml
# Vercel
- run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}

# Heroku
- run: git push heroku main

# PM2 (VPS)
- run: |
    ssh user@host 'cd /app && git pull && npm install && npm run build && pm2 restart app'

# AWS Lambda
- run: serverless deploy --stage prod
```

### 2. 테스트 추가

`package.json`에 테스트 명령어 추가:

```json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage"
  }
}
```

### 3. 알림 통합

`deploy.yml`의 `post-deploy` 단계에서 알림 추가:

```yaml
# Slack 알림
- run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
      -H 'Content-Type: application/json' \
      -d '{"text":"배포가 완료되었습니다"}'
```

---

## 📊 모니터링 및 로그

### GitHub Actions 로그 확인

1. GitHub 저장소 > Actions 탭
2. 실행된 워크플로우 클릭
3. 각 작업의 로그 확인

### Docker 로그 확인

```bash
# 모든 서비스 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f api
docker-compose logs -f postgres
```

---

## ⚠️ 주요 주의사항

1. **`.env` 파일**
   - 절대 GitHub에 커밋하면 안됨
   - `.gitignore`에 `.env` 포함 확인

2. **시크릿 관리**
   - 프로덕션 시크릿은 GitHub Secrets에만 저장
   - 로컬에서는 `.env.local` 사용

3. **마이그레이션**
   - 배포 전에 Prisma 마이그레이션 항상 실행
   - 롤백 가능성 검토

4. **이미지 크기**
   - 멀티 스테이지 빌드로 이미지 크기 최소화
   - `.dockerignore` 활용

---

## 📚 추가 리소스

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Docker 문서](https://docs.docker.com)
- [Prisma 배포 가이드](https://www.prisma.io/docs/guides/deployment)
- [Node.js 프로덕션 체크리스트](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---

## 🎯 다음 단계

- [ ] GitHub 시크릿 설정 (DATABASE_URL 등)
- [ ] 실제 배포 명령어 작성
- [ ] 테스트 코드 작성 (test/)
- [ ] Slack/Discord 웹훅 설정
- [ ] 모니터링 대시보드 연동
- [ ] 자동 롤백 정책 수립

