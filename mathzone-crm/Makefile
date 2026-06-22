.PHONY: help dev prod stop clean logs migrate seed backup

help: ## Show this help message
	@echo "Mathzone CRM - Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev: ## Start development environment
	@echo "🚀 Starting development environment..."
	@cp -n .env.example .env 2>/dev/null || true
	docker-compose up -d
	@echo "✅ Development environment started!"
	@echo "Backend: http://localhost:3000"
	@echo "Frontend: Open frontend/CRM_full/login.html with Live Server"

prod: ## Start production environment
	@echo "🚀 Starting production environment..."
	@if [ ! -f .env ]; then echo "❌ .env file not found! Copy .env.example and configure it."; exit 1; fi
	docker-compose -f docker-compose.prod.yml up -d --build
	@echo "✅ Production environment started!"

stop: ## Stop all containers
	@echo "🛑 Stopping containers..."
	docker-compose down
	docker-compose -f docker-compose.prod.yml down

clean: ## Stop containers and remove volumes
	@echo "🗑️  Cleaning up..."
	docker-compose down -v
	docker-compose -f docker-compose.prod.yml down -v
	@echo "✅ Cleanup complete!"

logs: ## Show backend logs
	docker-compose logs -f backend

logs-db: ## Show database logs
	docker-compose logs -f postgres

migrate: ## Run database migrations
	@echo "🔄 Running migrations..."
	docker-compose exec backend npx prisma migrate deploy

seed: ## Seed database with demo data
	@echo "🌱 Seeding database..."
	docker-compose exec backend npm run seed

backup: ## Backup database
	@echo "💾 Creating database backup..."
	@mkdir -p ./backups
	docker-compose exec postgres pg_dump -U postgres mathzone_crm > ./backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup created in ./backups/"

restore: ## Restore database from backup (Usage: make restore FILE=backups/backup_xxx.sql)
	@if [ -z "$(FILE)" ]; then echo "❌ Usage: make restore FILE=backups/backup_xxx.sql"; exit 1; fi
	@echo "🔄 Restoring database from $(FILE)..."
	docker-compose exec -T postgres psql -U postgres mathzone_crm < $(FILE)
	@echo "✅ Database restored!"

shell-backend: ## Open shell in backend container
	docker-compose exec backend sh

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U postgres mathzone_crm

status: ## Show status of all services
	@echo "📊 Service Status:"
	@docker-compose ps

rebuild: ## Rebuild and restart containers
	@echo "🔨 Rebuilding containers..."
	docker-compose down
	docker-compose up -d --build
	@echo "✅ Rebuild complete!"
