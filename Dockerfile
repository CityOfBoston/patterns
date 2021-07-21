# ================================== BUILDER ===================================
ARG INSTALL_NODE_VERSION=${INSTALL_NODE_VERSION:-NODE_VERSION_NOT_SET}

FROM node:${INSTALL_NODE_VERSION}-alpine AS builder

WORKDIR /app

#COPY --from=node /usr/local/bin/ /usr/local/bin/
#COPY --from=node /usr/lib/ /usr/lib/
#COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules

COPY package.json ./
COPY package-lock.json ./
COPY ./ ./

RUN npm install

#RUN npm run-script build

# ================================= DEVELOPMENT ================================
FROM builder AS development

EXPOSE 3030
CMD ["npm", "run", "dev"]
