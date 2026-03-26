# 使用轻量级 Python 基础镜像
FROM python:3.9-slim

ENV PYTHIONUNBUFFERED=1

# 设置工作目录
WORKDIR /app

# 复制依赖文件并安装
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/

# 复制项目所有文件到容器内
COPY . .

# 启动命令：强制使用无头模式，并启动10个设备
CMD ["python", "-u", "main.py"]
