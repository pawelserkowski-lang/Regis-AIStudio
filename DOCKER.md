# 🐳 Regis AI Studio - Docker Guide

Complete guide for running Regis AI Studio with Docker.

## 📋 Prerequisites

- **Docker** 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose** 2.0+ (Usually included with Docker Desktop)
- **API Keys**:
  - Anthropic API Key (for Claude models)
  - Google API Key (optional, for Gemini models)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/pawelserkowski-lang/Regis-AIStudio.git
cd Regis-AIStudio
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
# Copy the example environment file
cp .env.example .env

# Edit with your API keys
nano .env  # or use your favorite editor
```

Add your API keys:

```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
GOOGLE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXX
```

### 3. Build and Run

```bash
# Build and start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### 4. Access the Application

Open your browser and navigate to:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/api/health

## 📦 Docker Commands Reference

### Building

```bash
# Build the image
docker-compose build

# Build without cache (clean build)
docker-compose build --no-cache

# Build specific service
docker-compose build regis-app
```

### Running

```bash
# Start all services
docker-compose up

# Start in detached mode (background)
docker-compose up -d

# Start and rebuild if needed
docker-compose up --build
```

### Stopping

```bash
# Stop services (keeps data)
docker-compose stop

# Stop and remove containers (keeps volumes)
docker-compose down

# Stop, remove containers and volumes (clean slate)
docker-compose down -v
```

### Monitoring

```bash
# View logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View logs for specific service
docker-compose logs -f regis-app

# Check status
docker-compose ps

# View resource usage
docker stats
```

### Maintenance

```bash
# Execute command in running container
docker-compose exec regis-app bash

# Access Python shell
docker-compose exec regis-app python

# Restart services
docker-compose restart

# View container details
docker-compose ps
docker inspect regis-ai-studio
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `ANTHROPIC_API_KEY` | Claude API key | Yes | - |
| `GOOGLE_API_KEY` | Gemini API key | No | - |
| `PORT` | Backend port | No | 8000 |
| `NODE_ENV` | Environment mode | No | production |

### Volume Mounts

The application uses Docker volumes to persist data:

- `regis-data`: User data, chat history, snippets, etc.

To backup data:

```bash
# Backup volume
docker run --rm -v regis-data:/data -v $(pwd):/backup alpine tar czf /backup/regis-backup.tar.gz /data

# Restore volume
docker run --rm -v regis-data:/data -v $(pwd):/backup alpine tar xzf /backup/regis-backup.tar.gz -C /
```

### Resource Limits

Edit `docker-compose.yml` to adjust resource limits:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'      # Max 2 CPU cores
      memory: 2G     # Max 2GB RAM
    reservations:
      cpus: '1'      # Reserve 1 CPU core
      memory: 512M   # Reserve 512MB RAM
```

## 🛠️ Development Mode

For development with hot-reload:

1. Uncomment the volume mounts in `docker-compose.yml`:

```yaml
volumes:
  - ./src:/app/src
  - ./api:/app/api
```

2. Run in development mode:

```bash
docker-compose up
```

Changes to source files will be reflected immediately.

## 🔍 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs regis-app

# Verify environment variables
docker-compose config

# Remove and rebuild
docker-compose down -v
docker-compose up --build
```

### Port already in use

```bash
# Find what's using the port
lsof -i :8000  # Linux/Mac
netstat -ano | findstr :8000  # Windows

# Change port in docker-compose.yml
ports:
  - "8001:8000"  # Use port 8001 instead
```

### Permission issues

```bash
# Fix permissions
sudo chown -R $USER:$USER .

# Reset volumes
docker-compose down -v
docker-compose up
```

### API keys not working

```bash
# Verify .env file exists
cat .env

# Restart containers
docker-compose restart

# Check environment variables in container
docker-compose exec regis-app env | grep API_KEY
```

### Out of disk space

```bash
# Clean up unused Docker resources
docker system prune -a

# Remove old images
docker image prune -a

# Remove unused volumes
docker volume prune
```

## 🚀 Production Deployment

### With Nginx Reverse Proxy

1. Uncomment the nginx service in `docker-compose.yml`
2. Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server regis-app:8000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

3. Start with nginx:

```bash
docker-compose up -d
```

### Security Best Practices

1. **Never commit .env file**
   ```bash
   echo ".env" >> .gitignore
   ```

2. **Use secrets management**
   ```bash
   # Use Docker secrets instead of environment variables
   docker secret create anthropic_key ./anthropic_key.txt
   ```

3. **Regular updates**
   ```bash
   # Update base images
   docker-compose pull
   docker-compose up -d
   ```

4. **Scan for vulnerabilities**
   ```bash
   docker scan regis-ai-studio
   ```

## 📊 Monitoring

### Health Checks

The application includes built-in health checks:

```bash
# Check health status
curl http://localhost:8000/api/health

# View health check logs
docker inspect --format='{{json .State.Health}}' regis-ai-studio | jq
```

### Logs

```bash
# Export logs
docker-compose logs > regis-logs.txt

# View logs with timestamps
docker-compose logs -t

# View last 100 lines
docker-compose logs --tail=100
```

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/pawelserkowski-lang/Regis-AIStudio/issues)
- **Documentation**: [Main README](README.md)
- **Discord**: [Join our community](https://discord.gg/regis)

---

Made with ❤️ by the Regis AI Studio team
