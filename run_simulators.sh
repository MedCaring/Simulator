#!/bin/bash

echo "==================================================="
echo "  💊 欢迎使用药乖乖模拟器 (YaoGuaiGuai_Sim) 一键管理脚本"
echo "==================================================="

# 自动检测 docker-compose.yml 中的服务名
SERVICE_NAME=$(docker compose config --services | head -n 1)

if [ -z "$SERVICE_NAME" ]; then
    echo "❌ 无法在 docker-compose.yml 中找到服务配置，请检查文件格式！"
    exit 1
fi

echo "✅ 自动检测到配置文件中的服务名称为: [$SERVICE_NAME]"

DEFAULT_NUM=5
read -p "请输入需要并发启动的模拟器数量 [直接回车默认 $DEFAULT_NUM]: " INPUT_NUM
NUM_INSTANCES=${INPUT_NUM:-$DEFAULT_NUM}

echo ""
echo "⏳ 正在构建镜像并后台启动 $NUM_INSTANCES 个模拟器实例..."
echo "==================================================="

# 使用自动获取的服务名进行并发扩展
docker compose up -d --build --scale $SERVICE_NAME=$NUM_INSTANCES

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ $NUM_INSTANCES 个模拟器已成功在后台运行！"
    echo "==================================================="
    echo "📜 正在为您拉取实时运行日志..."
    echo "💡 提示: 随时可以按 [Ctrl + C] 退出日志查看，这不会停止后台运行的模拟器。"
    echo "==================================================="
    sleep 2
    docker compose logs -f
else
    echo ""
    echo "❌ 启动失败！如果是端口冲突报错，请检查 docker-compose.yml 中是否去掉了绑定的宿主机端口。"
fi
