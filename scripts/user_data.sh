#!/bin/bash
set -euo pipefail
exec > >(tee /var/log/tienda-user-data.log | logger -t user-data -s 2>/dev/console) 2>&1

REGION="${region}"
REPO_URL="${repo_url}"
DB_HOST="${db_host}"
DB_NAME="${db_name}"
DB_USER="${db_user}"
FRONTEND_ORIGIN="${frontend_origin}"
APP_DIR="/opt/tienda-modular"
BACKEND_DIR="$APP_DIR/repo/app/backend"

log() { echo "[$(date -Is)] $*"; }
log "Instalando dependencias del backend..."
dnf update -y
dnf install -y git nodejs22 python3 curl --allowerasing

mkdir -p "$APP_DIR"
git clone --depth 1 "$REPO_URL" "$APP_DIR/repo"
cd "$BACKEND_DIR"
npm ci --omit=dev

log "Consultando parametros de configuracion desde Parameter Store..."
DB_PASSWORD=$(aws ssm get-parameter --name "/tienda-modular/dev/db-password" --with-decryption --query "Parameter.Value" --output text --region "$REGION")
CSRF_SECRET=$(aws ssm get-parameter --name "/tienda-modular/dev/csrf-secret" --with-decryption --query "Parameter.Value" --output text --region "$REGION")
ADMIN_USERNAME=$(aws ssm get-parameter --name "/tienda-modular/dev/admin-username" --with-decryption --query "Parameter.Value" --output text --region "$REGION")
ADMIN_PASSWORD=$(aws ssm get-parameter --name "/tienda-modular/dev/admin-password" --with-decryption --query "Parameter.Value" --output text --region "$REGION")

curl -fsSLo /etc/pki/tls/certs/rds-global-bundle.pem \
  https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# Variables exportadas solo para inicializacion; los valores no se imprimen en el log.
export NODE_ENV=production PORT=3000
export PGHOST="$DB_HOST" PGPORT=5432 PGDATABASE="$DB_NAME" PGUSER="$DB_USER"
export PGPASSWORD="$DB_PASSWORD" PGSSL=true PGSSL_REJECT_UNAUTHORIZED=true
export PGSSL_CA_PATH=/etc/pki/tls/certs/rds-global-bundle.pem
export CSRF_SECRET="$CSRF_SECRET"
export ADMIN_USUARIO="$ADMIN_USERNAME" ADMIN_PASSWORD="$ADMIN_PASSWORD"
export CORS_ORIGIN="$FRONTEND_ORIGIN"

# EnvironmentFile de systemd; se escapan comillas y barras para valores especiales.
mkdir -p /etc/tienda-modular
umask 077
python3 - <<'PYENV'
import os
from pathlib import Path

keys = [
    "NODE_ENV", "PORT", "PGHOST", "PGPORT", "PGDATABASE", "PGUSER",
    "PGPASSWORD", "PGSSL", "PGSSL_REJECT_UNAUTHORIZED", "PGSSL_CA_PATH",
    "CSRF_SECRET", "ADMIN_USUARIO", "ADMIN_PASSWORD", "CORS_ORIGIN",
]

def quote(value: str) -> str:
    if "\n" in value or "\r" in value:
        raise ValueError("Los parametros de entorno no pueden contener saltos de linea")
    value = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{value}"'

path = Path("/etc/tienda-modular/backend.env")
path.write_text("".join(f"{key}={quote(os.environ[key])}\n" for key in keys), encoding="utf-8")
PYENV
chmod 600 /etc/tienda-modular/backend.env

log "Inicializando esquema y datos base..."
node <<'NODE'
const fs = require('node:fs');
const { Client } = require('pg');
const { database } = require('./src/config/env');

(async () => {
  const client = new Client(database);
  let lockAcquired = false;
  try {
    await client.connect();
    // El ASG puede arrancar ambas instancias simultáneamente. El advisory lock
    // serializa schema/seed/alta de administrador para evitar inserciones duplicadas.
    await client.query('SELECT pg_advisory_lock($1)', [73190421]);
    lockAcquired = true;

    await client.query(fs.readFileSync('./database/schema.sql', 'utf8'));
    await client.query(fs.readFileSync('./database/seed.sql', 'utf8'));
    const username = process.env.ADMIN_USUARIO;
    const result = await client.query(
      'SELECT id_usuario FROM usuarios_admin WHERE usuario = $1', [username]
    );
    if (result.rowCount === 0) {
      const { hashPassword } = require('./src/security/password');
      const hash = hashPassword(process.env.ADMIN_PASSWORD);
      await client.query(
        'INSERT INTO usuarios_admin (usuario, password_hash) VALUES ($1, $2)',
        [username, hash]
      );
    }
    console.log('Base de datos inicializada correctamente.');
  } finally {
    if (lockAcquired) {
      await client.query('SELECT pg_advisory_unlock($1)', [73190421]).catch(() => {});
    }
    await client.end();
  }
})().catch((error) => {
  console.error('Error inicializando base de datos:', error.message);
  process.exit(1);
});
NODE

unset DB_PASSWORD CSRF_SECRET ADMIN_USERNAME ADMIN_PASSWORD PGPASSWORD ADMIN_USUARIO

cat > /etc/systemd/system/tienda-backend.service <<'SERVICE'
[Unit]
Description=Tienda Modular Backend
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/opt/tienda-modular/repo/app/backend
EnvironmentFile=/etc/tienda-modular/backend.env
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=5
User=root

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable tienda-backend
systemctl start tienda-backend
log "Backend configurado."
