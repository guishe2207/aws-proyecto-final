resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

# Instancia principal: Single-AZ por las restricciones IAM de AWS Academy.
# Mantiene backups automáticos para habilitar la réplica de lectura.
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-postgres"

  engine         = "postgres"
  engine_version = "16.13"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 20
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.database_name
  username = var.database_username
  password = var.database_password
  port     = 5432

  availability_zone      = var.availability_zones[0]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]
  publicly_accessible    = false
  multi_az               = false

  backup_retention_period   = 7
  delete_automated_backups  = false
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.project_name}-final-snapshot"

  tags = {
    Name        = "${var.project_name}-postgres"
    Environment = var.environment
    Role        = "primary"
  }
}

# Réplica PostgreSQL asíncrona y de solo lectura en la segunda AZ.
# No proporciona failover automático; se promueve manualmente si se requiere.