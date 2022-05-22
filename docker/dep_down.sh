#! /usr/bin/env bash
source ./docker/env-config.sh
docker compose -f ./docker/docker-compose.yaml rm -fsv;
docker volume rm docker_db_data