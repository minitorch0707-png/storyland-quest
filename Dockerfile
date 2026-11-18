FROM python:3.12-slim
WORKDIR /app
COPY server.py ./
COPY public ./public
ENV HOST=0.0.0.0 PORT=8080
EXPOSE 8080
CMD ["python3", "server.py"]
