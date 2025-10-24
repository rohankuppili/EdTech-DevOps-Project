# ================================
# AWS Key Pair
# ================================
resource "aws_key_pair" "deployer" {
  key_name   = "edtechkp-terraform"             # new unique key name
  public_key = file("/home/rohan/edtechkp.pub") # path inside WSL
}

# ================================
# Security Group
# ================================
resource "aws_security_group" "web_sg" {
  name        = "edtech-sg"
  description = "Allow required ports for EdTech app"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ================================
# EC2 Instance
# ================================
resource "aws_instance" "app_server" {
  ami             = "ami-00e73adb2e2c80366"
  instance_type   = "t3.micro"
  key_name        = aws_key_pair.deployer.key_name
  security_groups = [aws_security_group.web_sg.name]

  tags = {
    Name = "edtech-server"
  }
}

# ================================
# Output
# ================================
output "ec2_public_ip" {
  value = aws_instance.app_server.public_ip
}
