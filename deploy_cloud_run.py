"""
Deploy OpenWork to Cloud Run (Limitless.ai project).
DevPost URL: https://openwork-217388700222.us-central1.run.app

Strategy: Build image in Google Cloud Build, then deploy (no local Docker needed).
If upload fails (e.g. from Google Drive), copy project to a local folder and run again.
"""
import os
import subprocess
import sys

REGION = "us-central1"
SERVICE_NAME = "openwork"
PROJECT_ID = "limitless-ai-483404"  # Limitless.ai — project number 217388700222
IMAGE_TAG = f"gcr.io/{PROJECT_ID}/{SERVICE_NAME}:latest"
ENV_FILE = ".env.local"
TEMP_ENV_YAML = "env_vars_temp.yaml"


def run(cmd, check=True, capture=False):
    """Run a command; if check=True, exit on failure. If capture=True, return result with stdout/stderr."""
    try:
        result = subprocess.run(
            cmd,
            shell=isinstance(cmd, str),
            check=False,
            capture_output=capture,
            text=True,
        )
        if check and result.returncode != 0:
            out = result.stderr or result.stdout or "Command failed."
            if not capture:
                print(out)
            sys.exit(result.returncode)
        return result
    except FileNotFoundError as e:
        print(f"Command not found: {e}")
        sys.exit(1)


def parse_env_file(filepath):
    env_vars = {}
    if not os.path.exists(filepath):
        print(f"Error: {filepath} not found.")
        return env_vars

    with open(filepath, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "#" in line:
                line = line.split("#", 1)[0].strip()
            if "=" in line:
                key, value = line.split("=", 1)
                key, value = key.strip(), value.strip()
                if (value.startswith('"') and value.endswith('"')) or (
                    value.startswith("'") and value.endswith("'")
                ):
                    value = value[1:-1]
                env_vars[key] = value
    return env_vars


def main():
    print(f"Project: {PROJECT_ID} (Limitless.ai)")
    print(f"Target URL: https://openwork-217388700222.us-central1.run.app")
    print(f"Reading env from {ENV_FILE}...")
    env_vars = parse_env_file(ENV_FILE)
    if not env_vars:
        print("No environment variables found. Exiting.")
        sys.exit(1)

    if not env_vars.get("GEMINI_API_KEY"):
        print("Warning: GEMINI_API_KEY not set in .env.local. Chat API will return 500 until set.")

    # Write env vars for Cloud Run
    import yaml
    with open(TEMP_ENV_YAML, "w") as f:
        yaml.dump(env_vars, f, default_flow_style=False)
    try:
        # 1. Build image in Cloud Build (uploads source, builds on GCP — no local Docker needed)
        print("\n[1/3] Building image in Google Cloud Build (this may take a few minutes)...")
        run(["gcloud", "builds", "submit", "--tag", IMAGE_TAG, "--project", PROJECT_ID, "."], check=True)

        # 2. Deploy to Cloud Run
        print("\n[2/3] Deploying to Cloud Run...")
        cmd = [
            "gcloud", "run", "deploy", SERVICE_NAME,
            "--image", IMAGE_TAG,
            "--project", PROJECT_ID,
            "--region", REGION,
            "--platform", "managed",
            "--allow-unauthenticated",
            "--port", "8080",
            "--memory", "1Gi",
            "--timeout", "300",
            "--min-instances", "0",
            "--max-instances", "10",
            "--env-vars-file", TEMP_ENV_YAML,
        ]
        run(cmd, check=True)

        # 3. Show URL
        print("\n[3/3] Service URL:")
        r = run(
            ["gcloud", "run", "services", "describe", SERVICE_NAME,
             "--project", PROJECT_ID, "--region", REGION,
             "--format", "value(status.url)"],
            check=True, capture=True
        )
        url = (r.stdout or "").strip()
        if url:
            print(f"  {url}")
            print("\nDeployment successful. DevPost link should work.")
        else:
            print("  https://openwork-217388700222.us-central1.run.app")
            print("\nDeployment finished. Check Cloud Run console if needed.")
    finally:
        if os.path.exists(TEMP_ENV_YAML):
            os.remove(TEMP_ENV_YAML)


if __name__ == "__main__":
    main()
