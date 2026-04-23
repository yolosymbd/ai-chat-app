# 构建阶段
FROM node:18-alpine AS build

WORKDIR /app
COPY ../frontend/ .
RUN npm install
RUN npm run build

# 运行阶段：Nginx
FROM nginx:alpine

# 复制前端打包文件
COPY --from=build /app/dist /usr/share/nginx/html

# 复制Nginx配置
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80