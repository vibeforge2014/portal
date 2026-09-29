ARG NGINX_BASE=docker.m.daocloud.io/library/nginx:1.28-alpine
FROM ${NGINX_BASE}

COPY nginx.conf /etc/nginx/nginx.conf

USER nginx
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=4 CMD ["wget", "-q", "-O", "/dev/null", "http://127.0.0.1:8080/api/pdf-convert/health/"]
