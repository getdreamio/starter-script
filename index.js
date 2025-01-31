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

// Helper function to run shell commands
const runCommand = (command, options = {}) => {
  try {
    execSync(command, { stdio: "inherit", ...options });
  } catch (err) {
    console.error(`Failed to execute: ${command}`);
    process.exit(1);
  }
};

// Main setup logic
(async () => {
  console.log(`Version: v1.5.1`);
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
        "pnpm is not installed. Please install it before proceeding.",
      );
      process.exit(1);
    }

    // Navigate to the project directory and install dependencies
    console.log("= Installing dependencies...");
    runCommand(`cd ${projectName} && pnpm install`);

    // If Complete is selected, set up Docker containers for ROS
    if (starterType === "Complete") {
      console.log("= Setting up Docker containers...");

      console.log("Starting ROS Backend...");
      runCommand(`docker run -d -p 5001:5001 dreammf/ros-backend:latest`);

      console.log("Starting ROS Frontend...");
      runCommand(
        `docker run -d -e BACKEND_URL=https://localhost:5001 -p 3000:80 dreammf/ros-frontend:latest`,
      );

      console.log("Docker containers are up and running!");
    }

    console.log("Finished!");
    console.log(`
Your project "${projectName}" has been set up successfully!

Run the following commands to get started:
  cd ${projectName}
  pnpm install
  ${starterType === "Complete" ? "npx nx run-many -t serve --watch" : "pnpm start"}
`);

    console.log(`Starter Frontend: http://localhost:3001`);
    if (starterType === "Complete") {
      console.log(`ROS Frontend: http://localhost:3000`);
      console.log(`ROS Backend: http://localhost:5001`);
      console.log(`Login: root@dreammf.com / Dr34m!12345`);
    }
    console.log("");
    console.log("Thank you for chosing Dream.mf!");
    console.log("🌟 Star Dream.mf on GitHub: https://github.com/getdreamio");
    console.log("📢 See the latest updates : https://x.com/getdreamio=");
  } catch (err) {
    console.error("Error during setup:", err.message);
  }
})();
