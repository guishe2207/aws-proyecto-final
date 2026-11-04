variable "aws_region" {
  description = "Región AWS"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "tienda-modular"
}

variable "environment" {
  description = "Entorno"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR de la VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Dos zonas de disponibilidad"
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
  description = "Usuario administrador PostgreSQL"
  type        = string
  default     = "tienda_admin"
}

variable "database_password" {
  description = "Contraseña PostgreSQL desde TF_VAR_database_password"
  type        = string
  sensitive   = true
}

variable "frontend_origin" {
  description = "Origen público permitido por CORS"
  type        = string
  default     = "https://tienda-modular-frontend.onrender.com"
}
