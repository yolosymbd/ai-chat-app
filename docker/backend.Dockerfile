FROM python:3.12-slim

# ✅ 北京时间 永久生效（你就差这两行）
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /app

# 只装 curl 方便调试
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 使用清华源加速 pip
RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple

# 复制依赖和代码
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

EXPOSE 9000

# 关键：单进程启动，去掉 workers 参数，Codespaces 资源不够
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000"]