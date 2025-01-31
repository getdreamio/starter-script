#!/usr/bin/env node
console.clear();
console.log(`
▓█████▄  ██▀███  ▓█████  ▄▄▄       ███▄ ▄███▓      ███▄ ▄███▓  █████▒
▒██▀ ██▌▓██ ▒ ██▒▓█   ▀ ▒████▄    ▓██▒▀█▀ ██▒     ▓██▒▀█▀ ██▒▓██   ▒
░██   █▌▓██ ░▄█ ▒▒███   ▒██  ▀█▄  ▓██    ▓██░     ▓██    ▓██░▒████ ░
░▓█▄   ▌▒██▀▀█▄  ▒▓█  ▄ ░██▄▄▄▄██ ▒██    ▒██      ▒██    ▒██ ░▓█▒  ░
░▒████▓ ░██▓ ▒██▒░▒████▒ ▓█   ▓██▒▒██▒   ░██▒ ██▓ ▒██▒   ░██▒░▒█░
 ▒▒▓  ▒ ░ ▒▓ ░▒▓░░░ ▒░ ░ ▒▒   ▓▒█░░ ▒░   ░  ░ ▒▓▒ ░ ▒░   ░  ░ ▒ ░
 ░ ▒  ▒   ░▒ ░ ▒░ ░ ░  ░  ▒   ▒▒ ░░  ░      ░ ░▒  ░  ░      ░ ░
 ░ ░  ░   ░░   ░    ░     ░   ▒   ░      ░    ░   ░      ░    ░ ░
   ░       ░        ░  ░      ░  ░       ░     ░         ░
 ░                                             ░
`);

import inquirer from "inquirer"; // ESM import for inquirer
import { execSync } from "child_process"; // ESM import for child_process
import degit from "degit";
import { existsSync } from "fs"; // ESM import for fs

// Helper function to run shell commands
const runCommand = (command, options = { stdio: "ignore" }) => {
  try {
    execSync(command, options);
  } catch (err) {
    console.error(`Failed to execute: ${command}`);
    process.exit(1);
  }
};

// Helper function to check container runtime availability
const checkContainerRuntime = () => {
  try {
    // First try Docker
    execSync("docker --version", { stdio: "ignore" });
    return "docker";
  } catch (err) {
    try {
      // Then try Podman
      execSync("podman --version", { stdio: "ignore" });
      return "podman";
    } catch (err) {
      console.error(
        "\n❌ Error: Neither Docker nor Podman is installed on your system.",
      );
      console.log(
        "Please install either Docker (https://docs.docker.com/get-docker/)",
      );
      console.log("or Podman (https://podman.io/getting-started/installation)");
      process.exit(1);
    }
  }
};

