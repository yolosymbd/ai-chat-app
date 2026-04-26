# 👉 只改这一行：用国内华为云镜像，绕过网络封锁
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/python:3.10-slim

WORKDIR /app

# 1. 安装 faiss-cpu 必须的系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 2. 配置 pip 国内源，加速构建
RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple

# 3. 复制依赖文件（路径要和 docker-compose 的 context 匹配）
COPY backend/requirements.txt .

# 4. 安装依赖
RUN pip install --no-cache-dir -r requirements.txt

# 5. 复制后端代码
COPY backend/ .

# 6. 暴露端口
EXPOSE 9000

# 7. 生产运行命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000", "--workers", "4"]