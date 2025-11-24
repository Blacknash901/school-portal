resource "local_file" "ansible_inventory" {
  content = <<-EOT
    all:
      hosts:
        production-server:
          ansible_host: ${aws_eip.lb.public_ip}
          ansible_user: ubuntu
          ansible_ssh_private_key_file: ${abspath("${path.module}/../../deployment/ansible/private_key.pem")}
          ansible_ssh_common_args: "-o StrictHostKeyChecking=no"
          ansible_python_interpreter: /usr/bin/python3
          ebs_volume_id: ${module.ebs_volume.volume_id}
  EOT
  filename = "${path.module}/../../deployment/ansible/inventory.generated.yml"
}

resource "local_file" "private_key" {
  content         = tls_private_key.ssh_key.private_key_pem
  filename        = "${path.module}/../../deployment/ansible/private_key.pem"
  file_permission = "0600"
}
