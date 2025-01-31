# Dream.mf Starter Script

Welcome to the Dream.mf Starter Script! This script helps you quickly set up a new Dream.mf project with ease.

## Features

- **Basic Starter Project**: A basic React application using the standard Dream.mf libraries (oidc, logging, core, bundlers).
- **Complete Dream.mf Platform**: Includes Basic features plus NX and Remote Orchestration Services.

## Prerequisites

- Node.js and npm installed on your machine.
- `pnpm` package manager installed. You can install it by running:
  ```bash
  npm install -g pnpm
  ```

## Installation

To use the Dream.mf Starter Script, you can execute it directly using npx:

```bash
npx getdreamio
```

## Usage

1. **Run the Script**: Execute the script using the command above.
2. **Project Setup**: Follow the prompts to name your project and choose between the Basic or Complete starter options.
3. **Dependency Installation**: The script will automatically install the necessary dependencies using `pnpm`.
4. **ROS Setup**: If you choose the Complete option, the script will set up Docker containers for ROS.

## Getting Started

After the setup is complete, navigate to your project directory and start the development server:

```bash
cd your-project-name
pnpm start
```

If you're using the Complete option, access the services at:
- Frontend: http://localhost:3001
- ROS Backend: http://localhost:4001

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For more information, visit [getdream.io](https://www.getdream.io/).
