#!/usr/bin/env bash
# build.sh
# Render runs this script every time you deploy.
# It installs dependencies, runs migrations, and collects static files.

set -o errexit   # stop script if any command fails

pip install -r requirements.txt

python manage.py collectstatic --no-input

python manage.py migrate

# Populate the database with stock data
python stocks/ingestion.py