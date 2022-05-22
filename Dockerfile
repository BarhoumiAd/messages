# syntax=docker/dockerfile:1
# =====
# Base image phase. This will buid a image that contains common tools and
# enviroment variables

FROM registry.access.redhat.com/ubi8/nodejs-14-minimal:latest AS builder
USER root

RUN microdnf update -y

WORKDIR /opt/app-root/app

# Copy all files into the build container
COPY . .
RUN npm ci --production

# ======
FROM registry.access.redhat.com/ubi8/ubi-micro:latest

ARG TEMP_USER_ID=1001


COPY --link --from=builder /lib64/libz.so.1 /lib64/libbrotlidec.so.1 /lib64/libbrotlienc.so.1 /lib64/libcrypto.so.1.1  /lib64/libssl.so.1.1 /lib64/libgcc_s.so.1 /lib64/libbrotlicommon.so.1 /lib64/libstdc++.so.6 /lib64/libgcc_s.so.1 /lib64/ 
COPY --link --from=builder /usr/bin/node /usr/bin/node
COPY --chown=${TEMP_USER_ID}:0 --from=builder /opt/app-root/app /opt/app-root/app


LABEL name="message" \
        vendor="unknown" \
        summary="simple message app" \
        version="1.0.0.0" \
        release="1.0" \
        description="a simple message CRUD "


ENV NODE_ENV=production

WORKDIR /opt/app-root/app

USER ${TEMP_USER_ID}
# Sets up stuff for the container to run
EXPOSE 3000

CMD [ "node", "./src/app.js" ]
