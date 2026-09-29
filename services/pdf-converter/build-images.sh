#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/../.."

OUTPUT="${PDF_CONVERTER_IMAGE_ARCHIVE:-/tmp/zensoft-pdf-converter-images.tar}"
TAG="${PDF_CONVERTER_TAG:-20260930}"

docker build --platform linux/amd64 -t "zensoft/pdf-converter-api:$TAG" services/pdf-converter/api
docker build --platform linux/amd64 -f services/pdf-converter/Gotenberg.Dockerfile -t "zensoft/gotenberg-cjk:$TAG" .
docker build --platform linux/amd64 -t "zensoft/pdf-converter-ingress:$TAG" services/pdf-converter/ingress
docker save -o "$OUTPUT" "zensoft/pdf-converter-api:$TAG" "zensoft/gotenberg-cjk:$TAG" "zensoft/pdf-converter-ingress:$TAG"
echo "完成：$OUTPUT"
