#!/usr/bin/env node

import inquirer from "inquirer"; // ESM import for inquirer
import { execSync } from "child_process"; // ESM import for child_process
import degit from "degit";

// Define the repository URL
const repoUrl = "getdreamio/starter-project-react";

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
  console.log("Thank you for choosing Dream.mf, a module federation framework.");

  // Ask for the project name
  const { projectName } = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "What would you like to name your project?",
      default: "dreammf-sample",
    },
  ]);

  console.log(`I will begin creating the "${projectName}" project for you, but first, I need to ask a few questions.`);

  // Ask the user for configuration options
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "framework",
      message: "Which web framework are you using?",
      choices: ["React", "Angular (coming soon)"],
      default: "React",
    },
    {
      type: "list",
      name: "bundler",
      message: "Which bundler would you like to use?",
      choices: ["Webpack", "Rspack", "Rsbuild"],
      default: "Webpack",
    },
    {
      type: "confirm",
      name: "useROS",
      message: "Would you like to use ROS? (Remote Orchestration Services)\nNotice: You will need Docker or Podman (with Docker alias).",
      default: true,
    },
  ]);

  console.log("Thank you, getting you started...");

  console.log("= Cloning project");
  const emitter = degit(repoUrl, {
    cache: false,
    force: true,
  });

  try {
    // Clone the repository
    await emitter.clone(projectName);
    console.log("= Project cloned successfully");

    // Navigate to the project directory and install dependencies
    console.log("= Installing dependencies...");
    runCommand(`cd ${projectName} && npm install`);

    // If ROS is enabled, set up Docker containers
    if (answers.useROS) {
      console.log("= Setting up Docker containers...");

      console.log("Starting ROS Backend...");
      runCommand(`docker run -p 5001:5001 dreammf/ros-backend:latest`);

      console.log("Starting ROS Frontend...");
      runCommand(
        `docker run -e BACKEND_URL=https://localhost:5001 -p 3000:80 dreammf/ros-frontend:latest`
      );

      console.log("Docker containers are up and running!");
    }

    console.log("Finished!");
    console.log(`
Your project "${projectName}" has been set up successfully!

Run the following commands to get started:
  cd ${projectName}
  npm start

If you're using ROS, visit:
  Frontend: http://localhost:3000
  Backend: http://localhost:5001
    `);
  } catch (err) {
    console.error("Error during setup:", err.message);
  }
})();
