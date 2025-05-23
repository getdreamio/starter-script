#!/usr/bin/env node
const stdioMode = process.argv.includes('--debug') ? 'inherit' : 'ignore';
console.clear();
if (stdioMode == 'inherit') {
  console.log('░▒█ Debug mode enabled █▒░');
}
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

import inquirer from "inquirer";
import degit from "degit";
import { existsSync } from "fs";
import os from "os";
import { createRequire } from "module";

// Feed version from package.json
const require = createRequire(import.meta.url);
const pkg = require("./package.json");
const currentVersion = pkg.version;

// Helper function to run shell commands with debug wrappers
const runCommand = (command, options = { stdio: stdioMode }) => {
  try {
    if (stdioMode == 'inherit') {
      console.log(`░ Running command: ${command}`);
    }
    
    // Create a copy of options to avoid modifying the original
    const execOptions = { ...options };
    
    // If we're in debug mode and not explicitly capturing output, show it in the console
    if (stdioMode === 'inherit' && (!options.stdio || options.stdio === 'inherit' || options.stdio === stdioMode)) {
      // Force pipe to capture output
      execOptions.stdio = 'pipe';
    }
    
    const result = require('child_process').execSync(command, execOptions);
    
    // If in debug mode, log the output
    if (stdioMode === 'inherit' && result) {
      const output = result.toString().trim();
      if (output) {
        output.split('\n').forEach(line => {
          console.log(`░ ${line}`);
        });
      }
    }
    
    // Return the original result
    return result ? result.toString() : '';
  } catch (err) {
    console.error(`░ Failed to execute: ${command}, ${err}`);
    throw err; // Throw the error instead of exiting
  }
};

// Helper function to check container runtime availability
const checkContainerRuntime = () => {
  try {
    // First try Podman
    runCommand('podman --version', { stdio: stdioMode });
    return 'podman';
  } catch (err) {
    try {
      // Then try Docker
      runCommand('docker --version', { stdio: stdioMode });
      return 'docker';
    } catch (err) {
      console.error(
        '\n❌ Error: Neither Docker nor Podman is installed on your system.',
      );
      console.log(
        'Please install either Docker (https://docs.docker.com/get-docker/)',
      );
      console.log('or Podman (https://podman.io/getting-started/installation)');
      process.exit(1);
    }
  }
};

