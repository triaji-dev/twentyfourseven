FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 3001

# Note: For production, run migrations separately before deploying
# This CMD is suitable for development/demo purposes
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
