# Yaoguaiguai_simulator

## 1. 项目简介
简短描述: 药乖乖 (YaoGuaiGuai) 智能硬件全周期服药数据模拟与监控算法包。

本功能包将底层高斯分布（正态分布）数据生成算法与交互层（GUI/Docker）完全解耦，支持通过命令行动态下发模拟参数，并实时计算出模拟用户的服药时间轴、延迟偏差以及周边药店推荐路径。

## 2. 依赖环境
在编译和运行此包之前，请确保您的环境满足以下要求：

操作系统: Windows 10/11, Ubuntu 22.04 LTS 或 macOS

运行环境: Python 3.9 或更高版本

容器环境: Docker Desktop (仅集群部署时需要)

依赖库:

numpy

pandas

## 3. 使用指南
### 3.1 命令行直接运行 (CLI 动态传参 / 无头模式)
这是推荐的大规模调试方式，完全脱离图形界面配置文件，直接通过命令行参数动态覆盖模拟器寻路与生成参数：

```
python main.py --headless --devices 50
```

### 3.2 桌面 GUI 文件启动
用于本地单机联调时加载默认参数，提供可视化监控大屏：

```
python main.py
```
### 3.3 配置文件说明
docker-compose.yml: 存储节点默认启动时的集群规模和数据挂载路径。可以通过修改此文件持久化海量并发测试场景（默认启动 5 个容器节点）。

## 4. 节点接口文档
详细描述 yaoguaiguai_simulator 的输入参数定义与输出字段格式。

Parameter
```
--headless (boolean)
```
用途: 剥离可视化界面开关。
如何使用: 启动时传入该 flag，程序将进入纯后台的高并发计算模式。

```
--devices (int)
```
用途: 本次任务需要并发调度的 R2（智能药盒）目标实例数量。
如何使用: 配合 --headless 使用，默认值为 10。

Output Data Fields (输出数据字段)
```
Delay_Minutes (double)
```
用途: 服药延迟时间矩阵的一维标量，基于高斯分布模型生成（均值 5.0，标准差 3.0）。

```
Nearby_Pharmacy (string)
```
用途: 药店位置距离模拟数据，用于计算 R2（药盒）周边药店的最优获取距离。

<<<<<<< HEAD
运行日志：存入 logs/ygg_running.log。cd C:\Users\liu\anaconda3\envs\my_proejct\YaoGuaiGuai_Simulator
=======
(注：当前版本主要作为离线模拟器与并发测试器使用，暂未对外暴露实时 ROS Topic 或 RESTful API 接口。)

## 5. 测试
暂无 (TODO: 使用 pytest 补充 DataGenerator 核心高斯算法库的单元测试)

## 6. 目录结构 (Directory Structure)
```
yaoguaiguai_simulator/
├── requirements.txt            # 依赖描述
├── README.md                   # 项目文档
├── data/                       # 数据输出目录
│   └── ygg_records.csv
├── logs/                       # 运行日志目录
│   └── ygg_running.log
├── Dockerfile                  # 容器构建配置
├── docker-compose.yml          # 集群编排配置
├── core/                       # 核心算法类接口与实现
│   ├── __init__.py
│   ├── generator.py            # 统计算法与数据生成器
│   ├── device.py               # 单设备线程承载模型
│   └── manager.py              # 多线程调度管理器
├── gui/                        # 用户交互层
│   ├── __init__.py
│   └── main_window.py          # Tkinter 监控大屏逻辑
├── utils/                      # 基础设施层
│   ├── __init__.py
│   └── logger.py               # 工业级双路日志处理器
└── main.py                     # 仅包含入口函数的主脚本
```
## 7. 该仓库维护者

刘又溢
