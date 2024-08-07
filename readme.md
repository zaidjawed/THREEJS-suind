# Vite Application Setup

This README provides instructions on how to build and run a Vite application both inside a Docker container and directly on your local machine.

## Running with Docker

### Prerequisites

- Docker installed on your machine

### Building the Docker Image

To build the Docker image for your Vite application, follow these steps:

1. Build the Docker image using the following command. Replace `[any name]` with your preferred image name:

    ```sh
    docker build -t [any name] .
    ```

2. Verify that the Docker image has been built successfully by listing all Docker images:

    ```sh
    docker images
    ```

### Running the Docker Container

To run the Docker container and map port 3000 on your host machine to port 3000 inside the container, use the following commands:

1. Run the container in detached mode (`-d`) and remove it automatically when it stops (`--rm`). Replace `[name of the container]` with your preferred container name and `[your docker image name]` with the name of the Docker image you built:

    ```sh
    docker run -d --rm -p 3000:3000 --name [name of the container] [your docker image name]
    ```

2. Verify that the container is running by listing all running containers:

    ```sh
    docker ps
    ```

### Example Command

To run a container named `suind` from your Docker image, use the following command:

```sh
docker run -d --rm -p 3000:3000 --name suind [your docker image name]



## Running Without Docker

### Prerequisites

- Node.js 18 installed on your machine
- npm (Node Package Manager) installed

### Steps

1. Install the project dependencies:

    ```sh
    npm install
    ```

2. Start the Vite development server:

    ```sh
    npm run dev
    ```

### Accessing the Application

Once the development server is running, you can access your Vite application in your web browser at `http://localhost:3000`.
