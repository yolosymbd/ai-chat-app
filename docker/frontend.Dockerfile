# 构建阶段
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --registry=https://registry.npmmirror.com

COPY . .
RUN npm run build

# 运行阶段
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]