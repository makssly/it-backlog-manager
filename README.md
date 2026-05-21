# IT Maintenance Backlog Manager

A lightweight, self-hosted Kanban board designed specifically for home IT laboratories and small infrastructure teams. Keep track of your server maintenance, network upgrades, and hardware replacements in a clean, modern, glassmorphism-styled interface.

## ✨ Features

- **Kanban Board:** Simple "Planned", "In Progress", and "Done" workflow.
- **Drag & Drop:** Intuitively move tasks between columns.
- **Priority & Downtime:** Visually tag tasks that have high priority or require system downtime.
- **Admin & Public Views:** Read-only access for guests; full management capabilities (Add, Edit, Delete, Move) for authenticated admins.
- **Modern UI:** Premium dark theme with responsive glassmorphism design.
- **Self-Hosted & Lightweight:** Built with Node.js, Express, and a persistent SQLite database. Fully containerized with Docker.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/it-backlog-manager.git
   cd it-backlog-manager
   ```

2. **Configure environment variables:**
   Copy the example environment file and adjust the admin credentials and JWT secret.
   ```bash
   cp .env.example .env
   # Edit .env with your preferred text editor
   ```

3. **Start the application:**
   ```bash
   docker compose up -d --build
   ```

4. **Access the board:**
   Open your browser and navigate to `http://localhost:8080`. Click "Login" in the top right to access the Admin Panel using the credentials defined in your `.env` file.

## 🛠 Tech Stack

- **Frontend:** Vanilla HTML, CSS (Glassmorphism), JavaScript (Fetch API, HTML5 Drag and Drop)
- **Backend:** Node.js, Express
- **Database:** SQLite3
- **Authentication:** JWT (JSON Web Tokens)
- **Deployment:** Docker & Docker Compose

## 📁 Project Structure

All persistent data (the SQLite database file) is automatically saved in the `./data` directory on your host machine, ensuring your tasks survive container restarts and updates.

## 📝 License

MIT License. See the [LICENSE](LICENSE) file for details.
