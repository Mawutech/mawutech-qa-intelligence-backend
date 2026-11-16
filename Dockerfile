FROM mcr.microsoft.com/playwright:v1.65.1-noble
WORKDIR /app
ENV NODE_ENV=production \
    PORT=4000 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package.json ./
COPY prisma ./prisma
RUN npm install --include=dev
RUN npx prisma generate
COPY . .
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
