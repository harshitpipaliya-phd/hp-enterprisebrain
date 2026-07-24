# Multi-stage build: keeps the final image small by not shipping devDependencies
# or TypeScript source, only the compiled output and production node_modules.

FROM node:20-slim AS build
WORKDIR /repo
COPY package*.json ./
COPY contracts ./contracts
COPY database ./database
COPY events ./events
COPY api ./api
RUN npm install
RUN npm run generate
RUN cd database && npx tsc
RUN cd events && npx tsc
RUN cd api && npx tsc

FROM node:20-slim AS runtime
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=build /repo/package*.json ./
COPY --from=build /repo/contracts ./contracts
COPY --from=build /repo/database ./database
COPY --from=build /repo/events ./events
COPY --from=build /repo/api ./api
COPY --from=build /repo/node_modules ./node_modules
COPY graph ./graph
RUN chmod +x /repo/api/docker-entrypoint.sh
EXPOSE 4000
ENTRYPOINT ["sh", "/repo/api/docker-entrypoint.sh"]
CMD ["node", "api/dist/src/server.js"]
