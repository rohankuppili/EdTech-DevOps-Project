pipeline {
    agent any

    environment {
        AWS_REGION = "ap-northeast-2"
        DOCKERHUB_REPO = "rohankuppili/tutorly-space-main"
        SSH_KEY = "~/.ssh/edtechkp.pem"
        ANSIBLE_DIR = "infrastructure/ansible"
        TERRAFORM_DIR = "infrastructure/terraform"
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/rohankuppili/EdTech-DevOps-Project.git'
            }
        }

        stage('Setup Terraform') {
            steps {
                dir("${TERRAFORM_DIR}") {
                    sh 'terraform init'
                    sh 'terraform apply -auto-approve'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh 'npm install'
                    sh 'npm run build || echo "No backend build step"'
                }
            }
        }

        stage('Docker Build & Push') {
            steps {
                script {
                    sh '''
                    docker build -t ${DOCKERHUB_REPO}:latest .
                    echo $DOCKERHUB_PASS | docker login -u $DOCKERHUB_USER --password-stdin
                    docker push ${DOCKERHUB_REPO}:latest
                    '''
                }
            }
        }

        stage('Deploy with Ansible') {
            steps {
                dir("${ANSIBLE_DIR}") {
                    sh '''
                    ansible-playbook -i inventory.ini deploy.yml \
                    --private-key ${SSH_KEY} --user ubuntu
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful!"
        }
        failure {
            echo "❌ Deployment failed. Check logs in Jenkins."
        }
    }
}
