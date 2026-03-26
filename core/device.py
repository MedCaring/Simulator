import threading
import time
import csv
import os
import requests
from datetime import datetime
from core.generator import DataGenerator
from utils.logger import logger

# 线程锁，防止多个设备同时写CSV导致数据混乱 (工业级设计)
csv_lock = threading.Lock()

class MedicineBoxDevice(threading.Thread):
    # 新增 server_url 参数
    def __init__(self, device_id, frequency=5, stop_event=None, server_url=None):
        super().__init__()
        self.device_id = device_id
        self.frequency = frequency
        self.stop_event = stop_event
        self.server_url = server_url
        self.csv_path = 'data/ygg_records.csv'
        self._init_csv()

    def _init_csv(self):
        with csv_lock:
            if not os.path.exists(self.csv_path):
                # 确保 data 目录存在
                os.makedirs(os.path.dirname(self.csv_path), exist_ok=True)
                with open(self.csv_path, 'w', newline='', encoding='utf-8-sig') as f:
                    writer = csv.writer(f)
                    writer.writerow(['Timestamp', 'Device_ID', 'Delay_Minutes', 'Status', 'Nearby_Pharmacy'])

    def run(self):
        logger.info(f"✨ 药乖乖设备 [{self.device_id}] 已激活并上线！")
        while not self.stop_event.is_set():
            # 模拟生成数据
            delay = DataGenerator.generate_delay_minutes()
            status = DataGenerator.evaluate_status(delay)
            pharmacy = DataGenerator.generate_pharmacy_info()
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # 记录日志
            logger.info(f"[{self.device_id}] 状态: {status} | 拖延: {delay}分钟 | 附近购药: {pharmacy}")
            print(f"[直连输出] {now} | {self.device_id} | 拖延 {delay} 分钟 | {status}", flush=True)

            # 写入本地文件
            with csv_lock:
                with open(self.csv_path, 'a', newline='', encoding='utf-8-sig') as f:
                    writer = csv.writer(f)
                    writer.writerow([now, self.device_id, delay, status, pharmacy])

            # --- 新增：向云端服务器发送数据 ---
            if self.server_url:
                payload = {
                    "timestamp": now,
                    "device_id": self.device_id,
                    "delay_minutes": delay,
                    "status": status,
                    "nearby_pharmacy": pharmacy
                }
                try:
                    # 发送 POST 请求，设置 5 秒超时防止线程卡死
                    response = requests.post(self.server_url, json=payload, timeout=5)
                    if response.status_code != 200:
                        logger.warning(f"[{self.device_id}] 数据上传云端失败，HTTP状态码: {response.status_code}")
                except Exception as e:
                    logger.error(f"[{self.device_id}] 网络请求异常，请检查服务器是否开启: {e}")
            # ---------------------------------

            # 等待下一次生成
            time.sleep(self.frequency)

        logger.info(f"💤 药乖乖设备 [{self.device_id}] 已休眠。")
