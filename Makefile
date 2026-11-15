.DEFAULT_GOAL := up
PORT ?= 8080  # compose pins 8080:80, so this only moves the printed URL

.PHONY: up down logs test dev

up:
	docker compose up -d --build
	@echo "Dino Ladder running at http://localhost:$(PORT)"

down:
	docker compose down

logs:
	docker compose logs -f web

test:
	npm test

dev:
	npm run dev