// Function to detect system architecture
const detectArchitecture = () => {
  const arch = os.arch();
  console.log(`= Detected system architecture: ${arch}`);
  
  if (arch === 'arm64') {
    return 'arm64';
  } else {
    return 'amd64';
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
const displaySummary = (projectName, starterType, command, isRosOnly = false) => {
  console.log(`Finished! ${isRosOnly ? 'ROS services have' : `Your project "${projectName}" has`} been set up successfully!

===========================================`);

  if (!isRosOnly) {
    console.log(`
Run the following commands to get started:
  cd ${projectName}
  ${command}

Starter Frontend: http://localhost:3001
Auth0 Login: testuser@dream.mf / Password123`);
  }

  if (starterType === "Complete" || starterType === "Complete ModernJS with BFF") {
    console.log(`
ROS Frontend: http://localhost:3000
ROS Backend: http://localhost:4000
ROS Backend (https): https://localhost:4001
ROS Login: root@getdream.io / Dr34m!12345`);
  }

  console.log("\n===========================================");
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

  // Ask for setup type first
  const { setupType } = await inquirer.prompt([
    {
      type: "list",
      name: "setupType",
      message: "What would you like to set up?",
      choices: [
        { name: "New Starter Project", value: "full" },
        { name: "Only ROS (Remote Orchestration Services)", value: "ros" },
      ],
      default: "full",
    },
  ]);

  // Detect architecture
  const arch = detectArchitecture();
  let forcePlatform = "";

  // If ROS only, skip to container setup
  if (setupType === "ros") {
    console.log("= Setting up ROS containers...");
    const containerRuntime = checkContainerRuntime();
    console.log(`= Using ${containerRuntime} as container runtime...`);

    // If on ARM architecture, ask if user wants to try AMD64 emulation
    if (arch === 'arm64') {
      const { emulateAmd64 } = await inquirer.prompt([
        {
          type: "list",
          name: "emulateAmd64",
          message: "Your system is running on ARM64 architecture. Dream.mf ROS images are currently only available for AMD64. Would you like to try running with AMD64 emulation?",
          choices: [
            { name: "Yes, use AMD64 emulation (may be slower)", value: true },
            { name: "No, exit setup", value: false }
          ],
          default: true,
        }
      ]);

      if (!emulateAmd64) {
        console.log("Exiting setup. Please use an AMD64 system or wait for ARM64 images to become available.");
        process.exit(0);
      }
      
      // Set platform flag for docker
      forcePlatform = "--platform=linux/amd64";
      console.log("= Will use AMD64 emulation for containers");
    }

    try {
      // Check if ROS images exist
      const backendImageRaw = runCommand(
        `${containerRuntime} images dreammf/ros-backend:latest --format "{{.Repository}}"`,
        { encoding: 'utf-8', stdio: stdioMode }
      );
      const backendImage = backendImageRaw?.trim() || null;
      
      const frontendImageRaw = runCommand(
        `${containerRuntime} images dreammf/ros-frontend:latest --format "{{.Repository}}"`,
        { encoding: 'utf-8', stdio: stdioMode }
      );
      const frontendImage = frontendImageRaw?.trim() || null;

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
          // Get all running containers and their port mappings in a cross-platform way
          const allContainers = runCommand(
            `${containerRuntime} ps --format "{{.ID}}:{{.Ports}}"`,
            { encoding: 'utf-8', stdio: stdioMode }
          ).trim();
          
          // Filter containers using our ports (4000, 4001, 3000)
          const portContainers = allContainers
            .split('\n')
            .filter(line => {
              // Check if this container uses any of our required ports
              return line.includes(':4000-') || line.includes(':4000/') || 
                     line.includes(':4001-') || line.includes(':4001/') || 
                     line.includes(':3000-') || line.includes(':3000/');
            })
            .map(line => line.split(':')[0]) // Extract container ID
            .filter(id => id.trim().length > 0); // Filter out empty IDs
          
          if (portContainers.length > 0) {
            console.log("= Stopping containers using our ports...");
            portContainers.forEach(containerId => {
              runCommand(`${containerRuntime} stop ${containerId}`, { stdio: stdioMode });
              runCommand(`${containerRuntime} rm -f ${containerId}`, { stdio: stdioMode });
            });
          }
        } catch (e) {
          // Ignore errors if no containers found
        }

        // Remove any existing ROS containers
        console.log("= Removing existing ROS containers...");
        const rosContainers = runCommand(
          `${containerRuntime} ps -aq --filter ancestor=dreammf/ros-backend:latest --filter ancestor=dreammf/ros-frontend:latest`,
          { encoding: 'utf-8' }
        ).trim();

        if (rosContainers) {
          rosContainers.split('\n').forEach(containerId => {
            if (containerId) {
              runCommand(`${containerRuntime} rm -f ${containerId}`, { stdio: "ignore" });
            }
          });
        }

        // Remove existing images to force new pulls
        console.log("= Removing existing images...");
        try {
          runCommand(`${containerRuntime} rmi -f dreammf/ros-backend:latest`, { stdio: stdioMode });
          runCommand(`${containerRuntime} rmi -f dreammf/ros-frontend:latest`, { stdio: stdioMode });
        } catch (e) {
          // Ignore errors if images don't exist
        }

        // Force pull latest images with platform flag if needed
        console.log("= Pulling latest container images...");
        runCommand(`${containerRuntime} pull ${forcePlatform} ${containerRuntime === 'podman' ? '--tls-verify=false ' : ''}dreammf/ros-backend:latest`, { stdio: stdioMode });
        runCommand(`${containerRuntime} pull ${forcePlatform} ${containerRuntime === 'podman' ? '--tls-verify=false ' : ''}dreammf/ros-frontend:latest`, { stdio: stdioMode });

        // Start containers with latest images
        console.log("= Starting ROS Backend...");
        try {
          runCommand(
            `${containerRuntime} run ${forcePlatform} ${containerRuntime === 'podman' ? '--tls-verify=false ' : ''}-d --rm -p 4001:4001 -p 4000:4000 dreammf/ros-backend:latest`,
            { stdio: stdioMode }
          );
        } catch (err) {
          console.error("Error starting ROS Backend:", err.message);
          process.exit(1);
        }

        console.log("= Starting ROS Frontend...");
        try {
          runCommand(
            `${containerRuntime} run ${forcePlatform} ${containerRuntime === 'podman' ? '--tls-verify=false ' : ''}-d --rm -e BACKEND_URL=http://localhost:4000 -p 3000:80 dreammf/ros-frontend:latest`,
            { stdio: stdioMode }
          );
        } catch (err) {
          console.error("Error starting ROS Frontend:", err.message);
          process.exit(1);
        }
      } catch (err) {
        console.error("Error during ROS setup:", err.message);
        process.exit(1);
      }
    } catch (err) {
      console.error("Error during ROS setup:", err.message);
      process.exit(1);
    }

    displaySummary("ros-services", "Complete", "", true);
    return;
  }

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
        { name: 'Complete ModernJS with BFF Dream.mf Platform', value: 'Complete ModernJS with BFF' },
      ],
      default: "Basic",
    },
  ]);

  // Define commands based on starter type
  let command = "pnpm start";
  if (starterType === "Complete") {
    command = "npx nx run-many -t serve --watch";
  }

  // Define repository URLs for each starter type
  const repoUrls = {
    Basic: "getdreamio/starter-project-react",
    Complete: "getdreamio/starter-project-react-complete",
    'Complete ModernJS with BFF': 'https://github.com/getdreamio/starter-project-modernjs-complete',
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
    runCommand("pnpm --version", { stdio: stdioMode });
  } catch (err) {
    console.error(
      "\n❌ Error: pnpm is not installed. Please install it before proceeding. (npm install -g pnpm)",
    );
    process.exit(1);
  }

  // Check if directory already exists
  if (existsSync(projectName)) {
    if (starterType === "Complete" || starterType === "Complete ModernJS with BFF") {
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
      runCommand(`cd ${projectName} && pnpm install`, { stdio: stdioMode });
    } catch (error) {
      console.error("Error during project setup:", error);
      process.exit(1);
    }
  }

  // If Complete is selected, set up Docker containers for ROS
  if (starterType === "Complete" || starterType === "Complete ModernJS with BFF") {
    console.log("= Setting up containers...");
    const containerRuntime = checkContainerRuntime();
    console.log(`= Using ${containerRuntime} as container runtime...`);

    // If on ARM architecture, ask if user wants to try AMD64 emulation
    if (arch === 'arm64') {
      const { emulateAmd64 } = await inquirer.prompt([
        {
          type: "list",
          name: "emulateAmd64",
          message: "Your system is running on ARM64 architecture. Dream.mf ROS images are currently only available for AMD64. Would you like to try running with AMD64 emulation?",
          choices: [
            { name: "Yes, use AMD64 emulation (may be slower)", value: true },
            { name: "No, exit setup", value: false }
          ],
          default: true,
        }
      ]);

      if (!emulateAmd64) {
        console.log("Exiting setup. Please use an AMD64 system or wait for ARM64 images to become available.");
        process.exit(0);
      }
      
      // Set platform flag for docker
      forcePlatform = "--platform=linux/amd64";
      console.log("= Will use AMD64 emulation for containers");
    }

    try {
      // Check if ROS images exist
      const backendImageRaw = runCommand(
        `${containerRuntime} images dreammf/ros-backend:latest --format "{{.Repository}}"`,
        { encoding: 'utf-8', stdio: ['inherit', 'pipe', 'pipe'] }
      );
      const backendImage = backendImageRaw?.trim() || null;
      
      const frontendImageRaw = runCommand(
        `${containerRuntime} images dreammf/ros-frontend:latest --format "{{.Repository}}"`,
        { encoding: 'utf-8', stdio: ['inherit', 'pipe', 'pipe'] }
      );
      const frontendImage = frontendImageRaw?.trim() || null;

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
          // Get all running containers and their port mappings in a cross-platform way
          const allContainers = runCommand(
            `${containerRuntime} ps --format "{{.ID}}:{{.Ports}}"`,
            { encoding: 'utf-8', stdio: stdioMode }
          ).trim();
          
          // Filter containers using our ports (4000, 4001, 3000)
          const portContainers = allContainers
            .split('\n')
            .filter(line => {
              // Check if this container uses any of our required ports
              return line.includes(':4000-') || line.includes(':4000/') || 
                     line.includes(':4001-') || line.includes(':4001/') || 
                     line.includes(':3000-') || line.includes(':3000/');
            })
            .map(line => line.split(':')[0]) // Extract container ID
            .filter(id => id.trim().length > 0); // Filter out empty IDs
          
          if (portContainers.length > 0) {
            console.log("= Stopping containers using our ports...");
            portContainers.forEach(containerId => {
              runCommand(`${containerRuntime} stop ${containerId}`, { stdio: stdioMode });
              runCommand(`${containerRuntime} rm -f ${containerId}`, { stdio: stdioMode });
            });
          }
        } catch (e) {
          // Ignore errors if no containers found
        }

        // Remove any existing ROS containers
        console.log("= Removing existing ROS containers...");
        const rosContainers = runCommand(
          `${containerRuntime} ps -aq --filter ancestor=dreammf/ros-backend:latest --filter ancestor=dreammf/ros-frontend:latest`,
          { encoding: 'utf-8' }
        ).trim();

        if (rosContainers) {
          rosContainers.split('\n').forEach(containerId => {
            if (containerId) {
              runCommand(`${containerRuntime} rm -f ${containerId}`, { stdio: "ignore" });
            }
          });
        }

        // Remove existing images to force new pulls
        console.log("= Removing existing images...");
        try {
          runCommand(`${containerRuntime} rmi -f dreammf/ros-backend:latest`, { stdio: stdioMode });
          runCommand(`${containerRuntime} rmi -f dreammf/ros-frontend:latest`, { stdio: stdioMode });
        } catch (e) {
          // Ignore errors if images don't exist
        }

        // Force pull latest images with platform flag if needed
        console.log("= Pulling latest container images...");
        runCommand(`${containerRuntime} pull ${forcePlatform} dreammf/ros-backend:latest`, { stdio: stdioMode });
        runCommand(`${containerRuntime} pull ${forcePlatform} dreammf/ros-frontend:latest`, { stdio: stdioMode });

        // Start containers with latest images
        console.log("= Starting ROS Backend...");
        try {
          runCommand(
            `${containerRuntime} run ${forcePlatform} ${containerRuntime === 'podman' ? '--tls-verify=false ' : ''}-d --rm -p 4001:4001 -p 4000:4000 dreammf/ros-backend:latest`,
            { stdio: stdioMode }
          );
        } catch (err) {
          console.error("Error starting ROS Backend:", err.message);
          process.exit(1);
        }

        console.log("= Starting ROS Frontend...");
        try {
          runCommand(
            `${containerRuntime} run ${forcePlatform} ${containerRuntime === 'podman' ? '--tls-verify=false ' : ''}-d --rm -e BACKEND_URL=http://localhost:4000 -p 3000:80 dreammf/ros-frontend:latest`,
            { stdio: stdioMode }
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

  displaySummary(projectName, starterType, command);
  process.exit(0);
})().catch((err) => {
  console.error("\n❌ Error: Error during setup:", err.message);
});