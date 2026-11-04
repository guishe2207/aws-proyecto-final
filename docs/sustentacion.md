# Guion de sustentación — Proyecto de infraestructura AWS

**Duración objetivo:** 8 a 9 minutos.
**Proyecto:** Tienda Modular.
**Nota:** distribuir los bloques entre los integrantes del grupo. Los nombres pueden agregarse antes de grabar.

## 0:00–1:00 — Presentación y objetivo

“Buenos días. Vamos a presentar la infraestructura desplegada para el proyecto Tienda Modular.

El objetivo fue publicar una API funcional en AWS, distribuir las solicitudes entre varias instancias, proteger la base de datos dentro de una red privada y administrar la infraestructura mediante código con Terraform.

También realizamos pruebas de backend, frontend y rendimiento, para verificar tanto el funcionamiento de la aplicación como el comportamiento del servicio desplegado.”

## 1:00–2:30 — Arquitectura de red

“La infraestructura se encuentra en la región us-east-1 y utiliza una VPC con dos zonas de disponibilidad: us-east-1a y us-east-1b.

Separamos la red en subredes públicas y privadas. El Application Load Balancer está en las subredes públicas, mientras que las dos instancias EC2 del backend se encuentran en subredes privadas.

El balanceador recibe las solicitudes por HTTP en el puerto 80 y las distribuye hacia el puerto 3000 del backend. Las instancias pertenecen a un Auto Scaling Group que mantiene dos servidores, uno en cada zona.

La base de datos PostgreSQL está en una red privada y no tiene acceso público. Para las conexiones salientes de las instancias privadas utilizamos un NAT Gateway.”

## 2:30–3:45 — Terraform e infraestructura como código

“Utilizamos Terraform para definir los recursos de infraestructura: VPC, subredes, tablas de rutas, Internet Gateway, NAT Gateway, grupos de seguridad, balanceador, Target Group, Auto Scaling y RDS.

La ventaja de este enfoque es que la infraestructura queda descrita en archivos versionables y reproducibles.

Ejecutamos terraform init para inicializar los proveedores, terraform fmt para revisar el formato, terraform validate para comprobar la configuración y terraform plan para comparar la configuración con los recursos existentes.

La validación terminó correctamente y el plan indicó que no había cambios pendientes. Por eso no fue necesario volver a aplicar la infraestructura.”

## 3:45–5:00 — Funcionamiento y seguridad

“Comprobamos el endpoint de salud de la API a través del DNS público del balanceador.

La respuesta fue HTTP 200, con el estado de la aplicación en ok y la base de datos conectada. También verificamos que Swagger y la especificación OpenAPI respondieran correctamente.

En seguridad, el ALB permite el acceso público por el puerto 80. El backend únicamente admite el puerto 3000 desde el grupo de seguridad del balanceador.

A su vez, PostgreSQL solamente acepta conexiones por el puerto 5432 desde el grupo de seguridad del backend. La base de datos tiene PubliclyAccessible en false.

De esta manera, no exponemos directamente ni los servidores de aplicación ni la base de datos a Internet.”

## 5:00–6:15 — Pruebas automatizadas y CI

“En el backend ejecutamos las pruebas con Node.js y Supertest. Se aprobaron 16 pruebas que cubren aspectos como Swagger, autenticación, CSRF, Helmet, CORS, validación de datos y manejo de errores.

En el frontend realizamos la compilación de Angular y ejecutamos las pruebas automatizadas. Las siete pruebas finalizaron correctamente.

También preparamos GitHub Actions para ejecutar validaciones del backend, frontend y Terraform, y empaquetar los archivos del proyecto.

Este pipeline corresponde a integración continua y preparación de artefactos. El despliegue a AWS Academy se mantiene controlado y no se realiza automáticamente desde GitHub Actions.”

## 6:15–7:30 — Rendimiento y alta disponibilidad

“Para comprobar el comportamiento del servicio usamos k6. La prueba se ejecutó durante aproximadamente tres minutos, con un máximo de diez usuarios virtuales, realizando solicitudes al endpoint de salud.

Obtuvimos 707 solicitudes HTTP, cero solicitudes fallidas y un cien por ciento de comprobaciones exitosas.

El tiempo promedio fue de aproximadamente 85 milisegundos y el percentil 95 fue de 100,62 milisegundos, por debajo del umbral de 1.500 milisegundos definido en el script.

También comprobamos que el balanceador tuviera dos destinos saludables y que el Auto Scaling Group mantuviera las dos instancias en estado InService y Healthy, distribuidas entre las dos zonas de disponibilidad.”

## 7:30–8:45 — Limitaciones y conclusión

“Durante el despliegue encontramos restricciones de permisos propias de AWS Academy.

En particular, la cuenta denegó explícitamente la creación de una Read Replica de PostgreSQL. Por eso la base de datos que está funcionando es una instancia principal privada, configurada como Single-AZ. No afirmamos que exista replicación ni failover automático de la base de datos.

De igual forma, el balanceador tiene un listener HTTP en el puerto 80. No configuramos HTTPS porque no contamos con un dominio y certificado ACM validados.

A pesar de esas restricciones, comprobamos el funcionamiento del backend, la conexión con PostgreSQL, la distribución del tráfico, las reglas de seguridad, las dos instancias saludables, las pruebas automatizadas y el resultado de rendimiento.

Con esto concluimos que tenemos una infraestructura funcional, documentada y administrada mediante Terraform, con las limitaciones de la cuenta claramente identificadas. Muchas gracias.”