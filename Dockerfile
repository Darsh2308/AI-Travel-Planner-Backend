FROM node:20

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN npm i -g pnpm && pnpm install

COPY . .

EXPOSE 5000

CMD ["pnpm", "dev"]
