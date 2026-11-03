output "vpc_id" {
  description = "ID de la VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs de las subredes públicas"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs de las subredes privadas"
  value       = aws_subnet.private[*].id
}

output "alb_dns_name" {
  description = "DNS público del balanceador"
  value       = aws_lb.main.dns_name
}

output "rds_endpoint" {
  description = "Endpoint de la base de datos"
  value       = aws_db_instance.main.address
}

output "rds_port" {
  description = "Puerto de PostgreSQL"
  value       = aws_db_instance.main.port
}