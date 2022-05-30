#------ Docker compose variables ------
export PG_IMAGE="postgres:14"
export PG_HOST="localhost"
export PG_PORT="5432"
export PG_USER="qlik"
export PG_PASSWORD="qlik"
export PG_DB="qlik"
export MODE="development"

export REDIS_IMAGE="redis:latest"
export REDIS_UNAME="admin"
export REDIS_PORT="6379"
export REDIS_HOST="host.docker.internal"
export REDIS_PASS=""