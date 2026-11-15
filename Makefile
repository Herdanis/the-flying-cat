.DEFAULT_GOAL := up
PORT ?= 8080

.PHONY: up down logs test dev

up:
	PORT=$(PORT) docker compose up -d --build
	@echo "Dino Ladder running at http://localhost:$(PORT)"

down:
	docker compose down

logs:
	docker compose logs -f web

test:
	npm test

dev:
	npm run dev
