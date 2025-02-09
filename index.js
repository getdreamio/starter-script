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

const currentVersion = "v1.9.1";

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

// Function to display the thank you message
const displayThankYou = () => {
  console.log("");
  console.log("===========================================");
  console.log("");
  console.log("Thank you for choosing Dream.mf!");
  console.log(" Star Dream.mf on GitHub: https://github.com/getdreamio");
  console.log(" See the latest updates : https://x.com/getdreamio");
  console.log("");
  console.log("===========================================");
  console.log("");
};

// Function to display the final summary
const displaySummary = (projectName, starterType) => {
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
    console.log(`ROS Login: root@getdream.io / Dr34m!12345`);
  }
  console.log("");
  console.log("===========================================");
  console.log("");
  displayThankYou();
};

// Main setup logic
(async () => {
  console.log(`Version: ${currentVersion}`);
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

  // Check for the existence of pnpm
  try {
    console.log("= Checking for pnpm...");
    execSync("pnpm --version", { stdio: "ignore" });
  } catch (err) {
    console.error(
      "\n❌ Error: pnpm is not installed. Please install it before proceeding. (npm install -g pnpm)",
    );
    process.exit(1);
  }

  // Check if directory already exists
  if (existsSync(projectName)) {
    if (starterType === "Complete") {
      console.log(`= Directory "${projectName}" already exists. Proceeding with container setup...`);
    } else {
      console.error(
        `\n❌ Error: Directory "${projectName}" already exists. Please choose a different name or remove the existing directory.`,
      );
      process.exit(1);
    }
  }

  if (!existsSync(projectName)) {
    console.log("= Cloning project");
    const emitter = degit(selectedRepoUrl, {
      cache: false,
      force: true,
    });

    try {
      // Clone the repository
      await emitter.clone(projectName);
      console.log("= Project cloned successfully");

      // Navigate to the project directory and install dependencies
      console.log("= Installing dependencies...");
      runCommand(`cd ${projectName} && pnpm install`);
    } catch (error) {
      console.error("Error during project setup:", error);
      process.exit(1);
    }
  }

  // If Complete is selected, set up Docker containers for ROS
  if (starterType === "Complete") {
    console.log("= Setting up containers...");
    const containerRuntime = checkContainerRuntime();
    console.log(`= Using ${containerRuntime} as container runtime...`);

    try {
      // Check if ROS images exist
      const backendImage = execSync(
        `${containerRuntime} images dreammf/ros-backend:latest --format "{{.Repository}}"`,
        { encoding: 'utf-8', stdio: 'pipe' }
      ).trim();
      
      const frontendImage = execSync(
        `${containerRuntime} images dreammf/ros-frontend:latest --format "{{.Repository}}"`,
        { encoding: 'utf-8', stdio: 'pipe' }
      ).trim();

      if (backendImage || frontendImage) {
        console.log("= Existing ROS images detected!");
        console.log("= WARNING: If you are using SQLite, please backup your database before proceeding and restore it after the process is complete.\n");
        const { updateImages } = await inquirer.prompt([
          {
            type: "list",
            name: "updateImages",
            message: "Would you like to update the existing ROS images?",
            choices: [
              { name: "Yes, update to latest version", value: true },
              { name: "No, use existing version", value: false }
            ],
            default: true,
          }
        ]);

        if (!updateImages) {
          console.log("Using existing ROS images...");
          displayThankYou();
          process.exit(0);
        }
      }

      // Check for existing containers and handle accordingly
      console.log("= Checking existing containers...");
      try {
        // Stop and remove containers using our required ports
        console.log("= Checking for containers using required ports...");
        try {
          const portContainers = execSync(
            `${containerRuntime} ps -q -f publish=4000 -f publish=4001 -f publish=3000`,
            { encoding: 'utf-8' }
          ).trim();
          
          if (portContainers) {
            console.log("= Stopping containers using our ports...");
            portContainers.split('\n').forEach(containerId => {
              if (containerId) {
                execSync(`${containerRuntime} stop ${containerId}`, { stdio: "ignore" });
                execSync(`${containerRuntime} rm -f ${containerId}`, { stdio: "ignore" });
              }
            });
          }
        } catch (e) {
          // Ignore errors if no containers found
        }

        // Remove any existing ROS containers
        console.log("= Removing existing ROS containers...");
        const rosContainers = execSync(
          `${containerRuntime} ps -aq --filter ancestor=dreammf/ros-backend:latest --filter ancestor=dreammf/ros-frontend:latest`,
          { encoding: 'utf-8' }
        ).trim();

        if (rosContainers) {
          rosContainers.split('\n').forEach(containerId => {
            if (containerId) {
              execSync(`${containerRuntime} rm -f ${containerId}`, { stdio: "ignore" });
            }
          });
        }

        // Remove existing images to force new pulls
        console.log("= Removing existing images...");
        try {
          execSync(`${containerRuntime} rmi -f dreammf/ros-backend:latest`, { stdio: "ignore" });
          execSync(`${containerRuntime} rmi -f dreammf/ros-frontend:latest`, { stdio: "ignore" });
        } catch (e) {
          // Ignore errors if images don't exist
        }

        // Force pull latest images
        console.log("= Pulling latest container images...");
        execSync(`${containerRuntime} pull dreammf/ros-backend:latest`, { stdio: "ignore" });
        execSync(`${containerRuntime} pull dreammf/ros-frontend:latest`, { stdio: "ignore" });

        // Start containers with latest images
        console.log("= Starting ROS Backend...");
        try {
          execSync(
            `${containerRuntime} run -d --rm -p 4001:4001 -p 4000:4000 dreammf/ros-backend:latest`,
            { stdio: "ignore" }
          );
        } catch (err) {
          console.error("Error starting ROS Backend:", err.message);
          process.exit(1);
        }

        console.log("= Starting ROS Frontend...");
        try {
          execSync(
            `${containerRuntime} run -d --rm -e BACKEND_URL=http://localhost:4000 -p 3000:80 dreammf/ros-frontend:latest`,
            { stdio: "ignore" }
          );
        } catch (err) {
          console.error("Error starting ROS Frontend:", err.message);
          process.exit(1);
        }
      } catch (err) {
        console.error("Error managing containers:", err.message);
        process.exit(1);
      }
    } catch (err) {
      console.error("Error during container setup:", err.message);
      process.exit(1);
    }
  }

  displaySummary(projectName, starterType);
  process.exit(0);
})().catch((err) => {
  console.error("\n❌ Error: Error during setup:", err.message);
});
