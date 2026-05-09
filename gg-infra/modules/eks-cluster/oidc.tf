# OIDC provider — enables IRSA (IAM Roles for Service Accounts).
# Every service that needs AWS credentials uses this instead of node-level IAM.

data "tls_certificate" "eks" {
  url = aws_eks_cluster.this.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "this" {
  url             = aws_eks_cluster.this.identity[0].oidc[0].issuer
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  tags            = merge(var.tags, { Name = "${var.cluster_name}-oidc" })
}
