import numpy as np
import random
from datetime import datetime, timedelta

class DataGenerator:
    @staticmethod
    def generate_delay_minutes():
        # [良]档要求：贴近真实规律的高斯分布 (平均拖延5分钟，标准差3分钟)
        delay = np.random.normal(loc=5.0, scale=3.0)
        return max(0, round(delay, 1)) # 不能是负数

    @staticmethod
    def generate_pharmacy_info():
        # [良]档要求：药店距离也用高斯分布模拟
        distance = max(100, int(np.random.normal(loc=800, scale=300)))
        pharmacies = ["大白熊平价大药房", "开心果大药房", "康乐寿药店", "百姓安心药房"]
        return f"{random.choice(pharmacies)} (距离: {distance}米)"

    @staticmethod
    def evaluate_status(delay):
        if delay == 0:
            return "🟢 乖乖吃药啦~"
        elif delay <= 10:
            return "🟡 拖延症发作，晚了一点点..."
        else:
            return "🔴 糟糕！忘记吃药了！(已向家人推送警报)"
