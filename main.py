import argparse
import time
from utils.logger import logger
from core.manager import SimulatorManager

def run_headless(device_count, server_url):
    logger.info(f"==== 药乖乖模拟器 (无头模式 / Docker模式) 启动 ====")
    logger.info(f"准备启动 {device_count} 个设备实例...")
    logger.info(f"目标服务器地址: {server_url}")
    print(f"[直连输出] 系统初始化完成，即将唤醒 {device_count} 个药乖乖硬件设备...", flush=True)

    manager = SimulatorManager(server_url=server_url)
    manager.start_simulation(device_count=device_count, frequency=5)

    try:
        while True:
            time.sleep(1) # 保持主进程不死
    except KeyboardInterrupt:
        logger.info("接收到停止信号，正在关闭设备...")
        manager.stop_simulation()
        logger.info("模拟器已安全退出。")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="药乖乖 (YaoGuaiGuai) 智能硬件模拟器")
    parser.add_argument("--devices", type=int, default=10, help="模拟的设备数量")
    parser.add_argument("--server", type=str, required=True, help="必填：Flask 数据服务器的 API 地址 (例如: http://1.2.3.4:5000/api/upload)")
    
    args = parser.parse_args()

    run_headless(args.devices, args.server)
