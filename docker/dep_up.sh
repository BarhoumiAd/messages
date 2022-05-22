#! /usr/bin/env bash
source ./docker/env-config.sh
unameOut="$(uname -s)"
case "${unameOut}" in
    Linux*)     
      docker compose -f ./docker/docker-compose-linux.yaml up --build -d
    ;;
    *)    
      docker compose -f ./docker/docker-compose.yaml up --build -d
    ;;
esac