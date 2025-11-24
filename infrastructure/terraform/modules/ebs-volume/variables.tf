variable "availability_zone" {
  description = "The AZ where the EBS volume will exist"
  type        = string
}

variable "size" {
  description = "The size of the drive in GiBs"
  type        = number
}

variable "type" {
  description = "The type of EBS volume"
  type        = string
  default     = "gp3"
}

variable "encrypted" {
  description = "Whether the volume should be encrypted"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to the volume"
  type        = map(string)
  default     = {}
}

variable "device_name" {
  description = "The device name to expose to the instance (e.g. /dev/sdh)"
  type        = string
  default     = "/dev/sdf"
}

variable "instance_id" {
  description = "The ID of the instance to attach the volume to"
  type        = string
}

variable "force_detach" {
  description = "Set to true if you want to force the volume to detach"
  type        = bool
  default     = false
}
