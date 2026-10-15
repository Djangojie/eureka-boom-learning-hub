FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server.js ./
COPY db ./db
COPY public ./public
COPY content ./content
COPY data ./data
RUN mkdir -p data/uploads
EXPOSE 3000
ENV PORT=3000
CMD ["npm", "start"]
