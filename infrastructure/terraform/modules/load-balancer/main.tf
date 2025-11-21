resource "aws_lb" "main" {
  name               = "${var.project}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = var.security_groups
  subnets            = var.subnets

  tags = merge(
    var.tags,
    {
      Name = "${var.project}-${var.environment}-alb"
    }
  )
}

resource "aws_lb_target_group" "main" {
  name     = "${var.project}-${var.environment}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 10
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project}-${var.environment}-tg"
    }
  )
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

resource "aws_lb_target_group_attachment" "main" {
  count            = length(var.target_instance_ids)
  target_group_arn = aws_lb_target_group.main.arn
  target_id        = var.target_instance_ids[count.index]
  port             = 80
}