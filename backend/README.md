# Backend Service

This directory contains the FastAPI-based backend for the Internal Product Management Tool.

## Prerequisites

- Python 3.8 or newer
- Virtual environment tool (venv, virtualenv, pipenv, etc.)

## Setup

1. Create and activate a virtual environment:


2. Install dependencies:


## Running the Server

Start the Uvicorn server with auto-reload:


- `main` refers to `main.py` (entrypoint).
- `app` is the FastAPI instance in that file.
- `--reload` watches for file changes and reloads automatically.

The server will be available at [http://localhost:8000](http://localhost:8000).

## Additional Commands

- Run tests:
