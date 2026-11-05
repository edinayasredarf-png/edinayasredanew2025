#!/usr/bin/env bash
# Root-owned forced SSH command. Accepts a Docker image stream, never a shell.
set -Eeuo pipefail
PATH=/usr/sbin:/usr/bin:/sbin:/bin
export PATH
umask 077
BASE=/opt/edinayasreda
NETWORK=edinayasreda-runtime
PROXY=vercel-proxy
UPSTREAM=/root/docker-proxy/data/conf.d/00-edinayasreda-upstream.conf
COMMAND=${SSH_ORIGINAL_COMMAND:-${1:-}}
if [[ ! "$COMMAND" =~ ^(deploy|rollback)\ ([0-9a-f]{40})$ ]]; then
  echo 'Expected: deploy <40-character commit SHA> or rollback <SHA>' >&2
  exit 2
fi
OP=${BASH_REMATCH[1]}
SHA=${BASH_REMATCH[2]}
IMAGE=edinayasreda:$SHA
exec 9>"$BASE/deploy.lock"
flock -w 1200 9
[[ -s "$BASE/runtime.env" ]] || { echo 'Missing runtime.env; deployment not activated.' >&2; exit 1; }
[[ -f "$BASE/activated" ]] || { echo 'Migration not activated; leaving existing sites unchanged.' >&2; exit 1; }
AVAILABLE=$(df -Pk "$BASE" | awk 'NR==2 {print $4}')
(( AVAILABLE > 5 * 1024 * 1024 )) || { echo 'Less than 5 GiB of free disk.' >&2; exit 1; }

if [[ "$OP" == deploy ]]; then
  gzip -dc | docker load > /dev/null
fi
REVISION=$(docker image inspect --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}' "$IMAGE")
[[ "$REVISION" == "$SHA" ]] || { echo 'Image revision mismatch.' >&2; exit 1; }

OLD_SLOT=$(cat "$BASE/active-slot" 2>/dev/null || true)
SLOT=blue
[[ "$OLD_SLOT" != blue ]] || SLOT=green
NAME=es-web-$SLOT
OLD_CONFIG="$BASE/upstream.before"
HAD_CONFIG=0
if [[ -f "$UPSTREAM" ]]; then
  cp "$UPSTREAM" "$OLD_CONFIG"
  HAD_CONFIG=1
fi
SWITCHED=0
COMMITTED=0
cleanup() {
  code=$?
  trap - EXIT INT TERM
  if (( COMMITTED == 0 )); then
    if (( SWITCHED == 1 )); then
      if (( HAD_CONFIG == 1 )); then
        cp "$OLD_CONFIG" "$UPSTREAM"
      else
        rm -f "$UPSTREAM"
      fi
      if ! { docker exec "$PROXY" nginx -t && docker exec "$PROXY" nginx -s reload; }; then
        echo 'URGENT: proxy rollback requires inspection; candidate kept alive.' >&2
        exit 1
      fi
    fi
    docker rm -f "$NAME" > /dev/null 2>&1 || true
  fi
  exit "$code"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# The other slot keeps serving while this candidate starts.
docker rm -f "$NAME" > /dev/null 2>&1 || true
docker run -d --name "$NAME" --network "$NETWORK" \
  --restart unless-stopped --init --memory 3g --memory-swap 3g --cpus 2 \
  --cap-drop ALL --security-opt no-new-privileges:true \
  --log-driver json-file --log-opt max-size=20m --log-opt max-file=3 \
  --env-file "$BASE/runtime.env" -e RELEASE_SHA="$SHA" \
  "$IMAGE" > /dev/null

check() {
  local target=$1
  local endpoint=${2:-http://$NAME:3000/api/deploy/health}
  docker exec "$target" node -e '
    const http=require("node:http");
    const req=http.get(process.argv[1],r=>{let b="";r.on("data",x=>b+=x);r.on("end",()=>{
      try {const d=JSON.parse(b);process.exit(r.statusCode===200&&d.ok===true&&d.revision===process.argv[2]?0:1)}
      catch {process.exit(1)}
    })});req.setTimeout(10000,()=>req.destroy());req.on("error",()=>process.exit(1));
  ' "$endpoint" "$SHA"
}
READY=0
for (( attempt=1; attempt<=18; attempt++ )); do
  if check "$NAME"; then READY=1; break; fi
  sleep 5
done
(( READY == 1 )) || { echo 'Candidate failed application/DB readiness; old version stays active.' >&2; exit 1; }

printf 'upstream edinayasreda_web {\n    server %s:3000;\n    keepalive 32;\n}\nserver {\n    listen 8088;\n    server_name _;\n    location = /api/deploy/health {\n        proxy_pass http://edinayasreda_web;\n        proxy_set_header Host xn--80aakbcct4b2aj7m.xn--p1ai;\n    }\n    location / { return 404; }\n}\n' "$NAME" > "$UPSTREAM.new"
chmod 644 "$UPSTREAM.new"
mv "$UPSTREAM.new" "$UPSTREAM"
SWITCHED=1
docker exec "$PROXY" nginx -t
docker exec "$PROXY" nginx -s reload
# Test the reloaded nginx route, not just direct container connectivity.
for (( attempt=1; attempt<=3; attempt++ )); do
  sleep 2
  check "$NAME" 'http://es-web-proxy:8088/api/deploy/health'
done
if [[ -s "$BASE/active-sha" ]]; then cp "$BASE/active-sha" "$BASE/previous-sha"; fi
printf '%s\n' "$SHA" > "$BASE/active-sha.new"
printf '%s\n' "$SLOT" > "$BASE/active-slot.new"
mv "$BASE/active-sha.new" "$BASE/active-sha"
mv "$BASE/active-slot.new" "$BASE/active-slot"
COMMITTED=1
echo "Ready: $NAME commit=$SHA"
# Keep the active release, rollback release and one extra image. Never prune
# Docker globally: PDF, speech and the other site's proxy share this VPS.
PREVIOUS_SHA=$(cat "$BASE/previous-sha" 2>/dev/null || true)
EXTRA_KEPT=0
while IFS= read -r image_sha; do
  [[ "$image_sha" =~ ^[0-9a-f]{40}$ ]] || continue
  [[ "$image_sha" != "$SHA" && "$image_sha" != "$PREVIOUS_SHA" ]] || continue
  if (( EXTRA_KEPT == 0 )); then
    EXTRA_KEPT=1
  else
    docker image rm "edinayasreda:$image_sha" > /dev/null 2>&1 || true
  fi
done < <(docker image ls edinayasreda --format '{{.Tag}}')
