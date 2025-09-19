ifeq ($(OS),Windows_NT)
	NPX = npx.cmd
	ELECTRON = electron
	RM = del /Q /S
	RMDIR = rmdir /Q /S
	ENTRY_FILE = .\src\main\main.js
else
	NPX = npx
	ELECTRON = electron
	RM = rm -f
	RMDIR = rm -rf
	ENTRY_FILE = ./src/main/main.js
endif

run:
	$(NPX) $(ELECTRON) $(ENTRY_FILE)

start:
	npm start

setup:
	npm install

build:
	npm run build

clean:
	$(RMDIR) node_modules 2>nul || true
	$(RMDIR) dist 2>nul || true
	$(RMDIR) build 2>nul || true

help:
	@echo "Available targets:"
	@echo "  run    - Run simple text app with electron"
	@echo "  start  - Run full Glass application"
	@echo "  setup  - Install dependencies"
	@echo "  build  - Build the application"
	@echo "  clean  - Clean build artifacts"
	@echo "  help   - Show this help"

.PHONY: run start setup build clean help