// Main setup logic
(async () => {
  console.log(`Version: v1.8.3`);
  console.log(`https://www.getdream.io/`);
  console.log("");
  console.log(
    "Thank you for choosing Dream.mf, a module federation framework.",
  );
  console.log(
    "This setup will guide you through starting a new Dream.mf project.",
  );
  console.log("");

  // Ask for the project name
  const { projectName } = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "What would you like to name your project?",
      default: "dreammf-sample",
    },
  ]);

  console.log(
    `I will begin creating the "${projectName}" project for you, but first, we need to know which version.`,
  );
  console.log("");
  console.log(
    "Note: The basic starter includes the standard Dream.mf libraries (oidc, logging, core, bundlers), while",
  );
  console.log(
    "the complete installation contains basic and is set up for NX and [ROS] Remote Orchestration Services.",
  );
  console.log("");

  // Ask for the starter type
  const { starterType } = await inquirer.prompt([
    {
      type: "list",
      name: "starterType",
      message: "Which Dream.mf Starter would you like to use?",
      choices: [
        { name: "Basic Starter Project", value: "Basic" },
        { name: "Complete Dream.mf Platform", value: "Complete" },
      ],
      default: "Basic",
    },
  ]);

  // Define repository URLs for each starter type
  const repoUrls = {
    Basic: "getdreamio/starter-project-react",
    Complete: "getdreamio/starter-project-react-complete",
  };

  // Select the repository based on the starter type
  const selectedRepoUrl = repoUrls[starterType];

  console.log(`You have chosen the ${starterType} starter.`);

  // Ask the user for configuration options
  const answers = await inquirer.prompt([]);

  console.log("Thank you, getting you started...");

  // Check if directory already exists
  if (existsSync(projectName)) {
    console.error(`\n❌ Error: Directory "${projectName}" already exists. Please choose a different name or remove the existing directory.`);
    process.exit(1);
  }

  console.log("= Cloning project");
  const emitter = degit(selectedRepoUrl, {
    cache: false,
    force: true,
  });

  try {
    // Clone the repository
    await emitter.clone(projectName);
    console.log("= Project cloned successfully");

    // Check for the existence of pnpm
    try {
      console.log("= Checking for pnpm...");
      execSync("pnpm --version", { stdio: "ignore" });
    } catch (err) {
      console.error(
        "\n❌ Error: pnpm is not installed. Please install it before proceeding.",
      );
      process.exit(1);
    }

    // Navigate to the project directory and install dependencies
    console.log("= Installing dependencies...");
    runCommand(`cd ${projectName} && pnpm install`);

    // If Complete is selected, set up Docker containers for ROS
    if (starterType === "Complete") {
      console.log("= Setting up containers...");
      const containerRuntime = checkContainerRuntime();
      console.log(`= Using ${containerRuntime} as container runtime...`);

      // Stop and remove existing containers
      console.log("= Cleaning up any existing containers...");
      try {
        // Stop and remove ROS Backend container
        execSync(`${containerRuntime} stop $(${containerRuntime} ps -q --filter ancestor=dreammf/ros-backend:latest)`, { stdio: "ignore" });
        execSync(`${containerRuntime} rm $(${containerRuntime} ps -aq --filter ancestor=dreammf/ros-backend:latest)`, { stdio: "ignore" });
        
        // Stop and remove ROS Frontend container
        execSync(`${containerRuntime} stop $(${containerRuntime} ps -q --filter ancestor=dreammf/ros-frontend:latest)`, { stdio: "ignore" });
        execSync(`${containerRuntime} rm $(${containerRuntime} ps -aq --filter ancestor=dreammf/ros-frontend:latest)`, { stdio: "ignore" });
      } catch (err) {
        // Ignore errors as they likely mean no containers were running
      }

      console.log("= Starting ROS Backend...");
      runCommand(
        `${containerRuntime} run -d -p 4001:4001 -p 4000:4000 ${containerRuntime === 'podman' ? '--tls-verify=false' : ''} dreammf/ros-backend:latest`,
      );

      console.log("= Starting ROS Frontend...");
      runCommand(
        `${containerRuntime} run -d -e BACKEND_URL=https://localhost:4001 -p 3000:80 ${containerRuntime === 'podman' ? '--tls-verify=false' : ''} dreammf/ros-frontend:latest`,
      );

      console.log("= Containers are up and running!");
    }

    console.log(`Finished! Your project "${projectName}" has been set up successfully!

===========================================

Run the following commands to get started:
  cd ${projectName}
  ${starterType === "Complete" ? "npx nx run-many -t serve --watch" : "pnpm start"}
`);

    console.log(`Starter Frontend: http://localhost:3001`);
    console.log(`Auth0 Login: testuser@dream.mf / Password123`);
    console.log("");
    if (starterType === "Complete") {
      console.log(`ROS Frontend: http://localhost:3000`);
      console.log(`ROS Backend: http://localhost:4000`);
      console.log(`ROS Backend (https): https://localhost:4001`);
      console.log(`ROS Login: root@dreammf.com / Dr34m!12345`);
    }
    console.log("");
    console.log("===========================================");
    console.log("");
    console.log("Thank you for chosing Dream.mf!");
    console.log("🌟 Star Dream.mf on GitHub: https://github.com/getdreamio");
    console.log("📢 See the latest updates : https://x.com/getdreamio");
  } catch (err) {
    console.error("\n❌ Error: Error during setup:", err.message);
  }

  process.exit(0);
})();
