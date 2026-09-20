# 멀티 스테이지 빌드 - 빌드 단계
FROM node:18-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# Prisma 설정 파일 복사
COPY prisma ./prisma/

# Prisma 클라이언트 생성
RUN npx prisma generate

# ---

# 최종 스테이지 - 실행 이미지
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 보안을 위해 non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 빌드 단계에서 node_modules와 prisma 복사
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# 소스 코드 복사
COPY --chown=nodejs:nodejs . .

# 헬스체크 설정
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000), (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# nodejs 사용자로 전환
USER nodejs

# 포트 노출
EXPOSE 3000

# 애플리케이션 시작
CMD ["node", "api-server.js"]
