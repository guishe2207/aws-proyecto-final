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
  description = "Endpoint privado de RDS"
  value       = aws_db_instance.main.address
}

output "rds_port" {
  description = "Puerto PostgreSQL"
  value       = aws_db_instance.main.port
}

output "nat_gateway_id" {
  description = "NAT Gateway de salida"
  value       = aws_nat_gateway.main.id
}
