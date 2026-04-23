FROM python:3.10-slim

WORKDIR /app

# 安装后端依赖
COPY ../backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY ../backend/ .

# 暴露9000端口
EXPOSE 9000

# 生产运行命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000", "--workers", "4"]