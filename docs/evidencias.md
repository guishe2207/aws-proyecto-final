# Evidencias y validaciones — Tienda Modular

Fecha de las validaciones: 4 de noviembre de 2026.

Este documento registra resultados observados durante la validación de la infraestructura y el proyecto. Las pruebas locales, las consultas de AWS y las verificaciones pendientes se distinguen expresamente.

## 1. Servicio y API

| Requisito | Evidencia obtenida | Resultado |
|---|---|---|
| Servicio público | DNS del ALB y consulta HTTP | Verificado |
| Salud de API y DB | `GET /api/health` | HTTP 200; `status=ok`; `database=connected` |
| Swagger UI | Consulta a `/api-docs/` | HTTP 200 |
| OpenAPI | Consulta a `/api-docs/openapi.json` | HTTP 200 |

## 2. Balanceador y alta disponibilidad de aplicación

| Elemento | Resultado observado |
|---|---|
| Application Load Balancer | `active` |
| Esquema | `internet-facing` |
| Zonas del ALB | `us-east-1a` y `us-east-1b` |
| Listener | HTTP, puerto 80 |
| Target 1 | `i-015dbba1e35da22d0`, puerto 3000, `healthy` |
| Target 2 | `i-0102e8d6d492c3bdf`, puerto 3000, `healthy` |
| Auto Scaling deseado/mínimo/máximo | 2 / 2 / 2 |
| Estado de las instancias | Ambas `InService` y `Healthy` |
| Distribución | Una instancia en cada zona |

Estos resultados demuestran que dos instancias de aplicación estaban registradas y saludables detrás del ALB durante la comprobación. No equivalen a una prueba de recuperación ante la terminación forzada de una instancia.

## 3. Base de datos y seguridad

La consulta a RDS confirmó:

- Motor PostgreSQL, versión 16.13.
- Clase `db.t3.micro`.
- Estado `available`.
- `PubliclyAccessible = false`.
- `MultiAZ = false`.
- Instancia principal ubicada en `us-east-1a`.

Las reglas de seguridad verificadas fueron:

| Grupo | Puerto | Origen permitido |
|---|---:|---|
| ALB | 80 | `0.0.0.0/0` |
| Backend | 3000 | Security Group del ALB |
| PostgreSQL | 5432 | Security Group del backend |

No se observaron reglas CIDR públicas para acceder directamente al backend o a PostgreSQL.

## 4. Backend

Comandos ejecutados:

```powershell
npm --prefix app/backend run check
npm --prefix app/backend test
```

Resultado de `node --test`:

- Pruebas totales: 16.
- Exitosas: 16.
- Fallidas: 0.
- Canceladas: 0.

La cobertura comprobada incluye Swagger/OpenAPI, formato de errores, validaciones de IDs y productos, autenticación, CSRF, Helmet, CORS, hash de contraseñas, límites numéricos y filtro por categoría.

## 5. Frontend

Comandos ejecutados:

```powershell
npm --prefix app/frontend run build
npm --prefix app/frontend test -- --watch=false
```

Resultados:

- Compilación Angular: exitosa.
- Archivos de prueba: 2 aprobados.
- Pruebas: 7 aprobadas y 0 fallidas.

La compilación presentó una advertencia: `src/app/catalog.scss` supera el presupuesto de estilos de 6 KB por 230 bytes. La compilación terminó correctamente.

## 6. Terraform

Comandos ejecutados:

```powershell
terraform fmt -recursive
terraform init -backend=false -input=false
terraform validate
terraform plan
```

Resultados observados:

- Formato: comprobación ejecutada correctamente.
- Inicialización: exitosa.
- Validación: `Success! The configuration is valid.`
- Plan: `No changes. Your infrastructure matches the configuration.`

Se retiró de la configuración la definición de Read Replica porque AWS Academy denegó explícitamente su creación. El estado de Terraform no contenía ese recurso y el plan posterior no propuso cambios en la infraestructura existente.

No se ejecutó un nuevo `terraform apply` durante esta validación.

## 7. Prueba de carga con k6

Script utilizado: `tests/load-test.js`.

Endpoint medido: `GET /api/health`.

Configuración: etapas progresivas de 1, 5 y 10 usuarios virtuales, con duración total aproximada de tres minutos.

Resultados:

| Métrica | Resultado |
|---|---:|
| Solicitudes HTTP | 707 |
| Usuarios virtuales máximos | 10 |
| Duración observada | 3 min 0,6 s |
| Tiempo promedio | 85,13 ms |
| Mediana | 83,17 ms |
| Percentil 90 | 89,14 ms |
| Percentil 95 | 100,62 ms |
| Tiempo máximo | 213,14 ms |
| Solicitudes fallidas | 0 % |
| Comprobaciones exitosas | 2.121 de 2.121 (100 %) |
| Iteraciones interrumpidas | 0 |

Umbrales definidos y cumplidos:
- `http_req_failed`: menor a 2 %.
- `http_req_duration p(95)`: menor a 1.500 ms.
- `checks`: superior a 98 %.

El resultado valida el endpoint de salud bajo la carga descrita. No debe extrapolarse como rendimiento de todas las funcionalidades del sistema ni como prueba de escritura intensiva en PostgreSQL.

El resumen JSON se conserva en `tests/k6-summary.json`.

## 8. GitHub Actions

El workflow `.github/workflows/deploy.yml` contiene trabajos de backend, frontend, Terraform y empaquetado.

Las validaciones correspondientes se ejecutaron localmente y aprobaron. La ejecución remota del workflow deberá comprobarse en la pestaña Actions de GitHub después de publicar los cambios.

El workflow prepara artefactos, pero no realiza un despliegue automático a AWS.

## 9. Limitaciones pendientes

- **Réplica RDS:** no creada. AWS Academy denegó `rds:CreateDBInstanceReadReplica` mediante una política explícita.
- **Multi-AZ de RDS:** desactivado.
- **HTTPS:** no configurado. El listener observado es HTTP 80.
- **CloudWatch:** no se adjuntan métricas históricas de CPU, conexiones o tiempos de respuesta; no se presentan como comprobadas.
- **Prueba de fallo:** no se ejecutó una terminación controlada de instancia para demostrar recuperación automática del ASG.
- **Frontend:** la prueba k6 se limitó al endpoint de salud del backend.

## 10. Evidencias visuales por anexar

Se recomienda guardar capturas de:
1. Respuesta HTTP 200 del endpoint de salud.
2. ALB activo y listener HTTP 80.
3. Target Group con los dos destinos saludables.
4. Auto Scaling Group con dos instancias `InService`.
5. RDS disponible y sin acceso público.
6. Reglas de los tres Security Groups.
7. Salida de `terraform validate` y `terraform plan`.
8. Pruebas del backend y frontend.
9. Resumen de k6.
10. Ejecución aprobada de GitHub Actions, una vez publicada.