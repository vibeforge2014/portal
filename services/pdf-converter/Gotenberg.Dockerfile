ARG GOTENBERG_BASE=docker.m.daocloud.io/gotenberg/gotenberg:8.34.0
FROM ${GOTENBERG_BASE}

USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-crosextra-caladea \
    fonts-crosextra-carlito \
    fonts-liberation \
    fonts-noto-cjk \
  && fc-cache -f \
  && rm -rf /var/lib/apt/lists/*
USER gotenberg
