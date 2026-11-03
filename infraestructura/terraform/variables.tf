variable "aws_region" {
  description = "Región de AWS donde se desplegará la infraestructura"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "tienda-modular"
}

variable "environment" {
  description = "Entorno de despliegue"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "Rango CIDR de la VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Zonas de disponibilidad"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "instance_type" {
  description = "Tipo de instancia EC2"
  type        = string
  default     = "t3.micro"
}

variable "database_name" {
  description = "Nombre de la base de datos PostgreSQL"
  type        = string
  default     = "tienda_modular"
}

variable "database_username" {
  description = "Usuario administrador de PostgreSQL"
  type        = string
  default     = "tienda_admin"
}

variable "database_password" {
  description = "Contraseña de PostgreSQL"
  type        = string
  sensitive   = true
}