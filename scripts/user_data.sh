#!/bin/bash
set -euo pipefail

exec > >(tee /var/log/tienda-user-data.log | logger -t user-data -s 2>/dev/console) 2>&1

REGION="${region}"
REPO_URL="${repo_url}"
APP_DIR="/opt/tienda-modular"
BACKEND_DIR="$APP_DIR/app/backend"

echo "Iniciando configuracion del backend..."

# Instalar dependencias
dnf update -y
dnf install -y git nodejs22 curl

# Descargar el proyecto
mkdir -p "$APP_DIR"
git clone --depth 1 "$REPO_URL" "$APP_DIR/repo"
BACKEND_DIR="$APP_DIR/repo/app/backend"

cd "$BACKEND_DIR"
npm ci --omit=dev

# Obtener secretos desde AWS Systems Manager Parameter Store
DB_PASSWORD=$(aws ssm get-parameter \
  --name "/tienda-modular/dev/db-password" \
  --query "Parameter.Value" --output text --region "$REGION")

CSRF_SECRET=$(aws ssm get-parameter \
  --name "/tienda-modular/dev/csrf-secret" \
  --query "Parameter.Value" --output text --region "$REGION")

ADMIN_USERNAME=$(aws ssm get-parameter \
  --name "/tienda-modular/dev/admin-username" \
  --query "Parameter.Value" --output text --region "$REGION")

ADMIN_PASSWORD=$(aws ssm get-parameter \
  --name "/tienda-modular/dev/admin-password" \
  --query "Parameter.Value" --output text --region "$REGION")

# Configurar conexion segura a PostgreSQL
curl -fsSLo /etc/pki/tls/certs/rds-global-bundle.pem \
  https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

mkdir -p /etc/tienda-modular
umask 077

cat > /etc/tienda-modular/backend.env <<EOF
NODE_ENV=production
PORT=3000
PGHOST="${db_host}"
PGPORT=5432
PGDATABASE="${db_name}"
PGUSER="${db_user}"
PGPASSWORD=$DB_PASSWORD
PGSSL=true
PGSSL_REJECT_UNAUTHORIZED=true
PGSSL_CA_PATH=/etc/pki/tls/certs/rds-global-bundle.pem
CSRF_SECRET=$CSRF_SECRET
ADMIN_USUARIO=$ADMIN_USERNAME
ADMIN_PASSWORD=$ADMIN_PASSWORD
CORS_ORIGIN=http://localhost:4200
EOF

unset DB_PASSWORD CSRF_SECRET ADMIN_USERNAME ADMIN_PASSWORD

# Crear tablas e insertar datos iniciales
set -a
source /etc/tienda-modular/backend.env
set +a

node <<'NODE'
const fs = require('node:fs');
const { Client } = require('pg');
const { database } = require('./src/config/env');

(async () => {
  const client = new Client(database);
  try {
    await client.connect();
    await client.query(fs.readFileSync('./database/schema.sql', 'utf8'));
    await client.query(fs.readFileSync('./database/seed.sql', 'utf8'));

    const username = process.env.ADMIN_USUARIO;
    const result = await client.query(
      'SELECT id_usuario FROM usuarios_admin WHERE usuario = $1',
      [username]
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
    await client.end();
  }
})().catch(error => {
  console.error('Error inicializando la base de datos:', error.message);
  process.exit(1);
});
NODE

# Configurar servicio persistente
cat > /etc/systemd/system/tienda-backend.service <<EOF
[Unit]
Description=Tienda Modular Backend
After=network.target

[Service]
Type=simple
WorkingDirectory=$BACKEND_DIR
EnvironmentFile=/etc/tienda-modular/backend.env
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=5
User=root

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable tienda-backend
systemctl start tienda-backend

echo "Configuracion del backend finalizada."
