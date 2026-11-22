FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV DATABASE_URL=postgresql://adoptajob:build-only@localhost:5432/adoptajob
RUN npm run db:generate && npm run build
EXPOSE 3000
CMD ["sh", "-c", "npm run db:deploy && npm start"]
