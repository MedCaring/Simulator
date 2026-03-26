import threading
from core.device import MedicineBoxDevice

class SimulatorManager:
    # 接收 main.py 传来的 server_url
    def __init__(self, server_url=None):
        self.devices = []
        self.stop_event = threading.Event()
        self.server_url = server_url

    def start_simulation(self, device_count=10, frequency=5):
        self.stop_event.clear()
        self.devices = []
        for i in range(device_count):
            device_id = f"YGG-{str(i+1).zfill(3)}"
            # 将 server_url 传递给每一个具体的设备实例
            device = MedicineBoxDevice(device_id, frequency, self.stop_event, self.server_url)
            self.devices.append(device)
            device.start()

    def stop_simulation(self):
        self.stop_event.set()
        for device in self.devices:
            device.join()
