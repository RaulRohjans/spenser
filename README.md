![Spenser](https://github.com/RaulRohjans/spenser/assets/77687494/eb698583-b6b7-4c40-80a8-7fbb69017b87)
<br />

## Overview

Spenser is a web application built with Nuxt and TypeScript, designed to help users manage their personal transactions efficiently. The platform offers various features including transaction management, category creation, budget specification, and more, all through an intuitive user interface.

## Live Demo

A live demo for the platform can be checked [here](https://spenser-demo.rohjans.com/).

## Features

### Dashboard

- **Main Page:** Displays an overview of personal financial statistics.

### Transactions

- **Manage Transactions:** Users can view, add, edit, and delete their transactions.
- **AI Import:** Import transactions via text input (file upload or text). The app will parse the input and attempt to attribute categories to the transactions.
- **Backgroun Tasks:** Long-running imports execute as background tasks with a navbar tasks menu (bell icon) to monitor progress, cancel, and open results when ready.

### Categories

- **Category Management:** Create, edit, and delete categories to organize transactions.

### Budgets

- **Budget Specification:** Set budgets for specific categories and time periods.

### Settings

- **Global Settings:** Configure display currency and other global settings.
- **Account Management:** Manage personal account details.

### Admin Features

- **User Management:** Admins can perform CRUD operations on user accounts.
- **Currency Management:** Add more currencies to the platform.
- **AI Configuration:** Choose between different AI providers (ChatGPT, Ollama, or OpenRouter).

## Installation
### Background tasks for AI Import

Long-running AI imports run in background using an in-memory task manager:

- Start via `POST /api/ai-import/parse` → returns `{ success, taskId }`.
- List user tasks: `GET /api/tasks`.
- Cancel: `POST /api/tasks/:id/cancel`.
- Retrieve parsed result: `GET /api/tasks/ai-import/:id/result`.

Tasks are not persisted to the DB and expire ~4h after inactivity.


### Prerequisites

- Node.js (version 20.14.0 or higher)
- PostgreSQL instance running

### Steps

#### Clone the repository:

```
git clone https://github.com/RaulRohjans/spenser.git
cd spenser
```

#### Configure docker compose:

Open the docker-compose.yml file and configure it to your liking.

#### Run docker containers:

```
docker compose up -d
```

## Contributing

Contributions are welcome! Please submit a pull request with detailed information about your changes!

## License

This project is licensed under the MIT License. See the LICENSE file for more information.
