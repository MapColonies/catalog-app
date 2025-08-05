#!/bin/bash

docker image build --rm --no-cache -t catalog-app:latest -f Dockerfile .
